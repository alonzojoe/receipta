import { describe, expect, it } from 'vitest'

import { draft_max_chars } from '@/entities/receipt'

import {
  check_attach,
  encode_attempts,
  fit_within,
  image_refusal_messages,
  is_source_too_large,
  sniff_image,
} from './image_policy'

function bytes(...values: number[]) {
  return Uint8Array.from(values)
}

function text(value: string) {
  return new TextEncoder().encode(value)
}

function padded(head: Uint8Array, length = 64) {
  const out = new Uint8Array(length)
  out.set(head)
  return out
}

const png_signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

describe('sniff_image', () => {
  it('accepts a JPEG, a PNG and a WebP by their bytes', () => {
    expect(sniff_image(padded(bytes(0xff, 0xd8, 0xff, 0xe0)))).toEqual({
      ok: true,
      type: 'image/jpeg',
    })
    expect(sniff_image(padded(bytes(...png_signature)))).toEqual({
      ok: true,
      type: 'image/png',
    })
    const webp = padded(bytes(...text('RIFF'), 0x24, 0, 0, 0, ...text('WEBPVP8 ')))
    expect(sniff_image(webp)).toEqual({ ok: true, type: 'image/webp' })
  })

  it('refuses an SVG, with or without an XML prolog and BOM', () => {
    expect(sniff_image(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toEqual({
      ok: false,
      reason: 'svg',
    })
    expect(
      sniff_image(text('<?xml version="1.0"?>\n<!-- hi -->\n<SVG width="1"></SVG>')),
    ).toEqual({ ok: false, reason: 'svg' })
  })

  it('refuses a GIF', () => {
    expect(sniff_image(padded(text('GIF89a')))).toEqual({ ok: false, reason: 'gif' })
    expect(sniff_image(padded(text('GIF87a')))).toEqual({ ok: false, reason: 'gif' })
  })

  it('refuses a HEIC by its ftyp brand', () => {
    for (const brand of ['heic', 'heix', 'mif1']) {
      const head = padded(bytes(0, 0, 0, 0x18, ...text('ftyp'), ...text(brand)))
      expect(sniff_image(head)).toEqual({ ok: false, reason: 'heic' })
    }
  })

  it('refuses other ftyp files as not an image', () => {
    const mp4 = padded(bytes(0, 0, 0, 0x18, ...text('ftyp'), ...text('isom')))
    expect(sniff_image(mp4)).toEqual({ ok: false, reason: 'not_an_image' })
  })

  it('refuses plain text, which is what a renamed .jpg really is', () => {
    expect(sniff_image(text('This is just my notes file'))).toEqual({
      ok: false,
      reason: 'not_an_image',
    })
    expect(sniff_image(new Uint8Array(0))).toEqual({ ok: false, reason: 'not_an_image' })
  })

  it('does not take a RIFF that is not WebP for a WebP', () => {
    const wav = padded(bytes(...text('RIFF'), 0x24, 0, 0, 0, ...text('WAVEfmt ')))
    expect(sniff_image(wav)).toEqual({ ok: false, reason: 'not_an_image' })
  })

  it('gives the four refusals four different messages', () => {
    const reasons = ['svg', 'gif', 'heic', 'not_an_image'] as const
    expect(new Set(reasons.map((reason) => image_refusal_messages[reason])).size).toBe(4)
  })
})

describe('is_source_too_large', () => {
  it('allows exactly 10 MB and refuses one byte more', () => {
    expect(is_source_too_large(10 * 1024 * 1024)).toBe(false)
    expect(is_source_too_large(10 * 1024 * 1024 + 1)).toBe(true)
  })
})

describe('fit_within', () => {
  it('never upscales a small image', () => {
    expect(fit_within(300, 200, 800)).toEqual({ width: 300, height: 200 })
  })

  it('leaves an image of exactly 800 alone', () => {
    expect(fit_within(800, 600, 800)).toEqual({ width: 800, height: 600 })
    expect(fit_within(500, 800, 800)).toEqual({ width: 500, height: 800 })
  })

  it('scales a landscape image by its width', () => {
    expect(fit_within(4000, 3000, 800)).toEqual({ width: 800, height: 600 })
  })

  it('scales a portrait image by its height', () => {
    expect(fit_within(3000, 4000, 800)).toEqual({ width: 600, height: 800 })
  })

  it('keeps a 1px edge from rounding to 0', () => {
    expect(fit_within(10_000, 1, 800)).toEqual({ width: 800, height: 1 })
    expect(fit_within(1, 10_000, 800)).toEqual({ width: 1, height: 800 })
  })

  it('treats 801 as needing a shrink', () => {
    expect(fit_within(801, 801, 800)).toEqual({ width: 800, height: 800 })
  })
})

describe('encode_attempts', () => {
  it('runs 800px at 0.8 down to 0.5, then 600px over the same qualities', () => {
    const attempts = encode_attempts(4000, 3000)
    expect(attempts).toEqual([
      { width: 800, height: 600, quality: 0.8 },
      { width: 800, height: 600, quality: 0.7 },
      { width: 800, height: 600, quality: 0.6 },
      { width: 800, height: 600, quality: 0.5 },
      { width: 600, height: 450, quality: 0.8 },
      { width: 600, height: 450, quality: 0.7 },
      { width: 600, height: 450, quality: 0.6 },
      { width: 600, height: 450, quality: 0.5 },
    ])
  })

  it('never upscales and does not repeat an identical attempt for a small image', () => {
    const attempts = encode_attempts(500, 300)
    expect(attempts).toHaveLength(4)
    expect(attempts.every((attempt) => attempt.width === 500 && attempt.height === 300)).toBe(
      true,
    )
  })

  it('keeps the 600px rung for an image between 600 and 800', () => {
    const attempts = encode_attempts(700, 700)
    expect(attempts.map((attempt) => attempt.width)).toEqual([700, 700, 700, 700, 600, 600, 600, 600])
  })
})

describe('check_attach', () => {
  it('refuses the 11th image and accepts the 10th', () => {
    expect(check_attach(9, 1000, 100)).toEqual({ ok: true })
    expect(check_attach(10, 1000, 100)).toEqual({ ok: false, reason: 'too_many' })
  })

  it('accepts an attach that lands exactly on the guard and refuses one character over', () => {
    expect(check_attach(0, draft_max_chars - 5000, 5000)).toEqual({ ok: true })
    expect(check_attach(0, draft_max_chars - 5000, 5001)).toEqual({
      ok: false,
      reason: 'draft_full',
    })
  })

  it('reports the count before the budget when both fail', () => {
    expect(check_attach(10, draft_max_chars, 1).ok).toBe(false)
    expect(check_attach(10, draft_max_chars, 1)).toMatchObject({ reason: 'too_many' })
  })
})
