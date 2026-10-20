import { describe, expect, it } from 'vitest'

import { format_centavos } from '@/shared/lib/format_currency'

import type { ItemInput, ReceiptInput } from './receipt_input'
import { build_receipt_view, receipt_labels, receipt_statement, type ReceiptView } from './receipt_view'
import { summarise_receipt } from './receipt_totals'

function item(name: string, quantity: string, price: string, image: string | null = null): ItemInput {
  return { name, quantity, price, image }
}

function receipt(overrides: Partial<ReceiptInput> = {}): ReceiptInput {
  return {
    receipt_no: 'REF-20261016-154212',
    receipt_date: '2026-10-16',
    issuer_name: 'Juan Dela Cruz',
    recipient_name: 'Acme Trading',
    items: [item('Logo design', '1', '1,500.00')],
    discount: '',
    discount_description: '',
    payment_method: 'gcash',
    other_method: '',
    reference_no: '1234567890',
    notes: '',
    ...overrides,
  }
}

/** The old `2 × ₱150.00` reading of a line, rebuilt from its two columns. */
function detail_of(line: { quantity: string; unit_price: string }) {
  return line.quantity === '' ? '' : `${line.quantity} × ${line.unit_price}`
}

/** `₱1,234.50` or `-₱50.00` -> centavos, by reading the digits. */
function centavos_of(text: string) {
  return Number(text.replace(/[^0-9]/g, ''))
}

describe('build_receipt_view: content in display order', () => {
  it('carries the fields in the order the document reads them', () => {
    expect(Object.keys(build_receipt_view(receipt()))).toEqual([
      'receipt_no',
      'date',
      'issuer',
      'recipient',
      'paid_line',
      'items',
      'has_images',
      'totals',
      'payment',
      'notes',
      'statement',
    ])
  })

  it('formats the common receipt', () => {
    expect(build_receipt_view(receipt())).toEqual({
      receipt_no: 'REF-20261016-154212',
      date: '16 October 2026',
      issuer: 'Juan Dela Cruz',
      recipient: 'Acme Trading',
      paid_line: '₱1,500.00 paid on 16 October 2026',
      items: [{ name: 'Logo design', quantity: '1', unit_price: '₱1,500.00', amount: '₱1,500.00', image: null }],
      has_images: false,
      totals: { subtotal: null, discount: null, discount_label: 'Discount', total: '₱1,500.00' },
      payment: { name: 'GCash', icon: '/institutions/gcash.png', reference: '1234567890' },
      notes: null,
      statement: 'This is a proof of payment.',
    })
  })

  it('trims the names the way the form does', () => {
    const view = build_receipt_view(receipt({ issuer_name: '  Juan  ', recipient_name: ' Acme ', items: [item(' Logo ', '1', '1')] }))
    expect([view.issuer, view.recipient, view.items[0].name]).toEqual(['Juan', 'Acme', 'Logo'])
  })
})

