/**
 * Mobile Safari caps a canvas at roughly 16.7 million pixels. 16,000,000 leaves a margin
 * under it. One constant, so a forced-small run can override it through the parameter.
 */
export const max_canvas_pixels = 16_000_000

/** The image export: 2x of the 600 px document is 1200 px wide, one phone screen. */
export const image_ratio_preferred = 2
/** Never lower than this: below 1.5x the text is soft enough to be a wrong file. */
export const image_ratio_floor = 1.5
/** A PDF page: 3x, 1800 px across, about 218 dpi on A4. Each page is about 4.6 M pixels. */
export const page_ratio_preferred = 3

export type RatioRequest = {
  /** Document width in CSS px. */
  width: number
  /** Document height in CSS px. */
  height: number
  preferred: number
  floor: number
  max_pixels?: number
}

export type RatioChoice =
  | { ok: true; ratio: number }
  | { ok: false; reason: 'too_large' | 'invalid' }

/** Whole pixels of a canvas: each side rounded up, so the size is never underestimated. */
export function scaled_size(width: number, height: number, ratio: number) {
  return { width: Math.ceil(width * ratio), height: Math.ceil(height * ratio) }
}

function pixels_at(width: number, height: number, ratio: number) {
  const size = scaled_size(width, height, ratio)
  return size.width * size.height
}

/**
 * The pixel ratio to rasterise at. The preferred ratio when the canvas fits; otherwise the
 * largest ratio, in hundredths and rounded down, whose area fits; under the floor, it
 * fails rather than make a soft file. The ratio is found in whole hundredths so rounding
 * can only ever lower it, never push the area over.
 */
export function choose_pixel_ratio(request: RatioRequest): RatioChoice {
  const { width, height, preferred, floor } = request
  const max_pixels = request.max_pixels ?? max_canvas_pixels
  const valid = [width, height, preferred, floor, max_pixels].every((value) => Number.isFinite(value) && value > 0)
  if (!valid) return { ok: false, reason: 'invalid' }

  if (pixels_at(width, height, preferred) <= max_pixels) return { ok: true, ratio: preferred }

  let hundredths = Math.floor(Math.sqrt(max_pixels / (width * height)) * 100)
  while (hundredths > 0 && pixels_at(width, height, hundredths / 100) > max_pixels) hundredths -= 1
  const ratio = hundredths / 100
  if (hundredths === 0 || ratio < floor) return { ok: false, reason: 'too_large' }
  return { ok: true, ratio }
}
