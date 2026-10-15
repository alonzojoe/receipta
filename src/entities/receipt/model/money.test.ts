import { describe, expect, it } from 'vitest'

import { format_centavos } from '@/shared/lib/format_currency'

import {
  compute_totals,
  line_total,
  parse_discount,
  parse_price,
  parse_quantity,
  type MoneyReason,
} from './money'

function reason_of(result: ReturnType<typeof parse_price>) {
  return result.ok ? 'accepted' : result.reason
}

describe('parse_price: rejected input', () => {
  const rejected: [string, MoneyReason][] = [
    ['', 'empty'],
    ['   ', 'empty'],
    ['abc', 'not_a_number'],
    ['NaN', 'not_a_number'],
    ['Infinity', 'not_a_number'],
    ['-Infinity', 'negative'],
    ['1e3', 'exponent'],
    ['1E3', 'exponent'],
    ['2.5e-2', 'exponent'],
    ['-5', 'negative'],
    ['\u22125', 'negative'],
    ['+5', 'plus_sign'],
    ['.5', 'leading_decimal'],
    ['5.', 'trailing_decimal'],
    ['1.2.3', 'multiple_points'],
    ['1,23,4', 'bad_thousands'],
    [',500', 'bad_thousands'],
    ['1,2345', 'bad_thousands'],
    ['12,34.50', 'bad_thousands'],
    ['1.234,50', 'bad_thousands'],
    ['₱5', 'currency_symbol'],
    ['$5', 'currency_symbol'],
    ['5 0', 'inner_space'],
    ['5\t0', 'inner_space'],
    ['\u0665\u0660', 'non_ascii_digit'],
    ['\uFF15\uFF10', 'non_ascii_digit'],
    ['12.345', 'too_many_decimals'],
    ['0.001', 'too_many_decimals'],
    ['0', 'zero'],
    ['0.00', 'zero'],
    ['000', 'zero'],
    ['1000000', 'too_large'],
    ['999,999.995', 'too_many_decimals'],
    ['1,000,000.00', 'too_large'],
    ['9'.repeat(400), 'too_large'],
  ]

  it.each(rejected)('rejects %j as %s', (text, reason) => {
    expect(reason_of(parse_price(text))).toBe(reason)
  })

  it('never rounds a third decimal away', () => {
    expect(parse_price('12.345')).toEqual({ ok: false, reason: 'too_many_decimals' })
    expect(parse_price('12.349')).toEqual({ ok: false, reason: 'too_many_decimals' })
  })
})

describe('parse_price: accepted input', () => {
  const accepted: [string, number][] = [
    ['0.5', 50],
    ['0.01', 1],
    ['1', 100],
    ['19.99', 1999],
    ['1,234.50', 123450],
    ['1,234', 123400],
    ['007', 700],
    ['  42  ', 4200],
    ['999,999.99', 99999999],
    ['999999.99', 99999999],
  ]

  it.each(accepted)('accepts %j as %i centavos', (text, centavos) => {
    expect(parse_price(text)).toEqual({ ok: true, value: centavos })
  })

  it('holds the maximum price as an exact integer', () => {
    expect(parse_price('999,999.99')).toEqual({ ok: true, value: 99_999_999 })
  })
})

describe('parse_quantity', () => {
  const rejected: [string, MoneyReason][] = [
    ['', 'empty'],
    ['1.2345', 'too_many_decimals'],
    ['0', 'zero'],
    ['0.000', 'zero'],
    ['10000', 'too_large'],
    ['9,999.9991', 'too_many_decimals'],
    ['abc', 'not_a_number'],
    ['-1', 'negative'],
  ]

  it.each(rejected)('rejects %j as %s', (text, reason) => {
    expect(reason_of(parse_quantity(text))).toBe(reason)
  })

  const accepted: [string, number][] = [
    ['1.5', 1500],
    ['1', 1000],
    ['0.001', 1],
    ['0.333', 333],
    ['9,999.999', 9_999_999],
  ]

  it.each(accepted)('accepts %j as %i thousandths', (text, thousandths) => {
    expect(parse_quantity(text)).toEqual({ ok: true, value: thousandths })
  })
})

describe('parse_discount', () => {
  it('treats blank as 0', () => {
    expect(parse_discount('')).toEqual({ ok: true, value: 0 })
    expect(parse_discount('   ')).toEqual({ ok: true, value: 0 })
  })

  it('accepts zero', () => {
    expect(parse_discount('0')).toEqual({ ok: true, value: 0 })
    expect(parse_discount('0.00')).toEqual({ ok: true, value: 0 })
  })

  it('applies the same shape rules as price', () => {
    expect(reason_of(parse_discount('abc'))).toBe('not_a_number')
    expect(reason_of(parse_discount('-5'))).toBe('negative')
    expect(reason_of(parse_discount('5.123'))).toBe('too_many_decimals')
    expect(reason_of(parse_discount('1000000'))).toBe('too_large')
  })

  it('accepts 50.25 as centavos', () => {
    expect(parse_discount('50.25')).toEqual({ ok: true, value: 5025 })
  })
})

