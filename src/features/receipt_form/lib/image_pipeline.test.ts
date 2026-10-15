import { describe, expect, it, vi, type Mock } from 'vitest'

import { image_max_bytes } from '@/entities/receipt'
import { make_jpeg_bytes, make_png_bytes } from '@/test/image_fixtures'

import { process_image, type ImageCodec } from './image_pipeline'

const jpeg_head = make_jpeg_bytes(4000, 3000)

function make_file(head: number[] = jpeg_head, name = 'photo.jpg') {
  return new File([Uint8Array.from(head)], name, { type: 'image/jpeg' })
}

type Codec = ImageCodec<string>
type Fake = {
  decode: Mock<Codec['decode']>
  encode: Mock<Codec['encode']>
  release: Mock<Codec['release']>
}

/** A codec whose encode answers from `size_of(width, quality)`, recording every call. */
function make_codec(
  size_of: (width: number, quality: number) => number,
  dimensions = { width: 4000, height: 3000 },
): Fake {
  return {
    decode: vi.fn<Codec['decode']>(async () => ({ ...dimensions, handle: 'bitmap' })),
    encode: vi.fn<Codec['encode']>(async (_handle, width, _height, quality) => ({
      data_url: `data:image/jpeg;base64,${width}-${quality}`,
      bytes: size_of(width, quality),
    })),
    release: vi.fn<Codec['release']>(),
  }
}

function calls(codec: Fake) {
  return codec.encode.mock.calls.map(([, width, height, quality]) => [width, height, quality])
}

describe('process_image: the ladder', () => {
  it('stops at the first attempt within the limit: 800px at 0.8', async () => {
    const codec = make_codec(() => 90 * 1024)
    const result = await process_image(make_file(), codec)

    expect(result).toMatchObject({ ok: true, width: 800, height: 600, quality: 0.8 })
    expect(calls(codec)).toEqual([[800, 600, 0.8]])
  })

  it('accepts exactly 120 KB and refuses one byte more', async () => {
    const exact = await process_image(make_file(), make_codec(() => image_max_bytes))
    expect(exact.ok).toBe(true)

    const over = make_codec((_width, quality) => (quality === 0.8 ? image_max_bytes + 1 : 1))
    const result = await process_image(make_file(), over)
    expect(result).toMatchObject({ ok: true, quality: 0.7 })
  })

  it('lowers quality at 800px before it lowers the size', async () => {
    const codec = make_codec((_width, quality) => (quality <= 0.6 ? 100 * 1024 : 200 * 1024))
    const result = await process_image(make_file(), codec)

    expect(calls(codec)).toEqual([
      [800, 600, 0.8],
      [800, 600, 0.7],
      [800, 600, 0.6],
    ])
    expect(result).toMatchObject({ ok: true, width: 800, quality: 0.6 })
  })

  it('drops to 600px only after 0.5 at 800px has failed', async () => {
    const codec = make_codec((width) => (width === 600 ? 100 * 1024 : 200 * 1024))
    const result = await process_image(make_file(), codec)

    expect(calls(codec)).toEqual([
      [800, 600, 0.8],
      [800, 600, 0.7],
      [800, 600, 0.6],
      [800, 600, 0.5],
      [600, 450, 0.8],
    ])
    expect(result).toMatchObject({ ok: true, width: 600, height: 450, quality: 0.8 })
  })

  it('rejects when nothing fits, trying every rung exactly once, and never returns over the limit', async () => {
    const codec = make_codec(() => 500 * 1024)
    const result = await process_image(make_file(), codec)

    expect(result).toEqual({ ok: false, reason: 'still_too_big' })
    expect(calls(codec)).toHaveLength(8)
    expect(calls(codec).at(-1)).toEqual([600, 450, 0.5])
  })

  it('never upscales an image already under 800px', async () => {
    const codec = make_codec(() => 10 * 1024, { width: 300, height: 200 })
    const result = await process_image(make_file(), codec)

    expect(calls(codec)).toEqual([[300, 200, 0.8]])
    expect(result).toMatchObject({ ok: true, width: 300, height: 200 })
  })

  it('uses the dimensions decode reports, which already account for orientation', async () => {
    const codec = make_codec(() => 10 * 1024, { width: 3000, height: 4000 })
    const result = await process_image(make_file(), codec)
    expect(result).toMatchObject({ ok: true, width: 600, height: 800 })
  })

  it('returns the encoder data url and byte count untouched', async () => {
    const codec = make_codec(() => 1234)
    const result = await process_image(make_file(), codec)
    expect(result).toMatchObject({
      ok: true,
      data_url: 'data:image/jpeg;base64,800-0.8',
      bytes: 1234,
    })
  })
})