describe('build_receipt_view: the discount rows (criterion 5)', () => {
  it.each(['', '   ', '0', '0.00'])('shows only the Total when the discount is %j', (discount) => {
    const { totals } = build_receipt_view(receipt({ discount }))
    expect(totals).toEqual({ subtotal: null, discount: null, discount_label: 'Discount', total: '₱1,500.00' })
  })

  it('shows Subtotal, a hyphen-minus Discount and Total for a discount above 0', () => {
    const { totals } = build_receipt_view(receipt({ discount: '50' }))
    expect(totals).toEqual({ subtotal: '₱1,500.00', discount: '-₱50.00', discount_label: 'Discount', total: '₱1,450.00' })
    expect(totals.discount?.startsWith('-')).toBe(true)
    expect(totals.discount).not.toContain('−')
  })

  /**
   * The author's example: `Discount (student)    -₱100`. The label is built in the view,
   * so the preview and both exports print the same string.
   */
  it('names the discount when a description is given', () => {
    const { totals } = build_receipt_view(receipt({ discount: '100', discount_description: 'student' }))
    expect(totals.discount_label).toBe('Discount (\u2068student\u2069)')
    expect(totals.discount).toBe('-₱100.00')
  })

  it('collapses whitespace in the description and ignores an empty one', () => {
    expect(build_receipt_view(receipt({ discount: '50', discount_description: '  senior   citizen ' })).totals.discount_label)
      .toBe('Discount (\u2068senior citizen\u2069)')
    expect(build_receipt_view(receipt({ discount: '50', discount_description: '   ' })).totals.discount_label)
      .toBe('Discount')
  })

  /**
   * Isolates, not decoration: without them a right-to-left reason reorders the punctuation
   * around it and the closing parenthesis prints on the wrong side. They are invisible, and
   * the document prints this string unchanged, so both exports get the same protection.
   */
  it('isolates the reason so right-to-left text cannot flip the parentheses', () => {
    const { totals } = build_receipt_view(receipt({ discount: '50', discount_description: 'طالب' }))
    expect(totals.discount_label).toBe('Discount (\u2068طالب\u2069)')
    expect(totals.discount_label.endsWith(')')).toBe(true)
  })

  it('leaves the figure untouched by the description, to the centavo', () => {
    const plain = build_receipt_view(receipt({ discount: '100' })).totals
    const named = build_receipt_view(receipt({ discount: '100', discount_description: 'student' })).totals
    expect(named.discount).toBe(plain.discount)
    expect(named.total).toBe(plain.total)
    expect(named.subtotal).toBe(plain.subtotal)
  })

  it('shows a zero total when the discount equals the subtotal', () => {
    const view = build_receipt_view(receipt({ items: [item('A', '1', '100')], discount: '100' }))
    expect(view.totals).toEqual({ subtotal: '₱100.00', discount: '-₱100.00', discount_label: 'Discount', total: '₱0.00' })
  })

  it('shows no amount while the discount is more than the subtotal (the form refuses it first)', () => {
    const view = build_receipt_view(receipt({ discount: '99999' }))
    expect(view.totals.total).toBe('')
  })
})

describe('build_receipt_view: the money fixtures, to the centavo (criterion 24)', () => {
  type Case = { label: string; items: ItemInput[]; discount?: string; lines: [detail: string, amount: string][]; subtotal: string; total: string }
  const cases: Case[] = [
    { label: 'one item', items: [item('A', '1', '1,500.00')], lines: [['1 × ₱1,500.00', '₱1,500.00']], subtotal: '₱1,500.00', total: '₱1,500.00' },
    {
      label: 'many items',
      items: [item('A', '2', '150'), item('B', '3', '19.99'), item('C', '1', '0.01')],
      lines: [['2 × ₱150.00', '₱300.00'], ['3 × ₱19.99', '₱59.97'], ['1 × ₱0.01', '₱0.01']],
      subtotal: '₱359.98',
      total: '₱359.98',
    },
    { label: 'a fractional quantity', items: [item('A', '1.5', '150')], lines: [['1.5 × ₱150.00', '₱225.00']], subtotal: '₱225.00', total: '₱225.00' },
    { label: 'a half-centavo line', items: [item('A', '0.5', '0.01')], lines: [['0.5 × ₱0.01', '₱0.01']], subtotal: '₱0.01', total: '₱0.01' },
    { label: 'just under the half-centavo', items: [item('A', '0.499', '0.01')], lines: [['0.499 × ₱0.01', '₱0.00']], subtotal: '₱0.00', total: '₱0.00' },
    {
      label: 'the largest line, 999,999.99 x 9,999.999',
      items: [item('A', '9,999.999', '999,999.99')],
      lines: [['9,999.999 × ₱999,999.99', '₱9,999,998,900.00']],
      subtotal: '₱9,999,998,900.00',
      total: '₱9,999,998,900.00',
    },
    { label: 'the 0.1 x 3 trap', items: [item('A', '3', '0.1')], lines: [['3 × ₱0.10', '₱0.30']], subtotal: '₱0.30', total: '₱0.30' },
    { label: 'the 19.99 x 3 trap', items: [item('A', '3', '19.99')], lines: [['3 × ₱19.99', '₱59.97']], subtotal: '₱59.97', total: '₱59.97' },
    { label: 'a discount of 0', items: [item('A', '2', '10')], discount: '0', lines: [['2 × ₱10.00', '₱20.00']], subtotal: '₱20.00', total: '₱20.00' },
    { label: 'a discount equal to the subtotal', items: [item('A', '2', '10')], discount: '20', lines: [['2 × ₱10.00', '₱20.00']], subtotal: '₱20.00', total: '₱0.00' },
  ]

  it.each(cases)('prints $label exactly', ({ items, discount, lines, subtotal, total }) => {
    const view = build_receipt_view(receipt({ items, discount: discount ?? '' }))
    expect(view.items.map((line) => [detail_of(line), line.amount])).toEqual(lines)
    expect(view.totals.total).toBe(total)
    expect(view.totals.subtotal ?? view.totals.total).toBe(discount && discount !== '0' ? subtotal : total)
  })

  function displayed_subtotal(view: ReceiptView) {
    // With no discount the Subtotal row is absent and the Total is the subtotal.
    return centavos_of(view.totals.subtotal ?? view.totals.total)
  }

  it.each(cases)('has printed lines that add up to the printed subtotal: $label', ({ items, discount }) => {
    const view = build_receipt_view(receipt({ items, discount: discount ?? '' }))
    const sum = view.items.reduce((total, line) => total + centavos_of(line.amount), 0)
    expect(sum).toBe(displayed_subtotal(view))
  })

  it('adds up for 50 items with fractional quantities', () => {
    const quantities = ['0.333', '1.5', '2.25', '0.001', '7.777', '12', '0.5', '3.141']
    const prices = ['19.99', '0.07', '1,234.56', '0.01', '333.33', '5', '0.99', '99.95']
    const items = Array.from({ length: 50 }, (_, i) => item(`Item ${i + 1}`, quantities[i % 8], prices[(i * 3) % 8]))
    const view = build_receipt_view(receipt({ items, discount: '12.34' }))
    expect(view.items).toHaveLength(50)
    const sum = view.items.reduce((total, line) => total + centavos_of(line.amount), 0)
    expect(sum).toBe(centavos_of(view.totals.subtotal ?? ''))
    expect(centavos_of(view.totals.total)).toBe(sum - 1234)
  })

  it('agrees on the Total with the form summary (criterion 26: the Total is now the only figure)', () => {
    const input = receipt({ items: [item('A', '3', '19.99'), item('B', '1.5', '10')], discount: '5' })
    const view = build_receipt_view(input)
    const form_total = summarise_receipt(input).total
    expect(form_total).toBeDefined()
    expect(view.totals.total).toBe(format_centavos(form_total ?? -1))
  })
})

