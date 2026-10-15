import { image_max_bytes, image_max_pixels } from '@/entities/receipt'

import {
  encode_attempts,
  head_bytes,
  is_source_too_large,
  read_image_size,
  sniff_image,
  type ImageRefusal,
} from './image_policy'

/**
 * What the pipeline needs from a browser. Injected, so the ladder logic is tested with
 * fakes. The real implementation is the browser adapter beside this file, which only
 * a real browser can exercise: jsdom draws nothing and decodes nothing.
 */
export type ImageCodec<Handle> = {
  /** Decodes with EXIF orientation applied, so width and height are as displayed. */
  decode: (file: Blob) => Promise<{ width: number; height: number; handle: Handle }>
  /** Draws on a white background at the given size and encodes as JPEG. */
  encode: (
    handle: Handle,
    width: number,
    height: number,
    quality: number,
  ) => Promise<{ data_url: string; bytes: number }>
  /** Frees whatever `decode` allocated. Called once, success or failure. */
  release: (handle: Handle) => void
}

export type ProcessedImage = {
  ok: true
  data_url: string
  bytes: number
  width: number
  height: number
  quality: number
}

export type ImageResult = ProcessedImage | { ok: false; reason: ImageRefusal }

async function read_head(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, head_bytes).arrayBuffer())
}

/**
 * Runs a file through the checks and the quality ladder: refuse by size before reading,
 * identify by bytes, refuse by declared pixel count, decode, then encode at 800px q0.8 down to q0.5, then 600px, stopping
 * at the first result within 120 KB. Nothing over the limit is ever returned.
 */
export async function process_image<Handle>(
  file: Blob,
  codec: ImageCodec<Handle>,
): Promise<ImageResult> {
  if (is_source_too_large(file.size)) return { ok: false, reason: 'too_large' }

  let head: Uint8Array
  try {
    head = await read_head(file)
  } catch {
    return { ok: false, reason: 'decode_failed' }
  }
  const sniffed = sniff_image(head)
  if (!sniffed.ok) return { ok: false, reason: sniffed.reason }

  // Refused by declared size before anything is decoded: decoding allocates width x height
  // x 4 bytes, and a few KB of PNG or JPEG can declare tens of thousands of pixels a side.
  // That allocation can kill the tab, which no catch below could turn into a refusal.
  const declared = read_image_size(head, sniffed.type)
  if (!declared || !(declared.width > 0 && declared.height > 0)) {
    return { ok: false, reason: 'decode_failed' }
  }
  if (declared.width * declared.height > image_max_pixels) {
    return { ok: false, reason: 'too_many_pixels' }
  }

  let decoded: Awaited<ReturnType<typeof codec.decode>>
  try {
    decoded = await codec.decode(file)
  } catch {
    return { ok: false, reason: 'decode_failed' }
  }

  try {
    const { width, height, handle } = decoded
    if (!(width > 0 && height > 0)) return { ok: false, reason: 'decode_failed' }

    for (const attempt of encode_attempts(width, height)) {
      let encoded: Awaited<ReturnType<typeof codec.encode>>
      try {
        encoded = await codec.encode(handle, attempt.width, attempt.height, attempt.quality)
      } catch {
        return { ok: false, reason: 'encode_failed' }
      }
      if (encoded.bytes <= image_max_bytes) {
        return {
          ok: true,
          data_url: encoded.data_url,
          bytes: encoded.bytes,
          width: attempt.width,
          height: attempt.height,
          quality: attempt.quality,
        }
      }
    }
    return { ok: false, reason: 'still_too_big' }
  } finally {
    codec.release(decoded.handle)
  }
}
