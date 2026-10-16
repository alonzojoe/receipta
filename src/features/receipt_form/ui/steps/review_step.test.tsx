import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { make_item, make_valid_values, tiny_jpeg } from '@/test/receipt_fixtures'
import { make_export_dependencies, render_form, seed_draft, whole_flow_timeout } from '@/test/receipt_form_harness'

beforeEach(() => {
  localStorage.clear()
})

const heading = () => screen.getAllByRole('heading', { level: 2 })[0]

const preview = () => screen.getByRole('region', { name: 'Receipt preview' })

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

  // The content assertions live beside the document (receipt_document.test.tsx) and the view
  // (receipt_view.test.ts). This is one integration pass: the form's values reach the preview.
  it('shows the receipt as it will be sent: the same data, formatted for the customer', () => {
    seed_draft(4, full)
    render_form()
    const text = preview().textContent!
    for (const expected of [
      'Maria Clara', 'Acme Trading', '15 October 2026',
      'Logo design', '1.5', '₱1,000.00', '₱1,500.00', 'Printing', '2', '₱50.25', '₱100.50',
      'Subtotal', '₱1,600.50', 'Discount', '-₱100.00', 'Total', '₱1,500.50',
      'GCash', 'GC-1234', 'Line one', 'Line two', '₱1,500.50 paid on 15 October 2026',
    ]) {
      expect(text, expected).toContain(expected)
    }
    // The type and the old summary's labels are gone, and the photo is the document's thumbnail.
    expect(text).not.toMatch(/Individual|Organization|Receipt date/)
    expect(preview().querySelector(`img[src="${tiny_jpeg}"]`)).not.toBeNull()
  })

  it('shows the receipt number as text, not as an input', () => {
    seed_draft(4, full)
    render_form()
    expect(within(preview()).getByText(/^REF-\d{8}-\d{6}$/).closest('input')).toBeNull()
  })

  it('shows Discount only when it is above 0', () => {
    seed_draft(4, make_valid_values({ discount: '' }))
    render_form()
    expect(within(preview()).queryByText('Discount')).toBeNull()
  })

  it('omits the Reference No. for Cash', () => {
    seed_draft(4, make_valid_values({ payment_method: 'cash', reference_no: 'hidden' }))
    render_form()
    expect(within(preview()).queryByText(/Reference number/)).toBeNull()
    expect(document.body.textContent).not.toContain('hidden')
    expect(within(preview()).getAllByText('Cash').length).toBeGreaterThan(0)
  })

  it('renders HTML in Notes as literal text and keeps the line breaks', () => {
    seed_draft(4, make_valid_values({ notes: '<script>alert(1)</script>\n<b>bold</b>' }))
    const { container } = render_form()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    const notes = screen.getByText(/<script>alert\(1\)<\/script>/)
    expect(notes.textContent).toBe('<script>alert(1)</script>\n<b>bold</b>')
    expect(notes).toHaveClass('receipt-notes-text')
  })

  it('has no Notes caption or placeholder when Notes is empty', () => {
    seed_draft(4, make_valid_values({ notes: '' }))
    render_form()
    expect(within(preview()).queryByText('Notes')).toBeNull()
  })

  it('has one Edit row that goes to the right step and returns with data intact', async () => {
    seed_draft(4, full)
    const { user } = render_form()
    for (const [name, step] of [
      ['Edit parties', 'Parties'], ['Edit items', 'Items'], ['Edit payment', 'Payment'],
    ] as const) {
      await user.click(screen.getByRole('button', { name }))
      expect(heading()).toHaveTextContent(step)
      while (heading().textContent !== 'Review') await user.click(screen.getByRole('button', { name: 'Next' }))
      expect(preview().textContent).toContain('Maria Clara')
      expect(preview().textContent).toContain('GC-1234')
    }
    // The old per-section links are gone.
    expect(screen.queryByRole('button', { name: 'Edit issuer' })).toBeNull()
  }, whole_flow_timeout)

  it('has Download PDF and Download image as real buttons that do not submit the form', () => {
    seed_draft(4, full)
    render_form()
    for (const name of ['Download PDF', 'Download image']) {
      const button = screen.getByRole('button', { name })
      expect(button).toHaveAttribute('type', 'button')
    }
    expect(screen.queryByRole('link', { name: /export|download|print|pdf/i })).toBeNull()
  })

  it('puts the BIR notice above the preview, and the document carries its own statement after the payment', () => {
    seed_draft(4, full)
    render_form()
    const notice = screen.getByText('This is a receipt, not a BIR Official Receipt.')
    expect(notice.compareDocumentPosition(preview()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const statement = within(preview()).getByText('This is a proof of payment.')
    const payment = within(preview()).getByText('Payment method')
    expect(payment.compareDocumentPosition(statement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('hands the form values to the export, not a copy of its own (criterion 51)', async () => {
    seed_draft(4, full)
    const dependencies = make_export_dependencies()
    const { user } = render_form(undefined, dependencies)
    await user.click(screen.getByRole('button', { name: 'Download PDF' }))
    await vi.waitFor(() => expect(dependencies.run).toHaveBeenCalledTimes(1))
    const [kind, view] = dependencies.run.mock.calls[0]
    expect(kind).toBe('pdf')
    // The view the export gets is the view the preview shows.
    expect(preview().textContent).toContain(view.totals.total)
    expect(view.issuer).toBe('Maria Clara')
  })
})

describe('the BIR line', () => {
  it('says "Official Receipt" never on steps 1 to 3, and once on Review: the page notice (the document does not say it)', async () => {
    seed_draft(1, make_valid_values({ notes: 'ok' }))
    const { user } = render_form()
    const counts: number[] = []
    const forbidden = [/\bOR No\./, /\bInvoice No\./, /\bSerial\b/, /\bTIN\b/, /\bVAT\b/]
    for (let step = 1; step <= 4; step += 1) {
      const text = document.body.textContent!
      counts.push((text.match(/Official Receipt/g) ?? []).length)
      for (const pattern of forbidden) expect(text, `${pattern} on step ${step}`).not.toMatch(pattern)
      if (step < 4) await user.click(screen.getByRole('button', { name: 'Next' }))
    }
    // Review has one: the page's notice. The document says only that it is a proof of payment.
    expect(counts).toEqual([0, 0, 0, 1])
  })

  it('never puts it in a label, heading or test id', async () => {
    seed_draft(1)
    const { user } = render_form()
    for (let step = 1; step <= 4; step += 1) {
      // A labelled region (the preview) holds the document, whose statement is a paragraph by
      // design, so for it only the label itself is read, not what it contains.
      const named = [...document.querySelectorAll('[aria-label], [data-testid]')].map(
        (node) => `${node.getAttribute('aria-label')} ${node.getAttribute('data-testid')}`,
      )
      const texts = [...document.querySelectorAll('label, h1, h2, h3, h4')].map((node) => node.textContent)
      const labelled = [...named, ...texts]
      expect(labelled.join('\n')).not.toMatch(/official receipt/i)
      if (step < 4) await user.click(screen.getByRole('button', { name: 'Next' }))
    }
    // One on Review: the page's notice. The document says only that it is a proof of payment.
    expect(within(document.body).getAllByText(/not a BIR Official Receipt/)).toHaveLength(1)
  })
})
