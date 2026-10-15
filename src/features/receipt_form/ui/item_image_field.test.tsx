import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { make_item, make_valid_values, tiny_jpeg } from '@/test/receipt_fixtures'
import { render_form, seed_draft } from '@/test/receipt_form_harness'

import { draft_max_chars } from '@/entities/receipt'

// jsdom cannot decode, draw or encode an image, so the browser adapter is replaced by a
// fake codec. The real pipeline (size check, byte sniffing, the quality ladder) still runs
// around it. WHAT THIS DOES NOT PROVE: that a real file is decoded, oriented and flattened.
// That was checked in a real browser, not here.
const { encode } = vi.hoisted(() => ({
  encode: vi.fn(async () => ({ data_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==', bytes: 100 })),
}))
vi.mock('../lib/canvas_image', () => ({
  canvas_codec: {
    decode: async () => ({ width: 400, height: 300, handle: {} }),
    encode,
    release: () => {},
  },
}))

beforeEach(() => {
  localStorage.clear()
  encode.mockClear()
})

const jpeg_bytes = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10]
const file_input = () => document.querySelector<HTMLInputElement>('input[type=file]')!
const file_of = (bytes: number[] | string, name: string, type = 'image/jpeg') =>
  new File([typeof bytes === 'string' ? bytes : new Uint8Array(bytes)], name, { type })
const errors = () => [...document.querySelectorAll('p.text-destructive')].map((node) => node.textContent)

// `accept` is advisory: a person can pick "All files", so the change event is fired directly
// rather than through userEvent.upload, which would filter the file out by its type.
function attach(file: File, input: HTMLInputElement = file_input()) {
  fireEvent.change(input, { target: { files: [file] } })
}
let view: ReturnType<typeof render_form>

describe('ItemImageField', () => {
  beforeEach(() => {
    seed_draft(2)
    view = render_form()
  })

  it('stores the processed photo, shows an unlabelled thumbnail and offers Replace and Remove', async () => {
    attach(file_of(jpeg_bytes, 'a.jpg'))
    await waitFor(() => expect(document.querySelector('img[src^="data:image/jpeg"]')).not.toBeNull())
    expect(document.querySelector('img[src^="data:image/jpeg"]')).toHaveAttribute('alt', '')
    expect(screen.getByRole('button', { name: 'Replace photo for item 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove photo from item 1' })).toBeInTheDocument()
  })

  it.each([
    ['an SVG', file_of('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'a.svg', 'image/svg+xml'), /SVG/],
    ['a GIF', file_of('GIF89a....', 'a.gif', 'image/gif'), /GIF/],
    ['a HEIC photo', file_of('\0\0\0\x18ftypheic', 'a.heic', 'image/heic'), /HEIC/],
    ['a text file renamed .jpg', file_of('hello, I am not an image', 'a.jpg'), /not an image/],
  ])('refuses %s with a message naming the reason, before decoding', async (_, file, reason) => {
    attach(file)
    await waitFor(() => expect(errors().join(' ')).toMatch(reason))
    expect(document.querySelector('img[src^="data:image/jpeg"]')).toBeNull()
    expect(encode).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Add photo for item 1' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('refuses a file over 10 MB without reading it', async () => {
    const big = file_of(jpeg_bytes, 'big.jpg')
    Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 })
    attach(big)
    await waitFor(() => expect(errors().join(' ')).toMatch(/over 10 MB/))
    expect(encode).not.toHaveBeenCalled()
  })

  it('removes the photo, clears it from the draft on the next save, and returns focus to the attach button', async () => {
    attach(file_of(jpeg_bytes, 'a.jpg'))
    await screen.findByRole('button', { name: 'Remove photo from item 1' })
    await view.user.click(screen.getByRole('button', { name: 'Remove photo from item 1' }))
    expect(document.querySelector('img[src^="data:image/jpeg"]')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add photo for item 1' }))
  })

  it('clears an earlier refusal after a successful attach', async () => {
    attach(file_of('not an image', 'a.jpg'))
    await waitFor(() => expect(errors()).toHaveLength(1))
    attach(file_of(jpeg_bytes, 'b.jpg'))
    await waitFor(() => expect(errors()).toHaveLength(0))
  })
})

describe('ItemImageField limits', () => {
  it('refuses an 11th photo with a message', async () => {
    const items = Array.from({ length: 11 }, (_, index) =>
      make_item({ id: `i${index}`, name: `I${index}`, image: index < 10 ? tiny_jpeg : null }),
    )
    seed_draft(2, make_valid_values({ items }))
    view = render_form()
    attach(file_of(jpeg_bytes, 'a.jpg'), document.querySelectorAll<HTMLInputElement>('input[type=file]')[10])
    await waitFor(() => expect(errors().join(' ')).toMatch(/at most 10 photos/))
    expect(document.querySelectorAll('img[src^="data:image/jpeg"]')).toHaveLength(10)
  })

  it('refuses an attach that would cross the draft guard, and leaves the form unchanged', async () => {
    // Nine photos stored, and the draft padded with long item names until it sits just under
    // the cap, so one more full-size photo cannot fit.
    const roomy = Array.from({ length: 10 }, (_, index) =>
      make_item({
        id: `p${index}`,
        name: index < 9 ? 'N'.repeat(9_900) : 'Target',
        image: index < 9 ? tiny_jpeg : null,
      }),
    )
    seed_draft(2, make_valid_values({ items: roomy, notes: '' }))
    view = render_form()
    // Make the new photo large enough to cross the guard.
    encode.mockResolvedValueOnce({ data_url: `data:image/jpeg;base64,${'B'.repeat(draft_max_chars)}`, bytes: 100 })
    attach(file_of(jpeg_bytes, 'a.jpg'), document.querySelectorAll<HTMLInputElement>('input[type=file]')[9])
    await waitFor(() => expect(errors().join(' ')).toMatch(/no room left/))
    expect(document.querySelectorAll('img[src^="data:image/jpeg"]')).toHaveLength(9)
  })
})
