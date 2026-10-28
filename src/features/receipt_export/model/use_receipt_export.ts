import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

import type { ExportKind, ReceiptView } from '@/entities/receipt'

import { classify_error, export_error_message, ExportFailure } from './export_errors'
import type { ExportPorts } from './export_ports'
import { run_export, type ExportEnv, type ExportOutcome } from './run_export'

/** What the hook needs from the outside, so a test can hand it stubs. */
export type ExportDependencies = {
  /** Loads the two libraries. In the app this is the dynamic import in `lib/load_ports.ts`. */
  load_ports: () => Promise<ExportPorts>
  run?: (kind: ExportKind, view: ReceiptView, ports: ExportPorts, env?: Partial<ExportEnv>) => Promise<ExportOutcome>
  env?: Partial<ExportEnv>
  /** How long the libraries may take to arrive before the click fails. Default 15 s. */
  load_timeout_ms?: number
  /**
   * How long to keep the buttons blocked for a timed-out export whose abandoned work has not
   * settled, before giving up on it so the button is not dead for good. Default 20 s.
   */
  abandon_grace_ms?: number
}

export const load_timeout_ms = 15_000
export const abandon_grace_ms = 20_000

/** The load, or a `load_failed` failure if it rejects or does not answer in time. */
function load_within(load: () => Promise<ExportPorts>, ms: number) {
  return new Promise<ExportPorts>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ExportFailure({ kind: 'load_failed', cause: 'timed out' })), ms)
    load().then(
      (loaded) => {
        clearTimeout(timer)
        resolve(loaded)
      },
      (cause: unknown) => {
        clearTimeout(timer)
        reject(new ExportFailure({ kind: 'load_failed', cause }))
      },
    )
  })
}

/** Resolves when `settled` does, or after `ms`, whichever is first. */
function settled_or_after(settled: Promise<void>, ms: number) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    void settled.then(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}

const created_text: Record<ExportKind, string> = { pdf: 'PDF created', png: 'Image created' }

/**
 * "created", not "saved": a browser decides where a download goes, and on iOS it may open a
 * viewer instead, so "saved to Downloads" would be a claim the app cannot know. A logo that
 * could not be loaded is added, so the user knows which part of the file is missing.
 */
export function success_text(kind: ExportKind, outcome: ExportOutcome) {
  return [created_text[kind], ...outcome.warnings].join(' ')
}

export type ReceiptExport = {
  /** The export running now, or null. */
  busy: ExportKind | null
  /** The message for the last failure. Stays until the next attempt starts. */
  error: string | null
  /** The success text; the same string goes to the toast. */
  announcement: string
  start: (kind: ExportKind) => void
}

/**
 * Busy, error and announcement state for the two download buttons. One export at a time: two
 * simultaneous canvas renders are the fastest way to run a phone out of memory. That holds
 * after a timeout too: the abandoned run is waited for (up to a grace period) before another
 * may start. It never
 * touches form state; it only reads the view it is given.
 *
 * Failure is never silent: every path ends in a saved file or in `error` plus a toast.
 */
/**
 * `on_success` fires only after a file has actually been saved. The caller uses it to offer
 * a fresh start, and offering that after a FAILED export - when the user has nothing - is
 * the worst possible timing, which is why this is not simply "after start finishes".
 */
export function useReceiptExport(
  view: ReceiptView,
  dependencies: ExportDependencies,
  on_success?: () => void,
): ReceiptExport {
  const [busy, set_busy] = useState<ExportKind | null>(null)
  const [error, set_error] = useState<string | null>(null)
  const [announcement, set_announcement] = useState('')
  const running = useRef(false)
  const ports = useRef<Promise<ExportPorts> | null>(null)
  function start(kind: ExportKind) {
    // A ref, not state: a second click in the same tick must be ignored too.
    if (running.current) return
    running.current = true
    set_busy(kind)
    set_error(null)
    set_announcement('')

    void (async () => {
      // Set in the try and acted on after it. A callback called INSIDE the try would, if it
      // ever threw, land in the catch and show an error toast and alert for a file that was
      // saved - the user told their export failed while holding the file.
      let saved = false

      try {
        // The libraries load on the first click and the promise is kept; a failed load is
        // forgotten so the next click tries again.
        ports.current ??= load_within(dependencies.load_ports, dependencies.load_timeout_ms ?? load_timeout_ms)
        const loaded = await ports.current.catch((cause: unknown) => {
          ports.current = null
          throw cause
        })
        const outcome = await (dependencies.run ?? run_export)(kind, view, loaded, dependencies.env)
        const text = success_text(kind, outcome)
        set_announcement(text)
        toast.success(text)
        saved = true
      } catch (cause) {
        const failure = classify_error(cause)
        // The raw error goes to the console; nothing is sent anywhere.
        console.error('Receipt export failed', failure.cause ?? cause)
        const message = export_error_message(failure)
        set_error(message)
        toast.error(message)
        // The libraries cannot be cancelled, so a timed-out run may still hold its canvas. The
        // user has been told; the buttons stay blocked until that work ends, or a grace period
        // passes, so a run that never ends cannot leave the buttons dead for good.
        if (cause instanceof ExportFailure && cause.settled) {
          await settled_or_after(cause.settled, dependencies.abandon_grace_ms ?? abandon_grace_ms)
        }
      } finally {
        running.current = false
        set_busy(null)
      }

      if (saved) on_success?.()
    })()
  }

  return { busy, error, announcement, start }
}