describe('process_image: refusals before decoding', () => {
  it('refuses 10 MB plus one byte without calling decode', async () => {
    const file = make_file()
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 + 1 })
    const codec = make_codec(() => 1)

    expect(await process_image(file, codec)).toEqual({ ok: false, reason: 'too_large' })
    expect(codec.decode).not.toHaveBeenCalled()
    expect(codec.encode).not.toHaveBeenCalled()
  })

  it('accepts a file of exactly 10 MB', async () => {
    const file = make_file()
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 })
    const codec = make_codec(() => 1)
    expect((await process_image(file, codec)).ok).toBe(true)
  })

  it.each([
    ['svg', Array.from(new TextEncoder().encode('<svg xmlns="x"></svg>'))],
    ['gif', Array.from(new TextEncoder().encode('GIF89a......'))],
    ['heic', [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]],
    ['not_an_image', Array.from(new TextEncoder().encode('just some text'))],
  ])('refuses %s by its bytes and never decodes it', async (reason, head) => {
    const codec = make_codec(() => 1)
    // Named .jpg and typed image/jpeg: neither is trusted.
    const result = await process_image(make_file(head, 'photo.jpg'), codec)

    expect(result).toEqual({ ok: false, reason })
    expect(codec.decode).not.toHaveBeenCalled()
  })
})

describe('process_image: the pixel budget, checked from the header before decoding', () => {
  const refused_unread = async (bytes: number[], name: string) => {
    const codec = make_codec(() => 1)
    const file = new File([Uint8Array.from(bytes)], name)
    return { result: await process_image(file, codec), codec }
  }

  it('refuses a tiny PNG that declares 60000 x 60000 pixels, without decoding', async () => {
    const bytes = make_png_bytes(60_000, 60_000)
    expect(bytes.length).toBeLessThan(100)
    const { result, codec } = await refused_unread(bytes, 'bomb.png')
    expect(result).toEqual({ ok: false, reason: 'too_many_pixels' })
    expect(codec.decode).not.toHaveBeenCalled()
  })

  it('refuses a tiny JPEG that declares 65000 x 65000 pixels, without decoding', async () => {
    const { result, codec } = await refused_unread(make_jpeg_bytes(65_000, 65_000), 'bomb.jpg')
    expect(result).toEqual({ ok: false, reason: 'too_many_pixels' })
    expect(codec.decode).not.toHaveBeenCalled()
  })

  it('still finds the size when a large EXIF segment pushes the frame header past 512 bytes', async () => {
    const { result, codec } = await refused_unread(make_jpeg_bytes(65_000, 65_000, 60_000), 'bomb.jpg')
    expect(result).toEqual({ ok: false, reason: 'too_many_pixels' })
    expect(codec.decode).not.toHaveBeenCalled()
  })

  it('accepts exactly 50 megapixels and refuses one pixel more', async () => {
    const at_limit = await refused_unread(make_png_bytes(10_000, 5_000), 'a.png')
    expect(at_limit.result.ok).toBe(true)
    const over = await refused_unread(make_png_bytes(5_000, 10_001), 'b.png')
    expect(over.result).toEqual({ ok: false, reason: 'too_many_pixels' })
  })

  it('accepts a typical phone photo, 48 megapixels', async () => {
    const { result } = await refused_unread(make_jpeg_bytes(8000, 6000), 'a.jpg')
    expect(result.ok).toBe(true)
  })

  it('refuses, rather than guesses, when the header has no readable dimensions', async () => {
    const { result, codec } = await refused_unread([0xff, 0xd8, 0xff, 0xe0, 0, 0x10], 'a.jpg')
    expect(result).toEqual({ ok: false, reason: 'decode_failed' })
    expect(codec.decode).not.toHaveBeenCalled()
  })
})

describe('process_image: failures in the browser', () => {
  it('reports decode_failed when decode throws, and has nothing to release', async () => {
    const codec = make_codec(() => 1)
    codec.decode.mockRejectedValue(new Error('corrupt'))
    expect(await process_image(make_file(), codec)).toEqual({
      ok: false,
      reason: 'decode_failed',
    })
    expect(codec.release).not.toHaveBeenCalled()
  })

  it('reports decode_failed for a zero-sized decode', async () => {
    const codec = make_codec(() => 1, { width: 0, height: 0 })
    expect(await process_image(make_file(), codec)).toEqual({
      ok: false,
      reason: 'decode_failed',
    })
    expect(codec.release).toHaveBeenCalledTimes(1)
  })

  it('reports encode_failed when encode throws', async () => {
    const codec = make_codec(() => 1)
    codec.encode.mockRejectedValue(new Error('no jpeg'))
    expect(await process_image(make_file(), codec)).toEqual({
      ok: false,
      reason: 'encode_failed',
    })
  })

  it('releases the decoded image exactly once on success, rejection and failure', async () => {
    const ok = make_codec(() => 1)
    await process_image(make_file(), ok)
    expect(ok.release).toHaveBeenCalledTimes(1)
    expect(ok.release).toHaveBeenCalledWith('bitmap')

    const big = make_codec(() => 500 * 1024)
    await process_image(make_file(), big)
    expect(big.release).toHaveBeenCalledTimes(1)

    const broken = make_codec(() => 1)
    broken.encode.mockRejectedValue(new Error('x'))
    await process_image(make_file(), broken)
    expect(broken.release).toHaveBeenCalledTimes(1)
  })
})