describe('build_receipt_view: quantity (criterion 27)', () => {
  it.each([
    ['1.5', '1.5'],
    ['2', '2'],
    ['2.000', '2'],
    ['1.500', '1.5'],
    ['007', '7'],
    ['9,999.999', '9,999.999'],
    ['0.001', '0.001'],
  ])('prints %s as %s', (typed, shown) => {
    const view = build_receipt_view(receipt({ items: [item('A', typed, '1')] }))
    expect(view.items[0].quantity).toBe(shown)
  })
})

describe('build_receipt_view: lines that are not valid yet', () => {
  it('leaves the numbers empty rather than inventing them', () => {
    const view = build_receipt_view(receipt({ items: [item('A', '', '10'), item('B', '1', 'abc')] }))
    expect(view.items.map((line) => [detail_of(line), line.amount])).toEqual([['', ''], ['', '']])
  })
})

describe('build_receipt_view: payment (criterion 6)', () => {
  it('names an institution, with its logo path and the reference', () => {
    expect(build_receipt_view(receipt()).payment).toEqual({
      name: 'GCash',
      icon: '/institutions/gcash.png',
      reference: '1234567890',
    })
  })

  it('has no logo and no reference for Cash, even when one is stored', () => {
    expect(build_receipt_view(receipt({ payment_method: 'cash', reference_no: '999' })).payment).toEqual({
      name: 'Cash',
      icon: null,
      reference: null,
    })
  })

  it('shows the Other text with no logo, and a reference when typed', () => {
    expect(build_receipt_view(receipt({ payment_method: 'other', other_method: '  Barter ', reference_no: 'B-1' })).payment).toEqual({
      name: 'Barter',
      icon: null,
      reference: 'B-1',
    })
  })

  it('leaves the reference out when it is blank', () => {
    expect(build_receipt_view(receipt({ reference_no: '   ' })).payment.reference).toBeNull()
  })
})

