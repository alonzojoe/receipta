/** What went wrong, as the user can act on it. The raw error rides along for the console. */
export type ExportError = (
  // `item` is 1-based, as the user counts items.
  | { kind: 'photo_unreadable'; item: number }
  | { kind: 'too_large' }
  | { kind: 'timed_out' }
  /** The two libraries could not be fetched: offline, or a request that never answered. */
  | { kind: 'load_failed' }
  | { kind: 'blank' }
  | { kind: 'unmeasured' }
  | { kind: 'unknown' }
) & { cause?: unknown }

/** The pipeline throws this for a failure it understands, so nothing is guessed from text. */
export class ExportFailure extends Error {
  readonly error: ExportError
  /**
   * Only on a timeout: settles when the abandoned work has actually finished. The libraries
   * cannot be cancelled, so the run keeps its canvas until then, and the caller should not
   * start another while it does.
   */
  readonly settled?: Promise<void>

  constructor(error: ExportError, settled?: Promise<void>) {
    super(`Export failed: ${error.kind}`)
    this.name = 'ExportFailure'
    this.error = error
    this.settled = settled
  }
}

const allocation_message = /allocation|out of memory|invalid (?:typed )?array length|array buffer/i
const memory_error_names = new Set(['QuotaExceededError'])

/** Reads name and message off anything error-shaped. `instanceof` fails across realms
 * (an iframe's `RangeError` is not this window's), and the rasteriser works in one. */
function error_shape(cause: unknown) {
  if (typeof cause !== 'object' || cause === null) return undefined
  const { name, message } = cause as { name?: unknown; message?: unknown }
  return { name: typeof name === 'string' ? name : '', message: typeof message === 'string' ? message : '' }
}

function is_allocation_failure(cause: unknown) {
  const shape = error_shape(cause)
  if (!shape) return false
  if (memory_error_names.has(shape.name)) return true
  return shape.name === 'RangeError' && allocation_message.test(shape.message)
}

/**
 * Sorts anything thrown into one of the kinds above. A failure the pipeline raised itself
 * keeps its kind; a memory failure (a `RangeError` from an allocation, or a quota error)
 * is "too large"; everything else is `unknown`. Anything unrecognised stays unknown rather
 * than being guessed at, so the user is told the generic thing and the console has the rest.
 */
export function classify_error(cause: unknown): ExportError {
  if (cause instanceof ExportFailure) return cause.error
  if (is_allocation_failure(cause)) return { kind: 'too_large', cause }
  return { kind: 'unknown', cause }
}

/**
 * What a finished raster must satisfy before it is handed over. A `null` blob is what a
 * canvas over the platform's limit gives, so it reads as "too large"; an empty one is a
 * failure with no better name.
 */
export function blob_problem(blob: { size: number } | null): ExportError | undefined {
  if (blob === null) return { kind: 'too_large' }
  if (blob.size <= 0) return { kind: 'unknown' }
  return undefined
}

const generic_message = 'The file could not be created. Your receipt is safe. Try again.'

/** The four messages the spec gives, byte for byte, and one for a failed library load. */
export function export_error_message(error: ExportError) {
  switch (error.kind) {
    case 'photo_unreadable':
      return `The photo for item ${error.item} could not be read. Remove it and attach it again, then try again.`
    case 'too_large':
      return 'This receipt is too large to make as an image on this device. Try fewer photos, or download the PDF.'
    case 'timed_out':
      return 'Making the file took too long. Try again.'
    case 'load_failed':
      return 'The export tools could not be loaded. Check your connection and try again.'
    case 'blank':
    case 'unmeasured':
    case 'unknown':
      return generic_message
  }
}
