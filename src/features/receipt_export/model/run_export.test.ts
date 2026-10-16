import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { page_usable_height, paginate_receipt } from '@/entities/receipt'
import { make_item, make_view, tiny_photo } from '@/test/document_fixtures'

import { ExportFailure, export_error_message, classify_error, type ExportError } from './export_errors'
import type { ExportPorts, RenderedCanvas } from './export_ports'
import type { MeasureResult, Units } from './measure_layout'
import { export_timeout_ms, paper_background, run_export, type ExportEnv } from './run_export'
import type { AssetFailure } from './wait_for_assets'

const ink = new Uint8ClampedArray([15, 23, 42, 255])
/** The row the stub draws its text on. Rows 0 and height - 1 are the margin: pure white. */
const ink_row = 100

function make_canvas(overrides: Partial<RenderedCanvas> = {}): RenderedCanvas {
  return {
    width: 1200,
    height: 1000,
    to_blob: vi.fn(async () => new Blob(['png-bytes'])),
    read_strip: vi.fn((top: number, rows: number) => {
      // White paper with one inked pixel on one row, like a page of text.
      const bytes = new Uint8ClampedArray(rows * 1200 * 4).fill(255)
      if (top <= ink_row && ink_row < top + rows) bytes.set(ink, (ink_row - top) * 4 * 1200)
      return bytes
    }),
    release: vi.fn(),
    ...overrides,
  }
}

function make_ports(overrides: Partial<ExportPorts> = {}) {
  const ports: ExportPorts = {
    rasterise: vi.fn(async () => make_canvas()),
    assemble_pdf: vi.fn(async () => new Blob(['pdf-bytes'])),
    save: vi.fn(),
    ...overrides,
  }
  // The defaults are mocks; a test that passes its own function does not read `.mock` from it.
  return {
    rasterise: vi.mocked(ports.rasterise),
    assemble_pdf: vi.mocked(ports.assemble_pdf),
    save: vi.mocked(ports.save),
  }
}

const units: Units = {
  first_head: 260,
  continuation_head: 71,
  foot_band: 53,
  indicator: 30,
  tail: 300,
  totals: 130,
  rows: Array<number>(30).fill(72),
}

const disposals = vi.fn()

function make_env(overrides: Partial<ExportEnv> = {}): ExportEnv {
  return {
    mount: vi.fn(() => ({ node: document.createElement('div'), dispose: disposals })),
    wait: vi.fn(async (): Promise<AssetFailure[]> => []),
    measure_units: vi.fn((): MeasureResult => ({ ok: true, units })),
    measure_document: vi.fn(() => 5400),
    measure_page: vi.fn(() => 700),
    timeout_ms: export_timeout_ms,
    ...overrides,
  }
}

const view = make_view()
const expected_pages = (() => {
  const plan = paginate_receipt({ ...units })
  if (!plan.ok) throw new Error('fixture must paginate')
  return plan.pages.length
})()

async function failure_of(promise: Promise<unknown>): Promise<ExportError> {
  try {
    await promise
  } catch (cause) {
    expect(cause).toBeInstanceOf(ExportFailure)
    return classify_error(cause)
  }
  throw new Error('expected the export to fail')
}

