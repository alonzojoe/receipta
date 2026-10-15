import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { make_item, make_valid_values } from '@/test/receipt_fixtures'
import { render_form, seed_draft, whole_flow_timeout } from '@/test/receipt_form_harness'

import { make_empty_item } from '../../model/receipt_form_values'

beforeEach(() => {
  localStorage.clear()
})

const next = () => screen.getByRole('button', { name: 'Next' })
const add = () => screen.getByRole('button', { name: /Add item/ })
const heading = () => screen.getAllByRole('heading', { level: 2 })[0]
const rows = () => screen.getAllByRole('heading', { level: 3, name: /^Item \d+$/ })

describe('Items step', () => {
  it('will not advance with no valid item', async () => {
    seed_draft(2, make_valid_values({ items: [make_empty_item()] }))
    const { user } = render_form()
    await user.click(next())
    expect(heading()).toHaveTextContent('Items')
    expect(screen.getAllByText(/is required/).length).toBeGreaterThan(0)
  })

  it('starts a new row with quantity 1', async () => {
    seed_draft(2)
    const { user } = render_form()
    await user.click(add())
    expect(screen.getAllByLabelText('Quantity')[1]).toHaveValue('1')
    expect(screen.getAllByLabelText('Unit price')[1]).toHaveValue('')
  })

  it('cannot remove the only item, and says why', async () => {
    seed_draft(2)
    const { user } = render_form()
    const remove = screen.getByRole('button', { name: 'Remove item 1' })
    expect(remove).toHaveAttribute('aria-disabled', 'true')
    const reason = document.getElementById(remove.getAttribute('aria-describedby')!)
    expect(reason).toHaveTextContent(/at least one item/)
    await user.click(remove)
    expect(rows()).toHaveLength(1)
  })

  it('refuses a 51st item with a message that stays', async () => {
    const fifty = Array.from({ length: 50 }, (_, index) => make_item({ id: `item-${index}`, name: `Item ${index}` }))
    seed_draft(2, make_valid_values({ items: fifty }))
    const { user } = render_form()
    expect(rows()).toHaveLength(50)
    await user.click(add())
    expect(rows()).toHaveLength(50)
    expect(screen.getByText('A receipt can have at most 50 items.')).toBeInTheDocument()
    expect(add()).toHaveAttribute('aria-disabled', 'true')
  }, whole_flow_timeout)

  it('sums per-line rounding: three lines of 0.5 x 0.01 total 0.03, not 0.02', () => {
    const lines = [1, 2, 3].map((n) => make_item({ id: `l${n}`, name: `L${n}`, quantity: '0.5', price: '0.01' }))
    seed_draft(2, make_valid_values({ items: lines }))
    render_form()
    const line_texts = screen.getAllByTestId(/^line-total-/).map((node) => node.textContent)
    expect(line_texts).toEqual(['₱0.01', '₱0.01', '₱0.01'])
    const summary = screen.getByText('Subtotal').closest('div')!
    expect(summary).toHaveTextContent('₱0.03')
  })

  it('formats 1234.5 as ₱1,234.50 and shows the total', () => {
    seed_draft(2, make_valid_values({ items: [make_item({ price: '1234.5' })], discount: '34.5' }))
    render_form()
    expect(screen.getByTestId('line-total-1')).toHaveTextContent('₱1,234.50')
    expect(screen.getByText('Total').closest('div')).toHaveTextContent('₱1,200.00')
  })

  it('rejects a discount over the subtotal and never shows a negative total', async () => {
    seed_draft(2, make_valid_values({ discount: '5000' }))
    const { user } = render_form()
    await user.click(next())
    expect(heading()).toHaveTextContent('Items')
    expect(screen.getByLabelText('Discount')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/Discount cannot be more than the subtotal/)).toBeInTheDocument()
    const total = screen.getByText('Total').closest('div')!
    expect(total.textContent).not.toMatch(/-₱|₱-/)
    expect(total).toHaveTextContent('-')
  })

  it('has no VAT line or field', () => {
    seed_draft(2)
    render_form()
    expect(document.body.textContent).not.toMatch(/\bVAT\b/i)
  })

  it('Enter on Add item adds a row and does not advance', async () => {
    seed_draft(2)
    const { user } = render_form()
    add().focus()
    await user.keyboard('{Enter}')
    expect(rows()).toHaveLength(2)
    expect(heading()).toHaveTextContent('Items')
  })

  it('focuses the new row name, ready to type', async () => {
    seed_draft(2)
    const { user } = render_form()
    await user.click(add())
    expect(document.activeElement).toBe(screen.getAllByLabelText('Item name')[1])
  })

  it('keeps the other rows on the right values when a middle item is removed', async () => {
    const lines = ['Alpha', 'Beta', 'Gamma'].map((name, index) =>
      make_item({ id: `r${index}`, name, price: String((index + 1) * 10) }),
    )
    seed_draft(2, make_valid_values({ items: lines }))
    const { user } = render_form()
    await user.click(screen.getByRole('button', { name: 'Remove item 2' }))
    expect(rows()).toHaveLength(2)
    expect(screen.getAllByLabelText('Item name').map((input) => (input as HTMLInputElement).value)).toEqual(['Alpha', 'Gamma'])
    expect(screen.getAllByLabelText('Unit price').map((input) => (input as HTMLInputElement).value)).toEqual(['10', '30'])
    expect(within(screen.getByTestId('line-total-2').closest('li')!).getByLabelText('Item name')).toHaveValue('Gamma')
  })
})
