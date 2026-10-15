/**
 * Just enough of each image format to carry a header with chosen dimensions. None of
 * these decodes; they exist so the pipeline's header reading can be tested.
 */

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0))
const u16be = (value: number) => [(value >> 8) & 0xff, value & 0xff]
const u32be = (value: number) => [(value >>> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
const u16le = (value: number) => [value & 0xff, (value >> 8) & 0xff]
const u24le = (value: number) => [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff]

export function make_png_bytes(width: number, height: number): number[] {
  return [
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...u32be(13), ...ascii('IHDR'), ...u32be(width), ...u32be(height), 8, 6, 0, 0, 0,
  ]
}

/** `padding` is the length of an APP1 (EXIF) segment placed before the frame header. */
export function make_jpeg_bytes(width: number, height: number, padding = 0): number[] {
  const app1 = padding > 0 ? [0xff, 0xe1, ...u16be(padding + 2), ...new Array<number>(padding).fill(0)] : []
  const sof0 = [0xff, 0xc0, ...u16be(11), 8, ...u16be(height), ...u16be(width), 1, 1, 0x11, 0]
  return [0xff, 0xd8, 0xff, 0xe0, ...u16be(16), ...ascii('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0, ...app1, ...sof0]
}

const riff = (chunk: number[]) => [...ascii('RIFF'), ...u32be(chunk.length + 4).reverse(), ...ascii('WEBP'), ...chunk]

export function make_webp_lossy_bytes(width: number, height: number): number[] {
  return riff([
    ...ascii('VP8 '), 10, 0, 0, 0,
    0x10, 0, 0, 0x9d, 0x01, 0x2a, ...u16le(width), ...u16le(height),
  ])
}

export function make_webp_lossless_bytes(width: number, height: number): number[] {
  const bits = (width - 1) | ((height - 1) << 14)
  return riff([...ascii('VP8L'), 5, 0, 0, 0, 0x2f, bits & 0xff, (bits >> 8) & 0xff, (bits >> 16) & 0xff, (bits >>> 24) & 0xff])
}

export function make_webp_extended_bytes(width: number, height: number): number[] {
  return riff([...ascii('VP8X'), 10, 0, 0, 0, 0, 0, 0, 0, ...u24le(width - 1), ...u24le(height - 1)])
}
