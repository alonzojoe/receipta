import {
  draft_max_chars,
  image_fallback_edge,
  image_max_edge,
  image_qualities,
  image_source_max_bytes,
  images_max,
} from '@/entities/receipt'

/** The only types that are stored. Decided by the file's bytes, never its name or MIME. */
export type AcceptedImageType = 'image/jpeg' | 'image/png' | 'image/webp'

export type ImageRefusal =
  | 'svg'
  | 'gif'
  | 'heic'
  | 'not_an_image'
  | 'too_large'
  | 'too_many_pixels'
  | 'decode_failed'
  | 'encode_failed'
  | 'still_too_big'
  | 'too_many'
  | 'draft_full'

export type Sniffed =
  | { ok: true; type: AcceptedImageType }
  | { ok: false; reason: 'svg' | 'gif' | 'heic' | 'not_an_image' }

/** How many leading bytes `sniff_image` needs. Enough to see an `<svg` after a prolog. */
export const sniff_bytes = 512

/**
 * How many leading bytes are read to find the dimensions. PNG and WebP keep them in the
 * first 30 bytes. A JPEG keeps them in the frame header, which follows every EXIF, ICC
 * and thumbnail segment, so it needs a longer head. 1 MiB is far beyond any real photo's
 * metadata; a JPEG whose frame header is not within it is reported as unreadable.
 */
export const head_bytes = 1024 * 1024

function starts_with(bytes: Uint8Array, signature: readonly number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value)
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end))
}

// The brands that mark HEIC/HEIF, which most browsers cannot decode. Other `ftyp`
// files (MP4, AVIF) are simply not images we accept.
const heic_brands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1']

/**
 * Identifies a file from its first bytes. A text file renamed `.jpg` is `not_an_image`,
 * and an SVG is refused by name because it can carry scripts and external references.
 */
export function sniff_image(bytes: Uint8Array): Sniffed {
  if (starts_with(bytes, [0xff, 0xd8, 0xff])) return { ok: true, type: 'image/jpeg' }
  if (starts_with(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { ok: true, type: 'image/png' }
  }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return { ok: true, type: 'image/webp' }
  }
  if (ascii(bytes, 0, 4) === 'GIF8') return { ok: false, reason: 'gif' }
  if (ascii(bytes, 4, 8) === 'ftyp') {
    return heic_brands.includes(ascii(bytes, 8, 12))
      ? { ok: false, reason: 'heic' }
      : { ok: false, reason: 'not_an_image' }
  }
  if (ascii(bytes, 0, sniff_bytes).toLowerCase().includes('<svg')) {
    return { ok: false, reason: 'svg' }
  }
  return { ok: false, reason: 'not_an_image' }
}

const u16be = (bytes: Uint8Array, at: number) => (bytes[at] << 8) | bytes[at + 1]
const u32be = (bytes: Uint8Array, at: number) => u16be(bytes, at) * 0x10000 + u16be(bytes, at + 2)
const u16le = (bytes: Uint8Array, at: number) => bytes[at] | (bytes[at + 1] << 8)

function png_size(bytes: Uint8Array): Size | null {
  if (bytes.length < 24 || ascii(bytes, 12, 16) !== 'IHDR') return null
  return { width: u32be(bytes, 16), height: u32be(bytes, 20) }
}

function jpeg_size(bytes: Uint8Array): Size | null {
  let at = 2
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) return null
    const marker = bytes[at + 1]
    if (marker === 0xff) {
      at += 1 // fill byte
      continue
    }
    // Standalone markers carry no length.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      at += 2
      continue
    }
    // Start of scan: the frame header, if there was one, is already behind us.
    if (marker === 0xda || marker === 0xd9) return null
    const length = u16be(bytes, at + 2)
    // SOF0 to SOF15, except DHT (c4), JPG (c8) and DAC (cc), which share the range.
    const is_frame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
    if (is_frame) {
      if (at + 9 > bytes.length) return null
      return { height: u16be(bytes, at + 5), width: u16be(bytes, at + 7) }
    }
    if (length < 2) return null
    at += 2 + length
  }
  return null
}

