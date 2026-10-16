import { createElement, type ReactElement } from 'react'

import {
  build_export_filename,
  page_height,
  page_usable_height,
  page_width,
  paginate_receipt,
  ReceiptDocument,
  ReceiptMeasure,
  ReceiptPage,
  type ExportKind,
  type ReceiptView,
} from '@/entities/receipt'

import { mount_offscreen, type Mounted } from '../lib/mount_offscreen'
import { image_ratio_floor, image_ratio_preferred, choose_pixel_ratio, page_ratio_preferred } from './canvas_budget'
import { has_paper_margins, is_canvas_blank } from './blank_pixels'
import { blob_problem, ExportFailure, type ExportError } from './export_errors'
import type { ExportPorts, PageImage, RenderedCanvas } from './export_ports'
import { measure_document, measure_page_content, measure_units, type MeasureResult } from './measure_layout'
import { wait_for_assets, type AssetFailure } from './wait_for_assets'

/**
 * The paper colour handed to the rasteriser. The keyword, not a hex: `white` is exactly
 * #FFFFFF, it passes the repository's colour-literal rule, and the pixel comparison proves
 * the result. It is opaque, so the file has no transparent pixel whatever the node does.
 */
export const paper_background = 'white'

export const export_timeout_ms = 30_000

export type ExportOutcome = {
  filename: string
  /** Sentences for the success message: a logo that could not be loaded. */
  warnings: string[]
}

/** The parts of the run that touch the DOM, replaceable so a test can use stubs. */
export type ExportEnv = {
  mount: (element: ReactElement) => Mounted
  wait: (node: HTMLElement) => Promise<AssetFailure[]>
  measure_units: (node: HTMLElement) => MeasureResult
  measure_document: (node: HTMLElement) => number | undefined
  measure_page: (node: HTMLElement) => number | undefined
  timeout_ms: number
  /** Overrides the canvas area limit. Used by the forced-small-limit run. */
  max_pixels?: number
}

export const default_env: ExportEnv = {
  mount: (element) => mount_offscreen(element),
  wait: (node) => wait_for_assets(node),
  measure_units: (node) => measure_units(node),
  measure_document: (node) => measure_document(node),
  measure_page: (node) => measure_page_content(node),
  timeout_ms: export_timeout_ms,
}

/** Everything that must be freed whether the run finishes, fails or times out. */
function make_scope() {
  const cleanups: (() => void)[] = []
  return {
    mount(env: ExportEnv, element: ReactElement) {
      const mounted = env.mount(element)
      cleanups.push(mounted.dispose)
      return mounted
    },
    canvas(canvas: RenderedCanvas) {
      cleanups.push(canvas.release)
      return canvas
    },
    free() {
      while (cleanups.length > 0) cleanups.pop()?.()
    },
  }
}

type Scope = ReturnType<typeof make_scope>

function fail(error: ExportError): never {
  throw new ExportFailure(error)
}

/** A photo that did not decode blocks the export: dropping it silently changes the content. */
function check_photos(failures: AssetFailure[]) {
  const photos = failures.flatMap((failure) => (failure.kind === 'photo' ? [failure.item] : []))
  if (photos.length > 0) fail({ kind: 'photo_unreadable', item: Math.min(...photos) })
}

/** A logo that did not load degrades: the name or the words carry on, and the user is told. */
function logo_warnings(failures: AssetFailure[], view: ReceiptView) {
  return failures.flatMap((failure) => {
    if (failure.kind === 'payment_logo') return [`The ${view.payment.name} logo could not be loaded.`]
    if (failure.kind === 'receipta_logo') return ['The Receipta logo could not be loaded.']
    return []
  })
}

/**
 * Checks a finished raster before it is handed over, so no wrong file ever is: a `null`
 * blob (what a canvas over the platform's limit gives), an empty one, and a canvas that is
 * all white (a real receipt has text). The blank test reads strips and stops at the first
 * non-white pixel.
 */
async function checked_blob(canvas: RenderedCanvas) {
  const blob = await canvas.to_blob()
  const problem = blob_problem(blob)
  if (problem || blob === null) fail(problem ?? { kind: 'unknown' })
  // The first and last rows are the 40 px margin: opaque white paper in every real receipt.
  // A transparent or tinted edge means the paper was not painted (criterion 20).
  if (!has_paper_margins(canvas.width, canvas.height, canvas.read_strip)) fail({ kind: 'blank' })
  if (is_canvas_blank(canvas.width, canvas.height, canvas.read_strip)) fail({ kind: 'blank' })
  return blob
}

