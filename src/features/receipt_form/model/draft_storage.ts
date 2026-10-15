import { draft_max_chars } from '@/entities/receipt'
import { draft_storage_key } from '@/shared/config/draft_storage_key'

import { has_images, parse_draft, strip_images, type Draft, type DraftError } from './draft_schema'

export type ReadResult =
  | { status: 'none' }
  | { status: 'ok'; draft: Draft }
  | { status: 'unreadable'; reason: DraftError }

export type WriteResult = 'saved' | 'saved_without_photos' | 'not_saved'

/**
 * Reaching `window.localStorage` can itself throw (storage disabled, a sandboxed frame,
 * some private modes), so every use goes through here.
 */
function get_storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/**
 * Reads the saved draft. Never throws. Storage that cannot be reached is `none`, not
 * `unreadable`: there is no draft to be unreadable, and the notice "a saved draft could
 * not be read" would be false. The failed write reports the unavailable storage instead.
 */
export function read_draft(): ReadResult {
  let text: string | null
  try {
    const storage = get_storage()
    if (!storage) return { status: 'none' }
    text = storage.getItem(draft_storage_key)
  } catch {
    return { status: 'none' }
  }
  if (text === null) return { status: 'none' }

  const parsed = parse_draft(text)
  return parsed.ok
    ? { status: 'ok', draft: parsed.draft }
    : { status: 'unreadable', reason: parsed.reason }
}

/**
 * One attempt to store `text`. Any exception is a failed write, so no quota error needs
 * recognising by name (`QuotaExceededError`, code 22 and Firefox's
 * `NS_ERROR_DOM_QUOTA_REACHED` all land here). A write that does not throw is not
 * assumed to have worked: the value is read back, because some environments no-op.
 *
 * Only ever `setItem`. It never removes or clears first, so a failed write leaves the
 * previous value exactly as Web Storage guarantees.
 */
function try_write(text: string): boolean {
  try {
    const storage = get_storage()
    if (!storage) return false
    storage.setItem(draft_storage_key, text)
    return storage.getItem(draft_storage_key) === text
  } catch {
    return false
  }
}

/**
 * Saves the draft, degrading in steps: the full draft, then the same draft without
 * photos (once), then give up. A failure never touches the form's in-memory values.
 *
 * A failed write is non-destructive. A *successful* degraded write is not: it replaces
 * the earlier stored draft, which had photos. That is what the spec asks for.
 *
 * With no photos the retry would write the identical string, so it is skipped and the
 * result is `not_saved`, not a misleading `saved_without_photos`.
 */
export function write_draft(draft: Draft): WriteResult {
  const full = JSON.stringify(draft)
  if (full.length <= draft_max_chars && try_write(full)) return 'saved'

  if (!has_images(draft)) return 'not_saved'

  const without_photos = JSON.stringify(strip_images(draft))
  if (without_photos.length <= draft_max_chars && try_write(without_photos)) {
    return 'saved_without_photos'
  }
  return 'not_saved'
}

/** Removes the saved draft. Returns false when storage could not be reached. */
export function clear_draft(): boolean {
  try {
    const storage = get_storage()
    if (!storage) return false
    storage.removeItem(draft_storage_key)
    return true
  } catch {
    return false
  }
}