function webp_size(bytes: Uint8Array): Size | null {
  if (bytes.length < 25) return null
  const kind = ascii(bytes, 12, 16)
  if (kind === 'VP8 ') {
    if (bytes.length < 30) return null
    if (!starts_with(bytes, [0x9d, 0x01, 0x2a], 23)) return null
    return { width: u16le(bytes, 26) & 0x3fff, height: u16le(bytes, 28) & 0x3fff }
  }
  if (kind === 'VP8L') {
    if (bytes[20] !== 0x2f) return null
    const bits = (bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)) >>> 0
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
  }
  if (kind === 'VP8X') {
    if (bytes.length < 30) return null
    const edge = (at: number) => 1 + (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16))
    return { width: edge(24), height: edge(27) }
  }
  return null
}

/**
 * The pixel dimensions a file declares in its header, read without decoding it. `null`
 * when the header is cut short or has no frame header: the caller must treat that as a
 * refusal, never as "small enough". Orientation is not applied; it swaps the edges and
 * cannot change the pixel count.
 */
export function read_image_size(bytes: Uint8Array, type: AcceptedImageType): Size | null {
  if (type === 'image/png') return png_size(bytes)
  if (type === 'image/jpeg') return jpeg_size(bytes)
  return webp_size(bytes)
}

/** A source file over the cap is refused before anything reads or decodes it. */
export function is_source_too_large(size: number) {
  return size > image_source_max_bytes
}

export type Size = { width: number; height: number }

/**
 * Scales to fit `max` on the longest edge, keeping the aspect ratio. Never upscales:
 * an image already within `max` comes back unchanged. Neither edge drops below 1px.
 */
export function fit_within(width: number, height: number, max: number): Size {
  const longest = Math.max(width, height)
  if (longest <= max) return { width, height }
  const scale = max / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export type Attempt = Size & { quality: number }

/**
 * The encode attempts, in order: 800px at quality 0.8 falling to 0.5, then 600px over
 * the same qualities. Attempts that would repeat an earlier width, height and quality
 * are dropped, so a 500px image is not encoded twice at each quality.
 */
export function encode_attempts(width: number, height: number): Attempt[] {
  const seen = new Set<string>()
  const attempts: Attempt[] = []
  for (const edge of [image_max_edge, image_fallback_edge]) {
    const size = fit_within(width, height, edge)
    for (const quality of image_qualities) {
      const key = `${size.width}x${size.height}@${quality}`
      if (seen.has(key)) continue
      seen.add(key)
      attempts.push({ ...size, quality })
    }
  }
  return attempts
}

export type AttachCheck = { ok: true } | { ok: false; reason: 'too_many' | 'draft_full' }

/**
 * Whether one more photo may be attached. `image_count` is the photos already on the
 * receipt, not counting one this attach replaces. `draft_length` is the serialised draft
 * as it is now, without a replaced photo. A data URL is stored verbatim in the JSON, so
 * the draft grows by exactly its length. The user hears "no" at attach time.
 */
export function check_attach(
  image_count: number,
  draft_length: number,
  data_url_length: number,
): AttachCheck {
  if (image_count >= images_max) return { ok: false, reason: 'too_many' }
  if (draft_length + data_url_length > draft_max_chars) return { ok: false, reason: 'draft_full' }
  return { ok: true }
}

/** Plain-language reasons, for an inline field error. */
export const image_refusal_messages: Record<ImageRefusal, string> = {
  svg: 'SVG images are not accepted. Use a JPEG, PNG or WebP photo.',
  gif: 'GIF images are not accepted. Use a JPEG, PNG or WebP photo.',
  heic: 'HEIC photos are not accepted. Take a JPEG instead: on iPhone, Settings, Camera, Formats, Most Compatible.',
  not_an_image: 'That file is not an image. Use a JPEG, PNG or WebP photo.',
  too_large: 'That file is over 10 MB. Choose a smaller photo.',
  too_many_pixels:
    'That photo has too many pixels to open here (over 50 megapixels). Choose a smaller one, or lower the camera resolution.',
  decode_failed: 'That image could not be read. Try a different photo.',
  encode_failed: 'That image could not be processed. Try a different photo.',
  still_too_big:
    'That image is too detailed to shrink enough to save. Try a simpler photo.',
  too_many: 'A receipt can have at most 10 photos. Remove one to add another.',
  draft_full:
    'There is no room left on this device to save another photo. Remove one to add this.',
}
