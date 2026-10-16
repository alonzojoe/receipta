import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

import type { ExportKind, ReceiptView } from '@/entities/receipt'

import { classify_error, export_error_message } from './export_errors'
import type { ExportPorts } from './export_ports'
import { run_export, type ExportEnv, type ExportOutcome } from './run_export'

/** What the hook needs from the outside, so a test can hand it stubs. */
export type ExportDependencies = {
  /** Loads the two libraries. In the app this is the dynamic import in `lib/load_ports.ts`. */
  load_ports: () => Promise<ExportPorts>
  run?: (kind: ExportKind, view: ReceiptView, ports: ExportPorts, env?: Partial<ExportEnv>) => Promise<ExportOutcome>
  env?: Partial<ExportEnv>
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
 * simultaneous canvas renders are the fastest way to run a phone out of memory. It never
 * touches form state; it only reads the view it is given.
 *
 * Failure is never silent: every path ends in a saved file or in `error` plus a toast.
 */
export function useReceiptExport(view: ReceiptView, dependencies: ExportDependencies): ReceiptExport {
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
      try {
        // The libraries load on the first click and the promise is kept; a failed load is
        // forgotten so the next click tries again.
        ports.current ??= dependencies.load_ports()
        const loaded = await ports.current.catch((cause: unknown) => {
          ports.current = null
          throw cause
        })
        const outcome = await (dependencies.run ?? run_export)(kind, view, loaded, dependencies.env)
        const text = success_text(kind, outcome)
        set_announcement(text)
        toast.success(text)
      } catch (cause) {
        const failure = classify_error(cause)
        // The raw error goes to the console; nothing is sent anywhere.
        console.error('Receipt export failed', failure.cause ?? cause)
        const message = export_error_message(failure)
        set_error(message)
        toast.error(message)
      } finally {
        running.current = false
        set_busy(null)
      }
    })()
  }

  return { busy, error, announcement, start }
}
