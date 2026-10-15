import { cleanup, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { make_item, make_valid_values } from '@/test/receipt_fixtures'
import { render_form, seed_draft } from '@/test/receipt_form_harness'

import { steps, validate_step, type StepName } from '../model/step_rules'
import type { ReceiptFormValues } from '../model/receipt_form_values'

beforeEach(() => {
  localStorage.clear()
})

const next = () => screen.getByRole('button', { name: 'Next' })
const back = () => screen.getByRole('button', { name: 'Back' })
const step_heading = () => screen.getAllByRole('heading', { level: 2 })[0]
const invalid_elements = () => [...document.querySelectorAll<HTMLElement>('[aria-invalid="true"]')]

/** What the pure gate says is wrong on a step, for the values the form holds. */
function gate(step: StepName, values: ReceiptFormValues) {
  return validate_step(step, values, new Date())
}

describe('the wizard shell', () => {
  it('renders the wizard at step 1 with only the Parties fields in the DOM', () => {
    render_form()
    expect(step_heading()).toHaveTextContent('Parties')
    expect(screen.getAllByLabelText('Full name')).toHaveLength(2)
    expect(screen.queryByLabelText('Item name')).toBeNull()
    expect(screen.queryByLabelText('Notes')).toBeNull()
  })

  it('has no export, download or print control anywhere in the flow', () => {
    seed_draft(4)
    render_form()
    expect(screen.queryByRole('button', { name: /export|download|print|pdf/i })).toBeNull()
  })

  it('moves focus to the step heading and announces the step on a change', async () => {
    seed_draft(1)
    const { user } = render_form()
    expect(document.activeElement).toBe(document.body)
    await user.click(next())
    expect(document.activeElement).toBe(step_heading())
    expect(step_heading()).toHaveTextContent('Items')
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Step 2 of 4: Items')
  })

  it('does not steal focus when the page loads', () => {
    seed_draft(3)
    render_form()
    expect(document.activeElement).toBe(document.body)
  })
})

describe('the timeline', () => {
  it('is an ordered list of four with one current step and a text state on each', () => {
    seed_draft(3)
    render_form()
    const list = within(screen.getByRole('navigation', { name: 'Receipt steps' })).getByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items.filter((item) => item.getAttribute('aria-current') === 'step')).toHaveLength(1)
    expect(items[0]).toHaveTextContent(/completed/)
    expect(items[1]).toHaveTextContent(/completed/)
    expect(items[2]).toHaveTextContent(/current/)
    expect(items[3]).toHaveTextContent(/not yet reached/)
  })

  it('makes completed steps buttons and leaves current and upcoming ones inert', () => {
    seed_draft(3)
    render_form()
    const nav = within(screen.getByRole('navigation', { name: 'Receipt steps' }))
    expect(nav.getAllByRole('button')).toHaveLength(2)
    expect(nav.getByRole('button', { name: /Parties/ })).toBeInTheDocument()
    expect(nav.queryByRole('button', { name: /Payment/ })).toBeNull()
    expect(nav.queryByRole('button', { name: /Review/ })).toBeNull()
  })

  it('goes to a completed step without validating', async () => {
    seed_draft(3)
    const { user } = render_form()
    await user.click(
      within(screen.getByRole('navigation', { name: 'Receipt steps' })).getByRole('button', { name: /Parties/ }),
    )
    expect(step_heading()).toHaveTextContent('Parties')
    expect(invalid_elements()).toHaveLength(0)
  })

  it('makes later steps upcoming again after going back', async () => {
    seed_draft(3)
    const { user } = render_form()
    await user.click(back())
    await user.click(back())
    const nav = within(screen.getByRole('navigation', { name: 'Receipt steps' }))
    expect(nav.queryAllByRole('button')).toHaveLength(0)
  })

  it('carries a detail line worth reading: both parties, the item count, the method, the total', () => {
    seed_draft(4, make_valid_values({ items: [make_item({ id: 'a' }), make_item({ id: 'b' })] }))
    render_form()
    const nav = within(screen.getByRole('navigation', { name: 'Receipt steps' }))
    expect(nav.getByText('Juan Dela Cruz → Acme Trading')).toBeInTheDocument()
    expect(nav.getByText('2 items')).toBeInTheDocument()
    expect(nav.getByText('GCash')).toBeInTheDocument()
    expect(nav.getByText('₱3,000.00')).toBeInTheDocument()
  })
})

