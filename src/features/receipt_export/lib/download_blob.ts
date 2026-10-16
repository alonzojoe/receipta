/**
 * Long enough that a slow browser has started the download before the URL goes. Revoking
 * in the same tick as the click cancels the download in some browsers.
 */
export const revoke_delay_ms = 4000

/** Hands a blob to the browser as a download: an object URL, a temporary anchor, a revoke. */
export function download_blob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  try {
    anchor.click()
  } finally {
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), revoke_delay_ms)
  }
}
