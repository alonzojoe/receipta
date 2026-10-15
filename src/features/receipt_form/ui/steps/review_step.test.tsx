import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { make_item, make_valid_values, tiny_jpeg } from '@/test/receipt_fixtures'
import { render_form, seed_draft, whole_flow_timeout } from '@/test/receipt_form_harness'

beforeEach(() => {
  localStorage.clear()
})

const heading = () => screen.getAllByRole('heading', { level: 2 })[0]

describe('Review step', () => {
  const full = make_valid_values({
    issuer_name: 'Maria Clara',
    items: [
      make_item({ id: 'a', name: 'Logo design', quantity: '1.5', price: '1,000', image: tiny_jpeg }),
      make_item({ id: 'b', name: 'Printing', quantity: '2', price: '50.25' }),
    ],
    discount: '100',
    payment_method: 'gcash',
    reference_no: 'GC-1234',
    notes: 'Line one\nLine two',
  })

  it('shows every field, formatted', () => {
    seed_draft(4, full)
    render_form()
    const body = document.body.textContent!
    for (const text of [
      'REF-', '2026-10-15', 'Maria Clara', 'Acme Trading', 'Individual', 'Organization',
      'Logo design', '1.5 x ₱1,000.00', '₱1,500.00', 'Printing', '2 x ₱50.25', '₱100.50',
      'Subtotal', '₱1,600.50', 'Discount', '-₱100.00', 'Total', '₱1,500.50',
      'GCash', 'GC-1234', 'Line one', 'Line two',
    ]) {
      expect(body, text).toContain(text)
    }
    expect(document.querySelector(`img[src="${tiny_jpeg}"]`)).not.toBeNull()
  })

  it('shows the receipt number as text, not as an input', () => {
    seed_draft(4, full)
    render_form()
    expect(screen.getByText(/^REF-\d{8}-\d{6}$/).closest('input')).toBeNull()
  })

  it('shows Discount only when it is above 0', () => {
    seed_draft(4, make_valid_values({ discount: '' }))
    render_form()
    expect(screen.queryByText('Discount')).toBeNull()
  })

  it('omits the Reference No. for Cash', () => {
    seed_draft(4, make_valid_values({ payment_method: 'cash', reference_no: 'hidden' }))
    render_form()
    expect(screen.queryByText('Reference no.')).toBeNull()
    expect(screen.queryByText('hidden')).toBeNull()
    expect(screen.getAllByText('Cash').length).toBeGreaterThan(0)
  })

  it('renders HTML in Notes as literal text and keeps the line breaks', () => {
    seed_draft(4, make_valid_values({ notes: '<script>alert(1)</script>\n<b>bold</b>' }))
    const { container } = render_form()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    const notes = screen.getByText(/<script>alert\(1\)<\/script>/)
    expect(notes.textContent).toBe('<script>alert(1)</script>\n<b>bold</b>')
    expect(notes).toHaveClass('whitespace-pre-wrap')
  })

  it('has no Notes heading or placeholder when Notes is empty', () => {
    seed_draft(4, make_valid_values({ notes: '' }))
    render_form()
    expect(screen.queryByRole('heading', { name: 'Notes' })).toBeNull()
  })

  it('has an Edit button per section that goes to the right step and returns with data intact', async () => {
    seed_draft(4, full)
    const { user } = render_form()
    for (const [name, step] of [
      ['Edit issuer', 'Parties'], ['Edit recipient', 'Parties'], ['Edit items', 'Items'], ['Edit payment', 'Payment'], ['Edit notes', 'Payment'], ['Edit receipt', 'Payment'],
    ] as const) {
      await user.click(screen.getByRole('button', { name }))
      expect(heading()).toHaveTextContent(step)
      while (heading().textContent !== 'Review') await user.click(screen.getByRole('button', { name: 'Next' }))
      expect(document.body.textContent).toContain('Maria Clara')
      expect(document.body.textContent).toContain('GC-1234')
    }
  }, whole_flow_timeout)

  it('has no export, download or print control', () => {
    seed_draft(4, full)
    render_form()
    expect(screen.queryByRole('button', { name: /export|download|print|pdf|image/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /export|download|print|pdf/i })).toBeNull()
  })

  it('puts the BIR notice directly after the totals', () => {
    seed_draft(4, full)
    render_form()
    const total = screen.getByText('Total').closest('dl')!
    const notice = screen.getByText('This is a receipt, not a BIR Official Receipt.')
    expect(total.parentElement).toBe(notice.parentElement)
    expect(total.nextElementSibling).toBe(notice)
  })
})

describe('the BIR line', () => {
  it('says "Official Receipt" exactly once across every step: the Review notice', async () => {
    seed_draft(1, make_valid_values({ notes: 'ok' }))
    const { user } = render_form()
    let count = 0
    const forbidden = [/\bOR No\./, /\bInvoice No\./, /\bSerial\b/, /\bTIN\b/, /\bVAT\b/]
    for (let step = 1; step <= 4; step += 1) {
      const text = document.body.textContent!
      count += (text.match(/Official Receipt/g) ?? []).length
      for (const pattern of forbidden) expect(text, `${pattern} on step ${step}`).not.toMatch(pattern)
      if (step < 4) await user.click(screen.getByRole('button', { name: 'Next' }))
    }
    expect(count).toBe(1)
  })

  it('never puts it in a label, heading or test id', async () => {
    seed_draft(1)
    const { user } = render_form()
    for (let step = 1; step <= 4; step += 1) {
      const labelled = [
        ...document.querySelectorAll('label, h1, h2, h3, [aria-label], [data-testid]'),
      ].map((node) => `${node.textContent} ${node.getAttribute('aria-label')} ${node.getAttribute('data-testid')}`)
      expect(labelled.join('\n')).not.toMatch(/official receipt/i)
      if (step < 4) await user.click(screen.getByRole('button', { name: 'Next' }))
    }
    expect(within(document.body).getByText(/not a BIR Official Receipt/)).toBeInTheDocument()
  })
})
