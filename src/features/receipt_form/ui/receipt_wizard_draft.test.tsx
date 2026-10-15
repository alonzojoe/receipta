import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { draft_storage_key } from '@/shared/config/draft_storage_key'
import { make_item, make_valid_values, tiny_jpeg } from '@/test/receipt_fixtures'
import { read_stored_draft, render_form, seed_draft } from '@/test/receipt_form_harness'

import { not_saved_message, saved_without_photos_message, unreadable_message } from './draft_status'

const toast_success = vi.hoisted(() => vi.fn())
vi.mock('react-hot-toast', () => ({ default: { success: toast_success } }))

const start = new Date(2026, 9, 15, 12, 0, 0)

beforeEach(() => {
  localStorage.clear()
  toast_success.mockClear()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  vi.setSystemTime(start)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const heading = () => screen.getAllByRole('heading', { level: 2 })[0]
const issuer = () => screen.getAllByLabelText('Full name')[0]
const advance = (ms: number) => act(async () => { vi.advanceTimersByTime(ms) })
const render_timed = () => render_form()

// userEvent and a fake clock do not mix, so events are fired directly. Each is wrapped in
// act so React has flushed before the next line reads the DOM or advances the clock.
const click = async (element: HTMLElement) => {
  await act(async () => { fireEvent.click(element) })
}
const type = async (element: HTMLElement, text: string) => {
  await act(async () => { fireEvent.change(element, { target: { value: (element as HTMLInputElement).value + text } }) })
}

describe('autosave', () => {
  it('writes nothing on mount', () => {
    render_timed()
    vi.advanceTimersByTime(5_000)
    expect(localStorage.getItem(draft_storage_key)).toBeNull()
  })

  it('writes after the debounce: nothing at 499 ms, the draft at 500 ms', async () => {
    render_timed()
    await type(issuer(), 'Juan')
    await advance(499)
    expect(localStorage.getItem(draft_storage_key)).toBeNull()
    await advance(1)
    const draft = read_stored_draft()
    expect(draft?.values.issuer_name).toBe('Juan')
    expect(draft?.step).toBe(1)
  })

  it('does not write for a blur or a shown error, only for an edit', async () => {
    render_timed()
    act(() => { issuer().focus() })
    act(() => { issuer().blur() })
    await click(screen.getByRole('button', { name: 'Next' }))
    await advance(2_000)
    // The step did not change and no value did: there is nothing to save.
    expect(localStorage.getItem(draft_storage_key)).toBeNull()
  })

  it('flushes a pending write on pagehide', async () => {
    render_timed()
    await type(issuer(), 'Juan')
    expect(localStorage.getItem(draft_storage_key)).toBeNull()
    act(() => { window.dispatchEvent(new Event('pagehide')) })
    expect(read_stored_draft()?.values.issuer_name).toBe('Juan')
  })

  it('flushes a pending write when the page becomes hidden', async () => {
    render_timed()
    await type(issuer(), 'Juan')
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(read_stored_draft()?.values.issuer_name).toBe('Juan')
  })

  it('flushes a pending write on unmount, so following a link away loses nothing', async () => {
    const view = render_timed()
    await type(issuer(), 'Juan')
    expect(localStorage.getItem(draft_storage_key)).toBeNull()
    view.unmount()
    expect(read_stored_draft()?.values.issuer_name).toBe('Juan')
  })

  it('saves a step change as an edit', async () => {
    seed_draft(1)
    render_timed()
    await click(screen.getByRole('button', { name: 'Next' }))
    await advance(500)
    expect(read_stored_draft()?.step).toBe(2)
  })
})

describe('restore', () => {
  it('brings back every value, the step and the Receipt No. after an unmount and a remount', async () => {
    const values = make_valid_values({
      items: [make_item({ id: 'a', image: tiny_jpeg }), make_item({ id: 'b', name: 'Second' })],
      discount: '10',
      payment_method: 'other',
      other_method: 'Barter',
      reference_no: 'ref',
      notes: 'Line one\nLine two',
    })
    seed_draft(3, values)
    const first = render_timed()
    const receipt_no = read_stored_draft()?.values.receipt_no
    await type(screen.getByLabelText('Notes'), '!')
    first.unmount()

    vi.setSystemTime(new Date(2026, 9, 15, 13, 30, 0))
    render_timed()
    expect(heading()).toHaveTextContent('Payment')
    expect(screen.getByLabelText('Notes')).toHaveValue('Line one\nLine two!')
    expect(screen.getByLabelText('Other payment method')).toHaveValue('Barter')
    expect(screen.getByLabelText('Payment reference no.')).toHaveValue('ref')
    const stored = read_stored_draft()!
    expect(stored.values.receipt_no).toBe(receipt_no)
    expect(stored.values.items[0].image).toBe(tiny_jpeg)
    expect(stored.values.items).toHaveLength(2)
    expect(stored.values.discount).toBe('10')
  })

  it('keeps the Receipt No. across step changes', async () => {
    seed_draft(1)
    render_timed()
    const before = read_stored_draft()?.values.receipt_no
    await click(screen.getByRole('button', { name: 'Next' }))
    await advance(500)
    await click(screen.getByRole('button', { name: 'Back' }))
    await advance(500)
    expect(read_stored_draft()?.values.receipt_no).toBe(before)
  })

  it('pulls the step back to the first one that does not validate', () => {
    seed_draft(4, make_valid_values({ items: [make_item({ name: '' })] }))
    render_timed()
    expect(heading()).toHaveTextContent('Items')
  })

  it.each([
    ['corrupt', '{not json'],
    ['wrong version', JSON.stringify({ version: 99 })],
    ['invalid shape', JSON.stringify({ version: 1, step: 2, values: { nope: true } })],
  ])('shows the notice for a %s draft, starts empty, and does not overwrite it', async (_, stored) => {
    localStorage.setItem(draft_storage_key, stored)
    render_timed()
    expect(screen.getByText(unreadable_message).closest('[role=status]')).not.toBeNull()
    expect(heading()).toHaveTextContent('Parties')
    expect(issuer()).toHaveValue('')
    await advance(2_000)
    expect(localStorage.getItem(draft_storage_key)).toBe(stored)
    // The first edit replaces it.
    await type(issuer(), 'a')
    await advance(500)
    expect(read_stored_draft()?.values.issuer_name).toBe('a')
  })
})

describe('when saving fails', () => {
  const quota = () => new DOMException('full', 'QuotaExceededError')

  it('says "Saved without photos" (role=status) when only the photo-less retry fits', async () => {
    seed_draft(2, make_valid_values({ items: [make_item({ image: tiny_jpeg })] }))
    const before = localStorage.getItem(draft_storage_key)
    const real = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (value.includes('data:image')) throw quota()
      return real.call(this, key, value)
    })
    render_timed()
    await type(screen.getByLabelText('Item name'), '!')
    await advance(500)
    expect(screen.getByText(saved_without_photos_message).closest('[role=status]')).not.toBeNull()
    expect(read_stored_draft()?.values.items[0].image).toBeNull()
    expect(before).not.toBe(localStorage.getItem(draft_storage_key))
  })

  it('says "Not saved" (role=alert), keeps the last good draft, persists across edits, and clears on recovery', async () => {
    seed_draft(2)
    const good = localStorage.getItem(draft_storage_key)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota() })
    render_timed()
    await type(screen.getByLabelText('Item name'), 'a')
    await advance(500)
    expect(screen.getByRole('alert')).toHaveTextContent(not_saved_message)
    expect(localStorage.getItem(draft_storage_key)).toBe(good)

    await type(screen.getByLabelText('Item name'), 'b')
    await advance(500)
    expect(screen.getByRole('alert')).toHaveTextContent(not_saved_message)

    spy.mockRestore()
    await type(screen.getByLabelText('Item name'), 'c')
    await advance(500)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(read_stored_draft()?.values.items[0].name).toContain('abc')
  })

  it('stays fully usable and says "Not saved" when localStorage cannot even be reached', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('denied', 'SecurityError') },
    })
    try {
      render_timed()
      expect(screen.queryByText(unreadable_message)).toBeNull()
      await type(issuer(), 'Juan')
      await type(screen.getAllByLabelText('Full name')[1], 'Acme')
      await advance(500)
      expect(screen.getByRole('alert')).toHaveTextContent(not_saved_message)
      await click(screen.getByRole('button', { name: 'Next' }))
      expect(heading()).toHaveTextContent('Items')
    } finally {
      Object.defineProperty(window, 'localStorage', original)
    }
  })
})