beforeEach(() => {
  disposals.mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('the image export', () => {
  it('rasterises the document once at 2x, white, 600 wide, and saves receipta-<no>.png', async () => {
    const ports = make_ports()
    const outcome = await run_export('png', view, ports, make_env())
    expect(ports.rasterise).toHaveBeenCalledTimes(1)
    expect(ports.rasterise).toHaveBeenCalledWith(expect.any(HTMLElement), {
      ratio: 2,
      background: paper_background,
      width: 600,
      height: 5400,
    })
    expect(ports.save).toHaveBeenCalledTimes(1)
    expect(ports.save).toHaveBeenCalledWith(expect.any(Blob), 'receipta-REF-20261016-154212.png')
    expect(outcome).toEqual({ filename: 'receipta-REF-20261016-154212.png', warnings: [] })
  })

  it('paints an opaque keyword white: not transparent, not absent, not a hex', async () => {
    const ports = make_ports()
    await run_export('png', view, ports, make_env())
    const options = ports.rasterise.mock.calls[0][1]
    expect(options.background).toBe('white')
    expect(options.background).not.toBe('transparent')
  })

  it('frees the canvas and the node once it is done', async () => {
    const canvas = make_canvas()
    await run_export('png', view, make_ports({ rasterise: vi.fn(async () => canvas) }), make_env())
    expect(canvas.release).toHaveBeenCalled()
    expect(disposals).toHaveBeenCalled()
  })
})

describe('the PDF export', () => {
  it('hands assemble_pdf one image per page, in order, titled Receipt <no>, and saves receipta-<no>.pdf', async () => {
    const ports = make_ports()
    const pages: string[] = []
    ports.rasterise.mockImplementation(async () => {
      pages.push(`page ${pages.length + 1}`)
      return make_canvas({ to_blob: async () => new Blob([`page ${pages.length}`]) })
    })
    const outcome = await run_export('pdf', view, ports, make_env())
    expect(expected_pages).toBeGreaterThan(2)
    expect(ports.rasterise).toHaveBeenCalledTimes(expected_pages)
    const [images, options] = ports.assemble_pdf.mock.calls[0]
    expect(images).toHaveLength(expected_pages)
    const texts = images.map((image) => new TextDecoder().decode(image.png))
    expect(texts).toEqual(pages)
    expect(options).toEqual({ title: 'Receipt REF-20261016-154212' })
    expect(options).not.toHaveProperty('author')
    expect(JSON.stringify(options)).not.toMatch(/Juan|Mabini/)
    expect(ports.save).toHaveBeenCalledWith(expect.any(Blob), 'receipta-REF-20261016-154212.pdf')
    expect(outcome.filename).toBe('receipta-REF-20261016-154212.pdf')
  })

  it('rasterises each page at 3x, white, at the page size', async () => {
    const ports = make_ports()
    await run_export('pdf', view, ports, make_env())
    for (const [, options] of ports.rasterise.mock.calls) {
      expect(options).toEqual({ ratio: 3, background: 'white', width: 600, height: 849 })
    }
  })

  it('has only one canvas alive at a time: each page is released before the next is made', async () => {
    const alive = new Set<number>()
    let peak = 0
    let made = 0
    const ports = make_ports({
      rasterise: vi.fn(async () => {
        const id = (made += 1)
        alive.add(id)
        peak = Math.max(peak, alive.size)
        return make_canvas({ release: () => alive.delete(id) })
      }),
    })
    await run_export('pdf', view, ports, make_env())
    expect(made).toBe(expected_pages)
    expect(peak).toBe(1)
    expect(alive.size).toBe(0)
  })

  it('frees the measurement instance before the first canvas exists', async () => {
    const order: string[] = []
    const env = make_env({
      mount: vi.fn(() => ({ node: document.createElement('div'), dispose: () => order.push('dispose') })),
    })
    const ports = make_ports({
      rasterise: vi.fn(async () => {
        order.push('rasterise')
        return make_canvas()
      }),
    })
    await run_export('pdf', view, ports, env)
    expect(order.indexOf('dispose')).toBeGreaterThanOrEqual(0)
    expect(order.indexOf('dispose')).toBeLessThan(order.indexOf('rasterise'))
  })

  it('does not paginate by a guess: the pages come from the measured heights', async () => {
    const short = make_env({ measure_units: () => ({ ok: true, units: { ...units, rows: [72, 72] } }) })
    const ports = make_ports()
    await run_export('pdf', view, ports, short)
    expect(ports.rasterise).toHaveBeenCalledTimes(1)
    expect(ports.assemble_pdf.mock.calls[0][0]).toHaveLength(1)
  })
})

describe('waiting before capture (criterion 60)', () => {
  it('does not rasterise until an image decode has resolved', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const env = make_env({ wait: vi.fn(async () => { await gate; return [] }) })
    const ports = make_ports()
    const running = run_export('png', view, ports, env)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(ports.rasterise).not.toHaveBeenCalled()
    release()
    await running
    expect(ports.rasterise).toHaveBeenCalledTimes(1)
  })

  it('measures only after the wait, never before', async () => {
    const order: string[] = []
    const env = make_env({
      wait: vi.fn(async () => { order.push('wait'); return [] }),
      measure_units: vi.fn(() => { order.push('measure'); return { ok: true as const, units } }),
    })
    await run_export('pdf', view, make_ports(), env)
    expect(order.slice(0, 2)).toEqual(['wait', 'measure'])
  })
})

describe('the captured node (criterion 59), with the real mount', () => {
  it('is unscaled, hidden from assistive technology, and gone afterwards', async () => {
    const seen: { aria: boolean; inert: boolean; transforms: string[]; mounted: boolean }[] = []
    const ports = make_ports({
      rasterise: vi.fn(async (node: HTMLElement) => {
        const transforms: string[] = []
        for (let element: HTMLElement | null = node; element; element = element.parentElement) {
          transforms.push(element.style.transform)
        }
        const container = node.parentElement as HTMLElement
        seen.push({
          aria: container.getAttribute('aria-hidden') === 'true',
          inert: container.hasAttribute('inert'),
          transforms,
          mounted: document.body.contains(node),
        })
        return make_canvas()
      }),
    })
    const { mount: _unused, ...stubbed } = make_env()
    void _unused
    await run_export('png', view, ports, { ...stubbed, measure_document: () => 1000 })
    expect(seen).toEqual([{ aria: true, inert: true, transforms: expect.any(Array), mounted: true }])
    expect(seen[0].transforms.every((value) => value === '')).toBe(true)
    expect(document.querySelector('[data-receipt-export]')).toBeNull()
  })

  it('is removed even when the rasteriser throws', async () => {
    const { mount: _unused, ...stubbed } = make_env()
    void _unused
    const ports = make_ports({ rasterise: vi.fn(async () => { throw new Error('boom') }) })
    await expect(run_export('png', view, ports, stubbed)).rejects.toThrow('boom')
    expect(document.querySelector('[data-receipt-export]')).toBeNull()
  })
})

describe('failure: no wrong file is ever handed over (criteria 62 to 68)', () => {
  it('blocks on an unreadable item photo and names the item', async () => {
    const ports = make_ports()
    const env = make_env({ wait: async () => [{ kind: 'photo', item: 3 }] })
    const error = await failure_of(run_export('png', make_view({ items: [make_item({ image: tiny_photo })] }), ports, env))
    expect(error).toMatchObject({ kind: 'photo_unreadable', item: 3 })
    expect(export_error_message(error)).toBe(
      'The photo for item 3 could not be read. Remove it and attach it again, then try again.',
    )
    expect(ports.save).not.toHaveBeenCalled()
    expect(ports.rasterise).not.toHaveBeenCalled()
  })

  it('names the lowest item when several photos fail', async () => {
    const env = make_env({ wait: async () => [{ kind: 'photo', item: 5 }, { kind: 'photo', item: 2 }] })
    expect(await failure_of(run_export('pdf', view, make_ports(), env))).toMatchObject({ item: 2 })
  })

  it('degrades on a failed logo: the file is saved and the warning names the logo', async () => {
    const ports = make_ports()
    const env = make_env({ wait: async () => [{ kind: 'payment_logo' }, { kind: 'receipta_logo' }] })
    const outcome = await run_export('png', view, ports, env)
    expect(ports.save).toHaveBeenCalledTimes(1)
    expect(outcome.warnings).toEqual(['The GCash logo could not be loaded.', 'The Receipta logo could not be loaded.'])
  })

  it('reports a logo that failed on a page of a PDF once', async () => {
    let calls = 0
    const env = make_env({ wait: async () => (calls++ === 0 ? [] : [{ kind: 'receipta_logo' as const }]) })
    const outcome = await run_export('pdf', view, make_ports(), env)
    expect(outcome.warnings).toEqual(['The Receipta logo could not be loaded.'])
  })

  it('fails and saves nothing when the rasteriser throws', async () => {
    const ports = make_ports({ rasterise: vi.fn(async () => { throw new Error('boom') }) })
    await expect(run_export('png', view, ports, make_env())).rejects.toThrow('boom')
    expect(ports.save).not.toHaveBeenCalled()
    expect(classify_error(new Error('boom')).kind).toBe('unknown')
  })

  it('classifies an allocation failure as too large', async () => {
    const ports = make_ports({ rasterise: vi.fn(async () => { throw new RangeError('Array buffer allocation failed') }) })
    const cause = await run_export('png', view, ports, make_env()).catch((error: unknown) => error)
    expect(classify_error(cause).kind).toBe('too_large')
    expect(ports.save).not.toHaveBeenCalled()
  })

  it('refuses a null blob as too large, for both kinds', async () => {
    for (const kind of ['png', 'pdf'] as const) {
      const ports = make_ports({ rasterise: vi.fn(async () => make_canvas({ to_blob: async () => null })) })
      const error = await failure_of(run_export(kind, view, ports, make_env()))
      expect(error.kind).toBe('too_large')
      expect(export_error_message(error)).toMatch(/too large to make as an image/)
      expect(ports.save).not.toHaveBeenCalled()
    }
  })

  it('refuses an empty blob', async () => {
    const ports = make_ports({ rasterise: vi.fn(async () => make_canvas({ to_blob: async () => new Blob([]) })) })
    expect((await failure_of(run_export('png', view, ports, make_env()))).kind).toBe('unknown')
    expect(ports.save).not.toHaveBeenCalled()
  })

  it('refuses a blank (all white) canvas, for both kinds', async () => {
    for (const kind of ['png', 'pdf'] as const) {
      const ports = make_ports({
        rasterise: vi.fn(async () => make_canvas({ read_strip: (_top, rows) => new Uint8ClampedArray(rows * 4).fill(255) })),
      })
      const error = await failure_of(run_export(kind, view, ports, make_env()))
      expect(error.kind).toBe('blank')
      expect(export_error_message(error)).toBe('The file could not be created. Your receipt is safe. Try again.')
      expect(ports.save).not.toHaveBeenCalled()
    }
  })

  it('refuses a transparent canvas, which is not white paper', async () => {
    const ports = make_ports({ rasterise: vi.fn(async () => make_canvas({ read_strip: (_t, rows) => new Uint8ClampedArray(rows * 4) })) })
    expect((await failure_of(run_export('png', view, ports, make_env()))).kind).toBe('blank')
  })

  it('refuses a canvas whose margin is not opaque white, even if it has ink', async () => {
    const tinted = make_canvas({
      read_strip: (top, rows) => {
        const bytes = new Uint8ClampedArray(rows * 4).fill(255)
        if (top === 0 && rows === 1) bytes.fill(250)
        return bytes
      },
    })
    const ports = make_ports({ rasterise: async () => tinted })
    expect((await failure_of(run_export('png', view, ports, make_env()))).kind).toBe('blank')
    expect(ports.save).not.toHaveBeenCalled()
  })

  it('reads the canvas in strips and stops at the first inked pixel', async () => {
    const canvas = make_canvas({ width: 1200, height: 10_800 })
    await run_export('png', view, make_ports({ rasterise: async () => canvas }), make_env())
    const strips = vi.mocked(canvas.read_strip).mock.calls.filter(([, rows]) => rows > 1)
    expect(strips).toHaveLength(1)
  })

  it('refuses an empty PDF', async () => {
    const ports = make_ports({ assemble_pdf: vi.fn(async () => new Blob([])) })
    expect((await failure_of(run_export('pdf', view, ports, make_env()))).kind).toBe('unknown')
    expect(ports.save).not.toHaveBeenCalled()
  })

  it('fails with the generic message when a height cannot be measured, and does not paginate', async () => {
    const ports = make_ports()
    const env = make_env({ measure_units: () => ({ ok: false, missing: 'tail' }) })
    const error = await failure_of(run_export('pdf', view, ports, env))
    expect(error.kind).toBe('unmeasured')
    expect(export_error_message(error)).toBe('The file could not be created. Your receipt is safe. Try again.')
    expect(ports.rasterise).not.toHaveBeenCalled()
    expect(ports.save).not.toHaveBeenCalled()
  })

  it('fails the image export when the document height is unreadable', async () => {
    const ports = make_ports()
    expect((await failure_of(run_export('png', view, ports, make_env({ measure_document: () => undefined })))).kind).toBe('unmeasured')
    expect(ports.rasterise).not.toHaveBeenCalled()
  })

  it('fails when a page renders taller than its budget, instead of clipping a line', async () => {
    const ports = make_ports()
    const env = make_env({ measure_page: () => page_usable_height + 1 })
    expect((await failure_of(run_export('pdf', view, ports, env))).kind).toBe('unknown')
    expect(ports.rasterise).not.toHaveBeenCalled()
    expect(ports.save).not.toHaveBeenCalled()
  })

  it('accepts a page that fills the budget exactly', async () => {
    const ports = make_ports()
    await run_export('pdf', view, ports, make_env({ measure_page: () => page_usable_height }))
    expect(ports.save).toHaveBeenCalled()
  })

  it('fails when the pages cannot be planned (a row taller than a page)', async () => {
    const env = make_env({ measure_units: () => ({ ok: true, units: { ...units, rows: [5000, 72] } }) })
    const ports = make_ports()
    expect((await failure_of(run_export('pdf', view, ports, env))).kind).toBe('unknown')
    expect(ports.save).not.toHaveBeenCalled()
  })
})

describe('the canvas budget is wired to the pixels (criteria 45, 46)', () => {
  it('lowers the ratio passed to the rasteriser when the area limit is small', async () => {
    const ports = make_ports()
    // 600 x 5400 at 2x is 12.96 M; a 8 M limit allows about 1.57x.
    await run_export('png', view, ports, make_env({ max_pixels: 8_000_000 }))
    const { ratio } = ports.rasterise.mock.calls[0][1]
    expect(ratio).toBeLessThan(2)
    expect(ratio).toBeGreaterThanOrEqual(1.5)
    expect(Math.ceil(600 * ratio) * Math.ceil(5400 * ratio)).toBeLessThanOrEqual(8_000_000)
  })

  it('fails as too large, with no file, when even 1.5x does not fit', async () => {
    const ports = make_ports()
    const error = await failure_of(run_export('png', view, ports, make_env({ max_pixels: 1_000_000 })))
    expect(error.kind).toBe('too_large')
    expect(ports.rasterise).not.toHaveBeenCalled()
    expect(ports.save).not.toHaveBeenCalled()
  })

  it('applies the same budget to a PDF page', async () => {
    const ports = make_ports()
    // A page is 600 x 849: 3x is 4.59 M. A 3 M limit allows about 2.43x.
    await run_export('pdf', view, ports, make_env({ max_pixels: 3_000_000 }))
    for (const [, options] of ports.rasterise.mock.calls) expect(options.ratio).toBeLessThan(3)
  })
})

describe('the 30 second timeout (criterion 65)', () => {
  it('fails with timed_out, frees everything, and ignores a late result', async () => {
    vi.useFakeTimers()
    let finish!: (canvas: RenderedCanvas) => void
    const ports = make_ports({ rasterise: vi.fn(() => new Promise<RenderedCanvas>((resolve) => (finish = resolve))) })
    const late = make_canvas()
    const running = failure_of(run_export('png', view, ports, make_env()))
    await vi.advanceTimersByTimeAsync(export_timeout_ms - 1)
    expect(ports.save).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    const error = await running
    expect(error.kind).toBe('timed_out')
    expect(export_error_message(error)).toBe('Making the file took too long. Try again.')
    expect(disposals).toHaveBeenCalled()

    finish(late)
    await vi.advanceTimersByTimeAsync(10)
    expect(ports.save).not.toHaveBeenCalled()
    expect(late.release).toHaveBeenCalled()
  })

  it('also covers a stage before the rasteriser', async () => {
    vi.useFakeTimers()
    const env = make_env({ wait: () => new Promise<AssetFailure[]>(() => undefined) })
    const running = failure_of(run_export('pdf', view, make_ports(), env))
    await vi.advanceTimersByTimeAsync(export_timeout_ms)
    expect((await running).kind).toBe('timed_out')
  })

  it('does not fire after a run that finished', async () => {
    vi.useFakeTimers()
    const ports = make_ports()
    await run_export('png', view, ports, make_env())
    await vi.advanceTimersByTimeAsync(export_timeout_ms * 2)
    expect(ports.save).toHaveBeenCalledTimes(1)
  })
})

describe('no path ends with neither a file nor a message (criterion 68)', () => {
  const cases: [string, 'png' | 'pdf', () => { ports: ExportPorts; env: ExportEnv }][] = [
    ['rasteriser throws', 'png', () => ({ ports: make_ports({ rasterise: vi.fn(async () => { throw new Error('x') }) }), env: make_env() })],
    ['null blob', 'pdf', () => ({ ports: make_ports({ rasterise: vi.fn(async () => make_canvas({ to_blob: async () => null })) }), env: make_env() })],
    ['blank canvas', 'png', () => ({ ports: make_ports({ rasterise: vi.fn(async () => make_canvas({ read_strip: (_t, r) => new Uint8ClampedArray(r * 4).fill(255) })) }), env: make_env() })],
    ['photo', 'pdf', () => ({ ports: make_ports(), env: make_env({ wait: async () => [{ kind: 'photo', item: 1 }] }) })],
    ['unmeasured', 'pdf', () => ({ ports: make_ports(), env: make_env({ measure_units: () => ({ ok: false, missing: 'x' }) }) })],
    ['page overflow', 'pdf', () => ({ ports: make_ports(), env: make_env({ measure_page: () => 9999 }) })],
    ['assembly throws', 'pdf', () => ({ ports: make_ports({ assemble_pdf: vi.fn(async () => { throw new Error('x') }) }), env: make_env() })],
    ['too large', 'png', () => ({ ports: make_ports(), env: make_env({ max_pixels: 1000 }) })],
    ['success', 'png', () => ({ ports: make_ports(), env: make_env() })],
  ]

  it.each(cases)('%s ends with a save or an error, never neither, never both', async (_name, kind, build) => {
    const { ports, env } = build()
    const result = await run_export(kind, view, ports, env).then(
      () => 'saved',
      () => 'error',
    )
    if (result === 'saved') expect(ports.save).toHaveBeenCalledTimes(1)
    else expect(ports.save).not.toHaveBeenCalled()
  })
})