describe('line_total', () => {
  it('prices a single item: 1 x 100.00', () => {
    expect(line_total(1000, 10000)).toBe(10000)
  })

  it('does not hit the 0.1 x 3 float trap', () => {
    // 0.1 x 3 = 0.30000000000000004 in floats.
    expect(line_total(3000, 10)).toBe(30)
    expect(format_centavos(line_total(3000, 10))).toBe('₱0.30')
  })

  it('does not hit the 19.99 x 3 float trap', () => {
    // 19.99 * 3 = 59.97 (59.969999999999995 in floats).
    expect(line_total(3000, 1999)).toBe(5997)
    expect(format_centavos(line_total(3000, 1999))).toBe('₱59.97')
  })

  it('rounds an exact half centavo up', () => {
    // 0.5 x 0.01 = 0.005 pesos = half a centavo.
    expect(line_total(500, 1)).toBe(1)
    expect(line_total(499, 1)).toBe(0)
    // 1.5 x 0.33 = 0.495 pesos = 49.5 centavos.
    expect(line_total(1500, 33)).toBe(50)
  })

  it('handles a fractional quantity', () => {
    // 1.5 hours at 250.00.
    expect(line_total(1500, 25000)).toBe(37500)
  })

  it('keeps the maximum product exact', () => {
    const q = 9_999_999
    const p = 99_999_999
    expect(q * p).toBe(999_999_890_000_001)
    expect(q * p).toBeLessThan(Number.MAX_SAFE_INTEGER)
    // Remainder 1, so it floors.
    expect(line_total(q, p)).toBe(999_999_890_000)
    expect(format_centavos(line_total(q, p))).toBe('₱9,999,998,900.00')
  })
})

describe('compute_totals', () => {
  it('totals a single item', () => {
    expect(compute_totals([{ quantity: 1000, price: 10000 }], 0)).toEqual({
      ok: true,
      subtotal: 10000,
      discount: 0,
      total: 10000,
    })
  })

  it('rounds each line once, up: three lines of 0.5 x 0.01 give 3, not 2', () => {
    const lines = Array.from({ length: 3 }, () => ({ quantity: 500, price: 1 }))
    const totals = compute_totals(lines, 0)
    expect(totals).toMatchObject({ ok: true, subtotal: 3 })
    // Rounding the raw 1500/1000 once would give 2.
    expect(Math.round((3 * 500 * 1) / 1000)).toBe(2)
  })

  it('rounds each line once, down: three lines of 0.333 x 1.00 give 99, not 100', () => {
    const lines = Array.from({ length: 3 }, () => ({ quantity: 333, price: 100 }))
    const totals = compute_totals(lines, 0)
    expect(totals).toMatchObject({ ok: true, subtotal: 99 })
    // Rounding the raw 99.9 once would give 100.
    expect(Math.round((3 * 333 * 100) / 1000)).toBe(100)
  })

  it('always makes the subtotal equal the sum of the printed lines', () => {
    // Deterministic pseudo-random lines, so a failure reproduces.
    let seed = 12345
    const next = (limit: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return (seed % limit) + 1
    }
    for (let round = 0; round < 200; round += 1) {
      const count = next(12)
      const lines = Array.from({ length: count }, () => ({
        quantity: next(9_999_999),
        price: next(99_999_999),
      }))
      const printed = lines.map((line) => line_total(line.quantity, line.price))
      const printed_sum = printed.reduce((sum, value) => sum + value, 0)
      const totals = compute_totals(lines, 0)
      expect(totals).toMatchObject({ ok: true, subtotal: printed_sum })
    }
  })

  it('subtracts the discount from the rounded subtotal and never rounds again', () => {
    const lines = [
      { quantity: 500, price: 1 },
      { quantity: 500, price: 1 },
      { quantity: 500, price: 1 },
    ]
    expect(compute_totals(lines, 1)).toEqual({
      ok: true,
      subtotal: 3,
      discount: 1,
      total: 2,
    })
  })

  it('allows a discount equal to the subtotal: total 0.00', () => {
    const totals = compute_totals([{ quantity: 1000, price: 5000 }], 5000)
    expect(totals).toEqual({ ok: true, subtotal: 5000, discount: 5000, total: 0 })
    if (totals.ok) expect(format_centavos(totals.total)).toBe('₱0.00')
  })

  it('refuses a discount over the subtotal, so the total is never negative', () => {
    expect(compute_totals([{ quantity: 1000, price: 5000 }], 5001)).toEqual({
      ok: false,
      reason: 'discount_exceeds_subtotal',
      subtotal: 5000,
    })
  })

  it('refuses any discount on an empty list of lines', () => {
    expect(compute_totals([], 1)).toMatchObject({ ok: false })
    expect(compute_totals([], 0)).toEqual({
      ok: true,
      subtotal: 0,
      discount: 0,
      total: 0,
    })
  })

  it('treats a blank discount as 0 end to end', () => {
    const discount = parse_discount('')
    expect(discount.ok && discount.value).toBe(0)
  })

  it('stays exact with 50 lines at the maximum', () => {
    const lines = Array.from({ length: 50 }, () => ({
      quantity: 9_999_999,
      price: 99_999_999,
    }))
    const totals = compute_totals(lines, 0)
    expect(totals).toMatchObject({ ok: true, subtotal: 49_999_994_500_000 })
    expect(49_999_994_500_000).toBeLessThan(Number.MAX_SAFE_INTEGER)
    if (totals.ok) expect(format_centavos(totals.total)).toBe('₱499,999,945,000.00')
  })
})