describe('Parties', () => {
  it('defaults both toggles to Individual and relabels without adding a field', async () => {
    const { user, container } = render_form()
    const issuer = within(screen.getByRole('region', { name: 'Issuer' }))
    const recipient = within(screen.getByRole('region', { name: 'Recipient' }))
    expect(issuer.getByRole('radio', { name: 'Individual' })).toBeChecked()
    expect(recipient.getByRole('radio', { name: 'Individual' })).toBeChecked()

    const before = container.querySelectorAll('input, textarea').length
    await user.click(issuer.getByRole('radio', { name: 'Organization' }))
    expect(issuer.getByLabelText('Business name')).toBeInTheDocument()
    expect(recipient.getByLabelText('Full name')).toBeInTheDocument()
    expect(container.querySelectorAll('input, textarea').length).toBe(before)
  })

  it('keeps every value when going 1, 2, back, 1', async () => {
    seed_draft(1, make_valid_values({ issuer_name: 'Maria Clara', recipient_name: 'Crisostomo' }))
    const { user } = render_form()
    await user.click(next())
    await user.click(back())
    const names = screen.getAllByLabelText('Full name').concat(screen.queryAllByLabelText('Business name'))
    expect(names.map((input) => (input as HTMLInputElement).value).sort()).toEqual(['Crisostomo', 'Maria Clara'])
  })

  it('pressing Enter inside a text field advances, like Next', async () => {
    seed_draft(1)
    const { user } = render_form()
    await user.type(screen.getAllByLabelText('Full name')[0], '{Enter}')
    expect(step_heading()).toHaveTextContent('Items')
  })
})

describe('when errors appear', () => {
  it('shows nothing while filling in or on leaving a field, only after Next, then clears as it is fixed', async () => {
    const { user } = render_form()
    const [issuer] = screen.getAllByLabelText('Full name')

    // Typed in, emptied, left. A form being filled in is not a form with mistakes in it.
    await user.type(issuer, 'a')
    await user.clear(issuer)
    await user.tab()
    await user.tab()
    expect(invalid_elements()).toHaveLength(0)
    expect(screen.queryByText('Full name is required')).toBeNull()

    // The button press is the moment the step is declared finished.
    await user.click(next())
    expect(invalid_elements()).toHaveLength(2)
    expect(screen.getAllByText('Full name is required')).toHaveLength(2)

    // Live from then on, for the field that failed: no second press to find out.
    await user.type(issuer, 'J')
    expect(issuer).not.toHaveAttribute('aria-invalid')
    expect(screen.getAllByText('Full name is required')).toHaveLength(1)
  })

  it('starts a revisited step quiet', async () => {
    seed_draft(1, make_valid_values({ items: [make_item({ price: '' })] }))
    const { user } = render_form()
    await user.click(next())
    await user.click(next())
    expect(invalid_elements().length).toBeGreaterThan(0)
    await user.click(
      within(screen.getByRole('navigation', { name: 'Receipt steps' })).getByRole('button', { name: /Parties/ }),
    )
    await user.click(next())
    expect(step_heading()).toHaveTextContent('Items')
    expect(invalid_elements()).toHaveLength(0)
  })
})

