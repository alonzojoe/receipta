import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { institutions } from '@/shared/config/institutions'
import { fixture_now, make_valid_values } from '@/test/receipt_fixtures'
import { render_form, seed_draft } from '@/test/receipt_form_harness'

beforeEach(() => {
  localStorage.clear()
})

const next = () => screen.getByRole('button', { name: 'Next' })
const heading = () => screen.getAllByRole('heading', { level: 2 })[0]
const trigger = () => screen.getByRole('combobox')
const options = () => screen.queryAllByRole('option')
const active_option = () => options().find((option) => option.getAttribute('data-selected') === 'true')

describe('Payment step: the picker', () => {
  it('lists every institution plus Cash and Other, with local logos', async () => {
    seed_draft(3, make_valid_values({ payment_method: '' }))
    const { user } = render_form()
    await user.click(trigger())
    const list = options()
    expect(list).toHaveLength(institutions.length + 2)
    expect(institutions).toHaveLength(31)
    for (const institution of institutions) {
      const option = list.find((item) => item.textContent === institution.name)
      expect(option, institution.name).toBeDefined()
      const logo = option!.querySelector('img')!
      expect(logo.getAttribute('src')).toBe(institution.icon)
      expect(logo.getAttribute('src')!.startsWith('/')).toBe(true)
      expect(logo).toHaveAttribute('alt', '')
    }
    expect(list.map((item) => item.textContent)).toEqual(expect.arrayContaining(['Cash', 'Other (specify)']))
  })

  it('names the popover, so the dialog is not announced as an unlabelled dialog', async () => {
    seed_draft(3, make_valid_values({ payment_method: '' }))
    const { user } = render_form()
    await user.click(trigger())
    expect(screen.getByRole('dialog', { name: 'Payment method options' })).toBeInTheDocument()
  })

  it('moves with the arrow keys, filters as you type, selects on Enter', async () => {
    seed_draft(3, make_valid_values({ payment_method: '' }))
    const { user } = render_form()
    await user.click(trigger())
    const first = active_option()?.textContent
    await user.keyboard('{ArrowDown}')
    const second = active_option()?.textContent
    expect(second).not.toBe(first)
    await user.keyboard('{ArrowUp}')
    expect(active_option()?.textContent).toBe(first)

    await user.keyboard('gc')
    expect(options().map((option) => option.textContent)).toEqual(['GCash'])
    await user.keyboard('{Enter}')
    expect(options()).toHaveLength(0)
    expect(trigger()).toHaveTextContent('GCash')
  })

  it('closes on Escape and keeps the previous choice', async () => {
    seed_draft(3, make_valid_values({ payment_method: 'maya' }))
    const { user } = render_form()
    await user.click(trigger())
    await user.keyboard('{ArrowDown}{Escape}')
    expect(options()).toHaveLength(0)
    expect(trigger()).toHaveTextContent('Maya')
  })

  it('always shows the chosen name as text in the trigger, and is the invalid element when empty', async () => {
    seed_draft(3, make_valid_values({ payment_method: '' }))
    const { user } = render_form()
    await user.click(next())
    expect(trigger()).toHaveAttribute('aria-invalid', 'true')
    expect(document.activeElement).toBe(trigger())
  })
})

describe('Payment step: the fields', () => {
  it('requires the Other text only for Other', async () => {
    seed_draft(3, make_valid_values({ payment_method: 'other', other_method: '' }))
    const { user } = render_form()
    await user.click(next())
    expect(heading()).toHaveTextContent('Payment')
    expect(screen.getByLabelText('Other payment method')).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not show Other text for a bank', () => {
    seed_draft(3)
    render_form()
    expect(screen.queryByLabelText('Other payment method')).toBeNull()
  })

  it('hides Reference No. for Cash, still advances with a 41-character hidden value, and restores it', async () => {
    const long = 'r'.repeat(41)
    seed_draft(3, make_valid_values({ payment_method: 'cash', reference_no: long }))
    const { user } = render_form()
    expect(screen.queryByLabelText('Payment reference no.')).toBeNull()
    await user.click(next())
    expect(heading()).toHaveTextContent('Review')

    await user.click(screen.getByRole('button', { name: 'Edit payment' }))
    await user.click(trigger())
    await user.keyboard('gc{Enter}')
    expect(screen.getByLabelText('Payment reference no.')).toHaveValue(long)
  })

  it('never prefills the reference', () => {
    seed_draft(3, make_valid_values({ reference_no: '' }))
    render_form()
    expect(screen.getByLabelText('Payment reference no.')).toHaveValue('')
  })

  it('rejects a future date and accepts today and a past date', async () => {
    seed_draft(3, make_valid_values({ receipt_date: '2999-12-31' }))
    const first = render_form()
    await first.user.click(next())
    expect(screen.getByLabelText('Receipt date')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('The receipt date cannot be in the future')).toBeInTheDocument()
    first.unmount()

    for (const date of ['2020-01-02', new Date().toISOString().slice(0, 4) + '-01-01']) {
      localStorage.clear()
      seed_draft(3, make_valid_values({ receipt_date: date }))
      const again = render_form()
      await again.user.click(next())
      expect(heading()).toHaveTextContent('Review')
      again.unmount()
    }
    expect(fixture_now.getFullYear()).toBeGreaterThan(2000)
  })

  it('limits the date input to today with max', () => {
    seed_draft(3)
    render_form()
    expect(screen.getByLabelText('Receipt date')).toHaveAttribute('max', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('treats empty and whitespace-only Notes as no notes, with no error', async () => {
    for (const notes of ['', '   \n  ']) {
      localStorage.clear()
      seed_draft(3, make_valid_values({ notes }))
      const { user, unmount } = render_form()
      await user.click(next())
      expect(heading()).toHaveTextContent('Review')
      expect(screen.queryByRole('heading', { name: 'Notes' })).toBeNull()
      unmount()
    }
  })

  it('names the limit when Notes is over 300, and shows a visible count with no maxlength', async () => {
    seed_draft(3, make_valid_values({ notes: 'n'.repeat(301) }))
    const { user } = render_form()
    expect(screen.getByLabelText('Notes')).not.toHaveAttribute('maxlength')
    expect(screen.getByText('301 / 300')).toBeInTheDocument()
    await user.click(next())
    expect(screen.getByText(/300 characters or fewer/)).toBeInTheDocument()
    const described = screen.getByLabelText('Notes').getAttribute('aria-describedby')!.split(' ')
    expect(described.some((id) => document.getElementById(id)?.textContent === 'Up to 300 characters and 5 lines.')).toBe(true)
    expect(within(document.body).getByLabelText('Notes').closest('[aria-live]')).toBeNull()
  })

  it('is the only multi-line field in the form, and it is last', () => {
    seed_draft(3)
    const { container } = render_form()
    const areas = container.querySelectorAll('textarea')
    expect(areas).toHaveLength(1)
    const controls = [...container.querySelectorAll('form input, form textarea, form [role=combobox]')]
    expect(controls[controls.length - 1]).toBe(areas[0])
  })
})