describe('Clear draft', () => {
  it.each([[1, 'Parties'], [2, 'Items'], [3, 'Payment'], [4, 'Review']])(
    'from step %i: cancel changes nothing, confirm resets everything',
    async (step, name) => {
      const values = make_valid_values({
        items: [make_item({ id: 'a', image: tiny_jpeg })],
        notes: 'keep me?',
      })
      seed_draft(step, values)
      const old_number = values.receipt_no
      render_timed()
      expect(heading()).toHaveTextContent(name)

      await click(screen.getByRole('button', { name: 'Clear draft' }))
      await click(screen.getByRole('button', { name: 'Keep draft' }))
      expect(localStorage.getItem(draft_storage_key)).not.toBeNull()
      expect(heading()).toHaveTextContent(name)
      expect(toast_success).not.toHaveBeenCalled()

      vi.setSystemTime(new Date(2026, 9, 15, 12, 5, 7))
      await click(screen.getByRole('button', { name: 'Clear draft' }))
      await click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Clear draft' }))

      expect(localStorage.getItem(draft_storage_key)).toBeNull()
      expect(toast_success).toHaveBeenCalledWith('Draft cleared')
      expect(heading()).toHaveTextContent('Parties')
      expect(issuer()).toHaveValue('')

      // The reset itself is not an edit: nothing is rewritten, and the Receipt No. is new.
      await advance(2_000)
      expect(localStorage.getItem(draft_storage_key)).toBeNull()
      await type(issuer(), 'N')
      await advance(500)
      const fresh = read_stored_draft()!
      expect(fresh.values.receipt_no).not.toBe(old_number)
      expect(fresh.values.receipt_no).toBe('REF-20261015-120507')
      expect(fresh.values.notes).toBe('')
      expect(fresh.values.items).toHaveLength(1)
      expect(fresh.values.items[0].image).toBeNull()
      expect(fresh.step).toBe(1)
    },
  )
})