describe('build_receipt_view: notes (criterion 7)', () => {
  it('is null, not an empty string, when there are no notes', () => {
    expect(build_receipt_view(receipt({ notes: '' })).notes).toBeNull()
    expect(build_receipt_view(receipt({ notes: ' \r\n  ' })).notes).toBeNull()
  })

  it('keeps line breaks, normalised to LF', () => {
    expect(build_receipt_view(receipt({ notes: 'a\r\nb\rc' })).notes).toBe('a\nb\nc')
  })

  it('keeps markup as literal text', () => {
    expect(build_receipt_view(receipt({ notes: '<script>alert(1)</script>' })).notes).toBe('<script>alert(1)</script>')
  })
})

describe('build_receipt_view: images', () => {
  it('knows whether any item has a photo', () => {
    expect(build_receipt_view(receipt()).has_images).toBe(false)
    const view = build_receipt_view(receipt({ items: [item('A', '1', '1'), item('B', '1', '1', 'data:image/jpeg;base64,AA==')] }))
    expect(view.has_images).toBe(true)
    expect(view.items.map((line) => line.image)).toEqual([null, 'data:image/jpeg;base64,AA=='])
  })
})

describe('the statement (criterion 10)', () => {
  it('is the exact sentence', () => {
    expect(receipt_statement).toBe('This is a proof of payment.')
  })

  it('is on the view for every input, including an empty one', () => {
    expect(build_receipt_view(receipt()).statement).toBe(receipt_statement)
    const empty = receipt({ issuer_name: '', recipient_name: '', items: [], payment_method: '', notes: '' })
    expect(build_receipt_view(empty).statement).toBe(receipt_statement)
  })
})

describe('the words the document must not use (criterion 11)', () => {
  function every_string(view: ReceiptView): string[] {
    return [
      ...Object.values(receipt_labels),
      view.statement,
      view.receipt_no,
      view.date,
      view.issuer,
      view.recipient,
      view.paid_line ?? '',
      ...view.items.flatMap((line) => [line.name, detail_of(line), line.amount]),
      ...Object.values(view.totals).filter((text): text is string => text !== null),
      view.payment.name,
      view.payment.reference ?? '',
      view.notes ?? '',
    ]
  }

  const view = build_receipt_view(receipt({ discount: '50', notes: 'Thanks', payment_method: 'other', other_method: 'Barter' }))

  it('has no invoice, OR No., serial, TIN or VAT wording', () => {
    for (const text of every_string(view)) {
      expect(text).not.toMatch(/\b(?:invoice|serial|tin|vat)\b/i)
      expect(text).not.toContain('OR No.')
    }
  })

  it('has no Paid stamp (the caption is "Paid with", never a bare Paid)', () => {
    for (const text of every_string(view)) expect(text).not.toMatch(/^\s*paid\s*$/i)
  })

  it('never says "Official Receipt": the document claims only that it is a proof of payment', () => {
    expect(every_string(view).filter((text) => text.includes('Official Receipt'))).toEqual([])
    expect(receipt_statement).not.toMatch(/BIR|official/i)
  })

  it('labels the number "Receipt number" and the date "Date", never an OR or serial number', () => {
    expect(receipt_labels.receipt_no).toBe('Receipt number')
    expect(receipt_labels.date).toBe('Date')
  })
})

describe('build_receipt_view: the amount as a sentence', () => {
  it('reads the Total and the long date in one line', () => {
    expect(build_receipt_view(receipt()).paid_line).toBe('₱1,500.00 paid on 16 October 2026')
    expect(build_receipt_view(receipt({ discount: '500' })).paid_line).toBe('₱1,000.00 paid on 16 October 2026')
  })

  it('uses the same Total the summary shows, to the centavo', () => {
    const view = build_receipt_view(receipt({ items: [item('A', '3', '19.99'), item('B', '1.5', '10')], discount: '5' }))
    expect(view.paid_line).toBe(`${view.totals.total} paid on ${view.date}`)
  })

  it('is absent while the total is not valid (the form refuses it first)', () => {
    expect(build_receipt_view(receipt({ discount: '99999' })).paid_line).toBeNull()
  })

  it('is built from the parts of the date, correct a day behind UTC', () => {
    expect(build_receipt_view(receipt({ receipt_date: '2026-01-05' })).paid_line).toMatch(/ paid on 5 January 2026$/)
  })
})
