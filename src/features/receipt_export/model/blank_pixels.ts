/**
 * True only when every pixel is opaque white. Transparent white is not white paper: the
 * export always paints an opaque background, so a transparent pixel means the paint failed.
 *
 * An empty strip, or one that is not a whole number of RGBA pixels, is reported as blank:
 * it holds nothing that proves content, and "blank" is the answer that refuses the file.
 */
export function is_strip_blank(rgba: Uint8ClampedArray) {
  if (rgba.length === 0 || rgba.length % 4 !== 0) return true
  for (let index = 0; index < rgba.length; index += 4) {
    if (rgba[index] !== 255 || rgba[index + 1] !== 255 || rgba[index + 2] !== 255 || rgba[index + 3] !== 255) {
      return false
    }
  }
  return true
}

export type Strip = { top: number; rows: number }

/** The horizontal strips that cover `height` rows, `rows_per_strip` at a time. */
export function strip_ranges(height: number, rows_per_strip: number): Strip[] {
  if (!Number.isInteger(height) || height <= 0) return []
  const step = Number.isInteger(rows_per_strip) && rows_per_strip > 0 ? rows_per_strip : height
  const strips: Strip[] = []
  for (let top = 0; top < height; top += step) strips.push({ top, rows: Math.min(step, height - top) })
  return strips
}

/** About 1 M pixels (4 MB) per read, so a 13 M pixel canvas is never copied whole. */
export const strip_pixels = 1_000_000

export type StripReader = (top: number, rows: number) => Uint8ClampedArray

/**
 * True when the whole canvas is blank. Reads one strip at a time and stops at the first
 * strip with a non-white pixel, so a real receipt exits after the first strip or two.
 */
export function is_canvas_blank(width: number, height: number, read_strip: StripReader) {
  const rows_per_strip = Math.max(1, Math.floor(strip_pixels / Math.max(1, width)))
  const strips = strip_ranges(height, rows_per_strip)
  if (strips.length === 0) return true
  return strips.every((strip) => is_strip_blank(read_strip(strip.top, strip.rows)))
}

/**
 * True when the top row and the bottom row of the canvas are opaque white. The document has a
 * 40 px margin all round, so on a correctly painted export both rows are pure paper. This is
 * what turns a transparent canvas (never painted) into a failure: `is_canvas_blank` would
 * call it "has content", because transparent is not white.
 */
export function has_paper_margins(width: number, height: number, read_strip: StripReader) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return false
  return is_strip_blank(read_strip(0, 1)) && is_strip_blank(read_strip(height - 1, 1))
}
