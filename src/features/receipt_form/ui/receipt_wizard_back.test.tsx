import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render_form, whole_flow_timeout } from '@/test/receipt_form_harness'

// jsdom cannot decode or encode an image, so the browser adapter is replaced by a fake
// codec, as in item_image_field.test.tsx. It proves the photo survives navigation. It does
// not prove a real photo is processed correctly: that was checked in a real browser.
const photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='
vi.mock('../lib/canvas_image', () => ({
  canvas_codec: {
    decode: async () => ({ width: 400, height: 300, handle: {} }),
    encode: async () => ({ data_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==', bytes: 100 }),
    release: () => {},
  },
}))

beforeEach(() => {
  localStorage.clear()
})

const next = () => screen.getByRole('button', { name: 'Next' })
const back = () => screen.getByRole('button', { name: 'Back' })
const heading = () => screen.getAllByRole('heading', { level: 2 })[0]
const control = (name: string) => document.querySelector<HTMLInputElement>(`[name="${name}"]`)!
const checked_radio = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[type=radio][name="${name}"]:checked`)?.value

/** Every value the three input steps hold, read off the controls the user sees. */
function read_step(step: 'Parties' | 'Items' | 'Payment') {
  expect(heading()).toHaveTextContent(step)
  if (step === 'Parties') {
    return {
      issuer_type: checked_radio('issuer_type'),
      issuer_name: control('issuer_name').value,
      recipient_type: checked_radio('recipient_type'),
      recipient_name: control('recipient_name').value,
    }
  }
  if (step === 'Items') {
    return {
      first: [control('items[0].name').value, control('items[0].quantity').value, control('items[0].price').value],
      second: [control('items[1].name').value, control('items[1].quantity').value, control('items[1].price').value],
      photos: [...document.querySelectorAll('img[src^="data:image/jpeg"]')].map((img) => img.getAttribute('src')),
      discount: control('discount').value,
    }
  }
  return {
    method: screen.getByRole('combobox', { name: /Payment method/ }).textContent,
    reference: control('reference_no').value,
    date: control('receipt_date').value,
    notes: control('notes').value,
  }
}

describe('Back keeps everything (criterion 7), typed through the UI', () => {
  it('fills every step including a photo, goes back to step 1, finds every value, and returns to Review unchanged', async () => {
    const { user } = render_form()

    // Parties
    await user.click(screen.getAllByRole('radio', { name: 'Organization' })[1])
    await user.type(control('issuer_name'), 'Juan Dela Cruz')
    await user.type(control('recipient_name'), 'Acme Trading')
    const parties = read_step('Parties')
    expect(parties).toMatchObject({ issuer_name: 'Juan Dela Cruz', recipient_name: 'Acme Trading' })
    await user.click(next())

    // Items: two rows, a photo on the first, and a discount
    await user.type(control('items[0].name'), 'Logo design')
    await user.type(control('items[0].price'), '1500')
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    await user.type(control('items[1].name'), 'Printing')
    await user.clear(control('items[1].quantity'))
    await user.type(control('items[1].quantity'), '3')
    await user.type(control('items[1].price'), '20')
    await user.type(control('discount'), '10')
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type=file]')!, {
      target: { files: [new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10])], 'a.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() => expect(document.querySelector(`img[src="${photo}"]`)).not.toBeNull())
    const items = read_step('Items')
    expect(items.photos).toEqual([photo])
    await user.click(next())

    // Payment
    await user.click(screen.getByRole('combobox', { name: /Payment method/ }))
    await user.keyboard('maya{Enter}')
    await user.type(control('reference_no'), 'REF-42')
    fireEvent.change(control('receipt_date'), { target: { value: '2026-10-01' } })
    await user.type(control('notes'), 'Thank you')
    const payment = read_step('Payment')
    expect(payment).toMatchObject({ method: expect.stringContaining('Maya'), reference: 'REF-42', date: '2026-10-01', notes: 'Thank you' })
    await user.click(next())

    expect(heading()).toHaveTextContent('Review')
    const review = document.querySelector('form')!.textContent
    expect(review).toContain('Juan Dela Cruz')
    expect(review).toContain('Printing')
    expect(document.querySelector(`img[src="${photo}"]`)).not.toBeNull()

    // Back to step 1, checking each step on the way. Nothing is retyped.
    await user.click(back())
    expect(read_step('Payment')).toEqual(payment)
    await user.click(back())
    expect(read_step('Items')).toEqual(items)
    await user.click(back())
    expect(read_step('Parties')).toEqual(parties)

    // And forward to Review again: the same summary, the same photo.
    await user.click(next())
    expect(read_step('Items')).toEqual(items)
    await user.click(next())
    expect(read_step('Payment')).toEqual(payment)
    await user.click(next())
    expect(heading()).toHaveTextContent('Review')
    expect(document.querySelector('form')!.textContent).toBe(review)
    expect(document.querySelector(`img[src="${photo}"]`)).not.toBeNull()
  }, whole_flow_timeout)
})