async function export_image(
  view: ReceiptView,
  ports: ExportPorts,
  env: ExportEnv,
  scope: Scope,
  alive: () => void,
): Promise<ExportOutcome> {
  const document_node = scope.mount(env, createElement(ReceiptDocument, { view }))
  const failures = await env.wait(document_node.node)
  alive()
  check_photos(failures)

  const height = env.measure_document(document_node.node)
  if (height === undefined) fail({ kind: 'unmeasured' })

  const choice = choose_pixel_ratio({
    width: page_width,
    height,
    preferred: image_ratio_preferred,
    floor: image_ratio_floor,
    max_pixels: env.max_pixels,
  })
  if (!choice.ok) fail({ kind: choice.reason === 'too_large' ? 'too_large' : 'unmeasured' })

  const canvas = scope.canvas(
    await ports.rasterise(document_node.node, {
      ratio: choice.ratio,
      background: paper_background,
      width: page_width,
      height,
    }),
  )
  alive()
  document_node.dispose()

  const blob = await checked_blob(canvas)
  alive()
  canvas.release()

  const filename = build_export_filename(view.receipt_no, 'png')
  ports.save(blob, filename)
  return { filename, warnings: logo_warnings(failures, view) }
}

async function export_pdf(
  view: ReceiptView,
  ports: ExportPorts,
  env: ExportEnv,
  scope: Scope,
  alive: () => void,
): Promise<ExportOutcome> {
  // 1. Measure the document and the units that exist only on later pages, then free it
  //    before any large canvas is allocated.
  const measure_node = scope.mount(env, createElement(ReceiptMeasure, { view }))
  const failures = await env.wait(measure_node.node)
  alive()
  check_photos(failures)
  const measured = env.measure_units(measure_node.node)
  if (!measured.ok) fail({ kind: 'unmeasured', cause: measured.missing })
  measure_node.dispose()

  // 2. Paginate: a pure function of those heights.
  const { units } = measured
  const plan = paginate_receipt({ ...units })
  if (!plan.ok) fail(plan.reason === 'unmeasured' ? { kind: 'unmeasured' } : { kind: 'unknown', cause: plan.reason })

  // 3. One page at a time: mount, wait, check it fits, raster, encode, free.
  const warnings = new Set(logo_warnings(failures, view))
  const images: PageImage[] = []
  const count = plan.pages.length
  for (const [index, page] of plan.pages.entries()) {
    const mounted = scope.mount(env, createElement(ReceiptPage, { view, page, number: index + 1, count }))
    const page_failures = await env.wait(mounted.node)
    alive()
    check_photos(page_failures)
    logo_warnings(page_failures, view).forEach((warning) => warnings.add(warning))

    // Pagination is exact for the heights it was given. If the page wraps differently from the
    // measurement (a late font, a rule that applies to only one), say so instead of exporting
    // a clipped line.
    const used = env.measure_page(mounted.node)
    if (used === undefined) fail({ kind: 'unmeasured' })
    if (used > page_usable_height) fail({ kind: 'unknown', cause: `page ${index + 1} is ${used} px, budget ${page_usable_height}` })

    const choice = choose_pixel_ratio({
      width: page_width,
      height: page_height,
      preferred: page_ratio_preferred,
      floor: image_ratio_floor,
      max_pixels: env.max_pixels,
    })
    if (!choice.ok) fail({ kind: choice.reason === 'too_large' ? 'too_large' : 'unmeasured' })

    const canvas = scope.canvas(
      await ports.rasterise(mounted.node, {
        ratio: choice.ratio,
        background: paper_background,
        width: page_width,
        height: page_height,
      }),
    )
    alive()
    mounted.dispose()

    const blob = await checked_blob(canvas)
    images.push({ png: new Uint8Array(await blob.arrayBuffer()) })
    alive()
    canvas.release()
  }

  // 4. Assemble and hand over, only if every check above passed.
  const pdf = await ports.assemble_pdf(images, { title: `Receipt ${view.receipt_no}` })
  alive()
  const problem = blob_problem(pdf)
  if (problem) fail(problem)

  const filename = build_export_filename(view.receipt_no, 'pdf')
  ports.save(pdf, filename)
  return { filename, warnings: [...warnings] }
}

/**
 * Makes the file and hands it over, or throws an `ExportFailure` the caller can show. It
 * never saves unless every check passed: that is the rule that no wrong file is ever handed
 * over. The whole run has a 30 second budget; the libraries cannot be cancelled, so on
 * timeout the result is ignored, the nodes and canvases are freed at once, and nothing is
 * saved even if a library resolves later.
 */
export async function run_export(
  kind: ExportKind,
  view: ReceiptView,
  ports: ExportPorts,
  overrides: Partial<ExportEnv> = {},
): Promise<ExportOutcome> {
  const env: ExportEnv = { ...default_env, ...overrides }
  const scope = make_scope()
  let live = true
  const alive = () => {
    if (!live) fail({ kind: 'timed_out' })
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      live = false
      scope.free()
      reject(new ExportFailure({ kind: 'timed_out' }))
    }, env.timeout_ms)
  })

  const work = (kind === 'pdf' ? export_pdf : export_image)(view, ports, env, scope, alive).finally(() => scope.free())
  // If the timeout wins, `work` may still settle later: its outcome is ignored.
  work.catch(() => undefined)

  try {
    return await Promise.race([work, timeout])
  } finally {
    clearTimeout(timer)
  }
}