describe('the gate and the visible errors agree (divergence)', () => {
  type Case = { name: string; step: StepName; step_number: number; values: ReceiptFormValues }
  const cases: Case[] = [
    {
      name: 'parties: both names empty',
      step: 'parties',
      step_number: 1,
      values: make_valid_values({ issuer_name: '', recipient_name: '' }),
    },
    {
      name: 'items: empty name, bad price, bad quantity, bad discount',
      step: 'items',
      step_number: 2,
      values: make_valid_values({
        items: [make_item({ id: 'a', name: '', price: '12.345' }), make_item({ id: 'b', quantity: 'abc' })],
        discount: '-1',
      }),
    },
    {
      name: 'items: discount over the subtotal',
      step: 'items',
      step_number: 2,
      values: make_valid_values({ discount: '5000' }),
    },
    {
      name: 'payment: no method',
      step: 'payment',
      step_number: 3,
      values: make_valid_values({ payment_method: '' }),
    },
    {
      name: 'payment: Other without text, future date, notes over 300',
      step: 'payment',
      step_number: 3,
      values: make_valid_values({
        payment_method: 'other',
        other_method: '',
        receipt_date: '2999-01-01',
        notes: 'n'.repeat(301),
      }),
    },
    {
      name: 'payment: reference over 40 for a bank',
      step: 'payment',
      step_number: 3,
      values: make_valid_values({ reference_no: 'r'.repeat(41) }),
    },
  ]

  it.each(cases)('$name', async ({ step, step_number, values }) => {
    seed_draft(step_number, values)
    const { user } = render_form()
    const expected = Object.keys(gate(step, values))
    expect(expected.length).toBeGreaterThan(0)

    await user.click(next())

    // (i) it did not advance
    expect(step_heading()).toHaveTextContent(new RegExp(`^${step === 'parties' ? 'Parties' : step === 'items' ? 'Items' : 'Payment'}$`))
    // (ii) every key the gate reports has a visible, wired error on the matching field
    for (const path of expected) {
      const control = document.querySelector<HTMLElement>(`[name="${path}"]`)
      expect(control, `no control named ${path}`).not.toBeNull()
      expect(control, path).toHaveAttribute('aria-invalid', 'true')
      const described = control!.getAttribute('aria-describedby')!.split(' ')
      const text = described.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
      expect(text, path).toContain(gate(step, values)[path])
    }
    // and nothing is flagged that the gate does not flag
    expect(invalid_elements().map((element) => element.getAttribute('name'))).toEqual(
      expect.arrayContaining(expected),
    )
    expect(invalid_elements()).toHaveLength(expected.length)
    // (iii) focus is on the first of them, in the order they appear on screen
    expect(document.activeElement).toBe(invalid_elements()[0])
  })

  it('lets Cash advance with an invalid hidden reference number', async () => {
    seed_draft(3, make_valid_values({ payment_method: 'cash', reference_no: 'r'.repeat(41) }))
    const { user } = render_form()
    expect(Object.keys(gate('payment', make_valid_values({ payment_method: 'cash', reference_no: 'r'.repeat(41) })))).toEqual([])
    await user.click(next())
    expect(step_heading()).toHaveTextContent('Review')
  })

  it('covers every step the user can press Next on', () => {
    expect(steps.filter((step) => step !== 'review')).toEqual(['parties', 'items', 'payment'])
    for (const step of ['parties', 'items', 'payment'] as const) {
      expect(cases.some((c) => c.step === step)).toBe(true)
    }
  })
})

describe('the whole flow', () => {
  it('keeps every value, including a photo, when going back to step 1 and returning to Review', async () => {
    const tiny = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='
    const values = make_valid_values({
      items: [make_item({ id: 'a', image: tiny }), make_item({ id: 'b', name: 'Second', price: '20' })],
      discount: '5',
      payment_method: 'other',
      other_method: 'Barter',
      reference_no: 'ref-1',
      notes: 'Line one\nLine two',
    })
    seed_draft(4, values)
    const { user } = render_form()
    const form_text = () => document.querySelector('form')?.textContent
    const review_before = form_text()

    await user.click(back())
    await user.click(back())
    await user.click(back())
    expect(step_heading()).toHaveTextContent('Parties')
    await user.click(next())
    await user.click(next())
    await user.click(next())
    expect(step_heading()).toHaveTextContent('Review')
    expect(form_text()).toBe(review_before)
    expect(document.querySelector(`img[src="${tiny}"]`)).not.toBeNull()
    cleanup()
  })
})
