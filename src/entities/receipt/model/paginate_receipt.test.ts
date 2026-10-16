import { describe, expect, it } from 'vitest'

import { format_centavos } from '@/shared/lib/format_currency'

import { name_max_length, price_max_centavos, quantity_max_thousandths } from './limits'
import {
  page_content_height,
  paginate_receipt,
  type PageSlice,
  type Pagination,
  type PaginationInput,
} from './paginate_receipt'
import {
  description_width,
  line_height,
  page_usable_height,
  photo_row_height,
  table_columns,
  thumbnail_size,
  type_scale,
} from './type_scale'

const usable = page_usable_height
const photo_row = photo_row_height
const plain_row = 48
/** A 100-character name wrapped to three lines, its `qty x price` line, and 8 px padding either side. */
const three_line_row = 3 * line_height.body + 16

const first_head = 260
const continuation_head = 76
const foot_band = 64
const indicator = 22
const tail = 300
const totals = 130
const largest_tail = 520

function input(rows: number[], overrides: Partial<PaginationInput> = {}): PaginationInput {
  return { first_head, continuation_head, foot_band, indicator, tail, totals, rows, ...overrides }
}

function pages_of(result: Pagination): readonly PageSlice[] {
  if (!result.ok) throw new Error(`expected pages, got ${result.reason}`)
  return result.pages
}

/**
 * The three invariants every case must keep (criteria 37 and 38): each row once and in
 * order, no page over its budget, and the last row on the page that carries the totals.
 * Plus the shape rules: one `only` or `first ... last`, a foot band on all but the last.
 */
function expect_invariants(source: PaginationInput, result: Pagination) {
  const pages = pages_of(result)
  const budget = source.usable ?? usable

  expect(pages.flatMap((page) => [...page.rows])).toEqual(source.rows.map((_, index) => index))

  for (const page of pages) expect(page_content_height(source, page)).toBeLessThanOrEqual(budget)

  const last_page = pages[pages.length - 1]
  expect(['only', 'last']).toContain(last_page.kind)
  // The one exception: a single item whose tail is split, so its totals sit on page 1 with it.
  if (last_page.split === 'rest') {
    // The page before the closing page carries the last item row and the totals.
    const carrier = pages[pages.length - 2]
    expect(carrier.split).toBe('totals')
    expect(carrier.rows).toContain(source.rows.length - 1)
  } else if (last_page.split === 'whole') expect(pages[0].split).toBe('none')
  else expect(last_page.rows).toContain(source.rows.length - 1)

  // The first page always carries an item row (author decision).
  expect(pages[0].rows.length).toBeGreaterThan(0)

  if (pages.length === 1) expect(pages[0].kind).toBe('only')
  else {
    expect(pages.map((page) => page.kind)).toEqual(
      pages.map((_, index) => (index === 0 ? 'first' : index === pages.length - 1 ? 'last' : 'middle')),
    )
    // Every page but a split tail's closing page carries a row.
    for (const page of pages.slice(1)) if (page.split !== 'rest' && page.split !== 'whole') expect(page.rows.length).toBeGreaterThan(0)
  }
}

/** Heights that sum to `total`, built from `unit` and one remainder row. */
function filling(total: number, unit: number) {
  const whole = Math.floor(total / unit)
  const remainder = total - whole * unit
  return remainder === 0 ? Array<number>(whole).fill(unit) : [...Array<number>(whole).fill(unit), remainder]
}

/** The room page 1 leaves for rows once its head and foot band are paid for. */
const first_page_room = usable - first_head - foot_band
const middle_page_room = usable - continuation_head - foot_band

describe('paginate_receipt: one page', () => {
  it('keeps a short receipt on one page, with no foot band and no indicator', () => {
    const source = input([photo_row, plain_row, plain_row])
    const pages = pages_of(paginate_receipt(source))
    expect(pages).toEqual([{ kind: 'only', rows: [0, 1, 2] }])
    expect(page_content_height(source, pages[0])).toBe(first_head + photo_row + 2 * plain_row + tail)
    expect_invariants(source, paginate_receipt(source))
  })

  it('keeps 1 to 5 ordinary rows on one page (criterion 35, the typical case)', () => {
    // Typical heights for the header and totals blocks. The real ones are measured in the
    // browser (task 8); criterion 35 is a typical case, not a guarantee.
    for (let count = 1; count <= 5; count += 1) {
      const source = input(Array<number>(count).fill(plain_row), { first_head: 230, tail: 220 })
      expect(pages_of(paginate_receipt(source))).toHaveLength(1)
    }
  })

  it('stays one page when the content lands exactly on the limit, and splits one pixel over', () => {
    const rows = [photo_row, plain_row]
    const exact = input(rows, { tail: usable - first_head - photo_row - plain_row })
    expect(pages_of(paginate_receipt(exact))).toEqual([{ kind: 'only', rows: [0, 1] }])
    const over = input(rows, { tail: usable - first_head - photo_row - plain_row + 1 })
    expect(pages_of(paginate_receipt(over)).length).toBeGreaterThan(1)
    expect_invariants(over, paginate_receipt(over))
  })

  it('does not count the indicator against a one-page receipt', () => {
    const source = input([plain_row], { tail: usable - first_head - plain_row, indicator: 500 })
    expect(pages_of(paginate_receipt(source))).toEqual([{ kind: 'only', rows: [0] }])
  })
})

describe('paginate_receipt: 37a, rows end exactly at the page limit', () => {
  // Page 1's room is exact for the first rows; more rows follow so it is not one page.
  const fitting = filling(first_page_room, photo_row)
  const rest = [photo_row, photo_row, photo_row]

  it('keeps the row that fits to the pixel (<=), with no empty successor page', () => {
    const source = input([...fitting, ...rest])
    expect(fitting.reduce((a, b) => a + b, 0)).toBe(first_page_room)
    const pages = pages_of(paginate_receipt(source))
    expect(pages[0].rows).toEqual(fitting.map((_, index) => index))
    for (const page of pages) expect(page.rows.length).toBeGreaterThan(0)
    expect_invariants(source, paginate_receipt(source))
  })

  it('moves that row to page 2 when it is one pixel taller (proves < was not used)', () => {
    const taller = [...fitting.slice(0, -1), fitting[fitting.length - 1] + 1]
    const source = input([...taller, ...rest])
    const pages = pages_of(paginate_receipt(source))
    expect(pages[0].rows).toEqual(taller.slice(0, -1).map((_, index) => index))
    expect(pages[1].rows[0]).toBe(taller.length - 1)
    expect_invariants(source, paginate_receipt(source))
  })

  it('also stays at the limit on a continuation page', () => {
    const head = filling(first_page_room, photo_row)
    const middle = filling(middle_page_room, photo_row)
    const source = input([...head, ...middle, photo_row, photo_row])
    const pages = pages_of(paginate_receipt(source))
    expect(pages[1].rows).toEqual(middle.map((_, index) => head.length + index))
    expect_invariants(source, paginate_receipt(source))
  })
})

describe('paginate_receipt: 37b, one row more than fits', () => {
  it('moves that row, and only that row, to the next page whole', () => {
    const fitting = filling(first_page_room, photo_row)
    const source = input([...fitting, photo_row, photo_row])
    const pages = pages_of(paginate_receipt(source))
    expect(pages[0].rows).toEqual(fitting.map((_, index) => index))
    // The next row starts page 2, whole, and appears nowhere else.
    expect(pages[1].rows[0]).toBe(fitting.length)
    expect(pages.filter((page) => page.rows.includes(fitting.length))).toHaveLength(1)
    expect_invariants(source, paginate_receipt(source))
  })
})

describe('paginate_receipt: 37c to 37e, fifty rows, and rows of different heights (criterion 36)', () => {
  const with_photos = Array<number>(50).fill(photo_row)
  const without = Array<number>(50).fill(plain_row)
  const mixed = Array.from({ length: 50 }, (_, index) => (index % 2 === 0 ? photo_row : plain_row))

  it('37c: 50 rows of 72 take 7 pages (6 on page 1, 8 on each middle page, the rest with the totals)', () => {
    const source = input(with_photos)
    const pages = pages_of(paginate_receipt(source))
    expect(pages).toHaveLength(7)
    expect(pages.map((page) => page.rows.length)).toEqual([6, 8, 8, 8, 8, 8, 4])
    expect_invariants(source, paginate_receipt(source))
  })

  it('37d: 50 rows of 48 take 5 pages', () => {
    const source = input(without)
    const pages = pages_of(paginate_receipt(source))
    expect(pages).toHaveLength(5)
    expect(pages.map((page) => page.rows.length)).toEqual([9, 13, 13, 13, 2])
    expect_invariants(source, paginate_receipt(source))
  })

  it('37e: alternating 72 and 48 take 6 pages, which is neither c nor d', () => {
    const source = input(mixed)
    const pages = pages_of(paginate_receipt(source))
    expect(pages).toHaveLength(6)
    expect_invariants(source, paginate_receipt(source))
    const counts = [with_photos, without, mixed].map((rows) => pages_of(paginate_receipt(input(rows))).length)
    expect(new Set(counts).size).toBe(3)
  })

  it('gives different page counts for the same number of rows when their heights differ', () => {
    const short = pages_of(paginate_receipt(input(Array<number>(20).fill(plain_row)))).length
    const tall = pages_of(paginate_receipt(input(Array<number>(20).fill(photo_row)))).length
    expect(tall).toBeGreaterThan(short)
  })

  it('has no rows-per-page constant anywhere in the entity source', () => {
    const sources = import.meta.glob('/src/entities/receipt/model/*.ts', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>
    const production = Object.entries(sources).filter(([path]) => !path.endsWith('.test.ts'))
    expect(production.length).toBeGreaterThan(5)
    for (const [path, text] of production) {
      expect(text, path).not.toMatch(/rows_per_page|per_page|rows_each_page|ROWS_PER/i)
    }
  })
})

describe('paginate_receipt: 37f, a row that wraps to three lines', () => {
  it('is not split when it is first, and sits first on page 1', () => {
    const source = input([three_line_row, ...Array<number>(20).fill(plain_row)])
    const pages = pages_of(paginate_receipt(source))
    expect(pages[0].rows[0]).toBe(0)
    expect_invariants(source, paginate_receipt(source))
  })

  it('travels with the totals when it is last', () => {
    const source = input([...Array<number>(20).fill(plain_row), three_line_row])
    const pages = pages_of(paginate_receipt(source))
    expect(pages[pages.length - 1].rows).toContain(20)
    expect_invariants(source, paginate_receipt(source))
  })

  it('obeys <= when it lands exactly on the limit, and moves when one pixel over', () => {
    const rows = [photo_row, three_line_row, photo_row, plain_row, plain_row]
    const room = photo_row + three_line_row
    const exact = input(rows, { first_head: usable - foot_band - room })
    expect(pages_of(paginate_receipt(exact))[0].rows).toEqual([0, 1])
    const over = input(rows, { first_head: usable - foot_band - room + 1 })
    expect(pages_of(paginate_receipt(over))[0].rows).toEqual([0])
    expect_invariants(exact, paginate_receipt(exact))
    expect_invariants(over, paginate_receipt(over))
  })
})

describe('paginate_receipt: 37g, a row taller than any possible content', () => {
  /** Built from the limits, so changing a limit changes this test's input. */
  function worst_case_row() {
    const widest_amount = format_centavos(
      Math.floor((quantity_max_thousandths * price_max_centavos + 500) / 1000),
    )
    // An upper bound: no glyph is wider than 1em, and the name wraps anywhere.
    // The table has fixed columns: the name gets the description column less the thumbnail and
    // its gap. The amount wraps by character in its own 112 px column, one em per glyph at most.
    const amount_lines = Math.ceil((widest_amount.length * type_scale.body) / (table_columns.amount - 12))
    const name_column = description_width - thumbnail_size - 12
    const lines = Math.max(amount_lines, Math.ceil((name_max_length * type_scale.body) / name_column))
    return Math.max(thumbnail_size + 16, lines * line_height.body + 16)
  }

  it('is shorter than the usable page, with room left for the head and foot band', () => {
    const row = worst_case_row()
    expect(row).toBeGreaterThan(three_line_row)
    expect(row).toBeLessThan(usable)
    expect(continuation_head + row + foot_band).toBeLessThan(usable)
  })

  it('paginates a receipt of nothing but worst-case rows', () => {
    const source = input(Array<number>(50).fill(worst_case_row()))
    expect_invariants(source, paginate_receipt(source))
  })

  it('returns row_too_tall for an absurd row, and does not throw', () => {
    expect(paginate_receipt(input([plain_row, usable + 1, plain_row]))).toEqual({ ok: false, reason: 'row_too_tall' })
    expect(paginate_receipt(input([plain_row, middle_page_room + 1, plain_row]))).toEqual({
      ok: false,
      reason: 'row_too_tall',
    })
  })

  it('accepts a row that exactly fills a continuation page', () => {
    const source = input([plain_row, middle_page_room, plain_row])
    expect_invariants(source, paginate_receipt(source))
  })
})

describe('paginate_receipt: 38, the last row travels with the totals', () => {
  it('moves the last row to the final page when the items end exactly on the limit', () => {
    // Every row fills page 1 exactly; with the last row among them it would strand the totals.
    const fitting = filling(first_page_room, photo_row)
    const source = input(fitting)
    const pages = pages_of(paginate_receipt(source))
    expect(pages).toHaveLength(2)
    expect(pages[1]).toEqual({ kind: 'last', rows: [fitting.length - 1] })
    expect(pages[0].rows).toEqual(fitting.slice(0, -1).map((_, index) => index))
    expect_invariants(source, paginate_receipt(source))
  })

  it('never leaves a page with the totals and no row, wherever the rows end', () => {
    for (let count = 1; count <= 60; count += 1) {
      for (const height of [plain_row, photo_row, three_line_row]) {
        for (const total of [tail, largest_tail]) {
          const source = input(Array<number>(count).fill(height), { tail: total })
          expect_invariants(source, paginate_receipt(source))
        }
      }
    }
  })

  it('uses the last page without a foot band when the last row only fits that way', () => {
    // Open page content + last row + tail + indicator is exactly the usable height: it fits
    // only because the final page has no foot band.
    // On a continuation page: head + open rows + last + tail + indicator = usable.
    const middle_rows = filling(first_page_room, photo_row)
    const open = 3
    const exact_head = usable - (open * photo_row + photo_row + tail + indicator)
    const exact = input([...middle_rows, ...Array<number>(open + 1).fill(photo_row)], { continuation_head: exact_head })
    const exact_pages = pages_of(paginate_receipt(exact))
    expect(exact_pages).toHaveLength(2)
    expect(exact_pages[1].kind).toBe('last')
    expect(exact_pages[1].rows).toHaveLength(open + 1)
    expect_invariants(exact, paginate_receipt(exact))

    // One pixel taller: the last row and the totals open a page of their own, and the page
    // before keeps its foot band.
    const over = input([...middle_rows, ...Array<number>(open + 1).fill(photo_row)], { continuation_head: exact_head + 1 })
    const over_pages = pages_of(paginate_receipt(over))
    expect(over_pages).toHaveLength(3)
    expect(over_pages[1].kind).toBe('middle')
    expect(over_pages[2]).toEqual({ kind: 'last', rows: [middle_rows.length + open] })
    expect_invariants(over, paginate_receipt(over))
  })

  it('keeps the item on page 1 with its totals for one item and a tall tail (author decision)', () => {
    const source = input([photo_row], { tail: largest_tail })
    expect(first_head + photo_row + largest_tail).toBeGreaterThan(usable)
    expect(pages_of(paginate_receipt(source))).toEqual([
      { kind: 'first', rows: [0], split: 'totals' },
      { kind: 'last', rows: [], split: 'rest' },
    ])
    expect_invariants(source, paginate_receipt(source))
  })

  it('never produces a first page with no item row, for any number of rows or any tail', () => {
    for (let count = 1; count <= 60; count += 1) {
      for (const height of [plain_row, photo_row, three_line_row]) {
        for (const total of [tail, largest_tail, usable - first_head - height - 1]) {
          const source = input(Array<number>(count).fill(height), { tail: total })
          const result = paginate_receipt(source)
          if (result.ok) expect(result.pages[0].rows.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('refuses, rather than print a header-only page, when the first row fits nowhere under the header', () => {
    const source = input([usable - foot_band - first_head + 1, plain_row, plain_row])
    expect(paginate_receipt(source)).toEqual({ ok: false, reason: 'row_too_tall' })
    expect(paginate_receipt(input([usable - foot_band - first_head + 1], { tail: largest_tail }))).toEqual({
      ok: false,
      reason: 'row_too_tall',
    })
  })

  it('gives the whole tail to page 2 when a tall header leaves no room for the totals beside the item', () => {
    // A 100-character issuer and recipient can make the header over 500 px.
    const tall_head = usable - foot_band - photo_row - 10
    const source = input([photo_row], { first_head: tall_head, tail: largest_tail })
    expect(tall_head + photo_row + totals + foot_band).toBeGreaterThan(usable)
    expect(pages_of(paginate_receipt(source))).toEqual([
      { kind: 'first', rows: [0], split: 'none' },
      { kind: 'last', rows: [], split: 'whole' },
    ])
    expect_invariants(source, paginate_receipt(source))
  })

  it('still refuses when the whole tail cannot fit on a page of its own', () => {
    const source = input([photo_row], { first_head: usable - foot_band - photo_row - 10, tail: usable })
    expect(paginate_receipt(source)).toEqual({ ok: false, reason: 'tail_too_tall' })
  })

  it('stays on one page when a single item and the whole tail fit (no split)', () => {
    expect(pages_of(paginate_receipt(input([photo_row], { tail })))).toEqual([{ kind: 'only', rows: [0] }])
  })

  it('splits the tail at exactly the limit: totals fit page 1 by <=, one pixel more moves them', () => {
    const room = usable - first_head - photo_row - foot_band
    const fits = input([photo_row], { tail: largest_tail, totals: room })
    expect(pages_of(paginate_receipt(fits))[0].split).toBe('totals')
    // One pixel more and the totals no longer fit beside the item: the whole tail moves.
    expect(pages_of(paginate_receipt({ ...fits, totals: room + 1 }))[0].split).toBe('none')
  })

  it('deals a tail as tall as a page across two pages rather than refusing (it was tail_too_tall for 3 rows)', () => {
    const source = input([plain_row, plain_row, plain_row], { tail: usable })
    expect(pages_of(paginate_receipt(source)).map((page) => page.split)).toEqual(['totals', 'rest'])
    expect_invariants(source, paginate_receipt(source))
  })

  it('returns tail_too_tall when even the rest of the tail cannot fit a page', () => {
    expect(paginate_receipt(input([plain_row, plain_row, plain_row], { tail: usable + totals }))).toEqual({
      ok: false,
      reason: 'tail_too_tall',
    })
  })

  it('returns head_too_tall when the header and foot band alone do not fit', () => {
    expect(paginate_receipt(input([plain_row, plain_row], { first_head: usable - foot_band + 1, tail: usable }))).toEqual({
      ok: false,
      reason: 'head_too_tall',
    })
  })
})

describe('paginate_receipt: the foot band and the indicator', () => {
  it('reserves the foot band on every page but the last, and the indicator on the last', () => {
    const source = input(Array<number>(30).fill(photo_row))
    const pages = pages_of(paginate_receipt(source))
    expect(pages.length).toBeGreaterThan(2)
    pages.slice(0, -1).forEach((page) => {
      const head = page.kind === 'first' ? first_head : continuation_head
      expect(page_content_height(source, page)).toBe(
        head + page.rows.length * photo_row + foot_band,
      )
    })
    const last = pages[pages.length - 1]
    expect(page_content_height(source, last)).toBe(
      continuation_head + last.rows.length * photo_row + tail + indicator,
    )
  })

  it('does not let the page count change any height: the same indicator on 2 pages or 20', () => {
    for (const count of [12, 30, 120]) {
      const source = input(Array<number>(count).fill(photo_row))
      const pages = pages_of(paginate_receipt(source))
      const last = pages[pages.length - 1]
      expect(page_content_height(source, last)).toBe(
        continuation_head + last.rows.length * photo_row + tail + indicator,
      )
    }
  })

  it('shrinks the room for rows when the foot band is taller', () => {
    const rows = Array<number>(20).fill(photo_row)
    const small = pages_of(paginate_receipt(input(rows, { foot_band: 40 })))
    const large = pages_of(paginate_receipt(input(rows, { foot_band: 200 })))
    expect(large.length).toBeGreaterThanOrEqual(small.length)
    expect(large[0].rows.length).toBeLessThan(small[0].rows.length)
  })
})

describe('paginate_receipt: input it cannot use', () => {
  const good = input([plain_row, plain_row])
  const bad_values = [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]

  it.each(bad_values)('refuses %s for every height, without throwing', (bad) => {
    for (const key of ['first_head', 'continuation_head', 'foot_band', 'indicator', 'tail', 'totals', 'usable'] as const) {
      // The indicator may be 0: the page label can share the footer's line.
      if (key === 'indicator' && bad === 0) continue
      expect(paginate_receipt({ ...good, [key]: bad })).toEqual({ ok: false, reason: 'unmeasured' })
    }
    expect(paginate_receipt({ ...good, rows: [plain_row, bad] })).toEqual({ ok: false, reason: 'unmeasured' })
    expect(paginate_receipt({ ...good, rows: [bad, plain_row] })).toEqual({ ok: false, reason: 'unmeasured' })
  })

  it('accepts an indicator of 0 and adds nothing for it', () => {
    const source = input(Array<number>(30).fill(photo_row), { indicator: 0 })
    const pages = pages_of(paginate_receipt(source))
    const last = pages[pages.length - 1]
    expect(page_content_height(source, last)).toBe(continuation_head + last.rows.length * photo_row + tail)
  })

  it('refuses a negative indicator', () => {
    expect(paginate_receipt(input([plain_row, plain_row], { indicator: -1 }))).toEqual({ ok: false, reason: 'unmeasured' })
  })

  it('refuses no rows', () => {
    expect(paginate_receipt(input([]))).toEqual({ ok: false, reason: 'unmeasured' })
  })

  it('refuses a missing height (a measurement that returned undefined)', () => {
    const missing = { ...good, tail: undefined } as unknown as PaginationInput
    expect(paginate_receipt(missing)).toEqual({ ok: false, reason: 'unmeasured' })
  })

  it('does not change its input, and gives the same answer twice', () => {
    const rows = Object.freeze(Array<number>(30).fill(photo_row))
    const source = Object.freeze({ ...good, rows })
    expect(paginate_receipt(source)).toEqual(paginate_receipt(source))
    expect(rows).toHaveLength(30)
  })
})

describe('paginate_receipt: a multi-item receipt whose tail does not fit beside the last row', () => {
  // The reviewer's finding: one item was dealt across two pages, two or more were refused.
  const long_tail = 700
  const rows = [plain_row, plain_row, plain_row]

  it('splits the tail instead of refusing (it reproduced as tail_too_tall before the fix)', () => {
    const source = input(rows, { tail: long_tail })
    expect(continuation_head + plain_row + long_tail + indicator).toBeGreaterThan(usable)
    const result = paginate_receipt(source)
    expect(result.ok).toBe(true)
    expect_invariants(source, result)
    const pages = pages_of(result)
    expect(pages[pages.length - 1]).toEqual({ kind: 'last', rows: [], split: 'rest' })
    // The totals sit with the last item row, on the page that already held the other rows.
    expect(pages[pages.length - 2]).toEqual({ kind: 'first', rows: [0, 1, 2], split: 'totals' })
  })

  it('gives the totals a page of their own with the last row when the open page is full', () => {
    const full = filling(first_page_room, photo_row)
    const source = input([...full, plain_row], { tail: long_tail })
    const pages = pages_of(paginate_receipt(source))
    expect(pages.map((page) => page.split)).toEqual([undefined, 'totals', 'rest'])
    expect(pages[1].rows).toEqual([full.length])
    expect_invariants(source, paginate_receipt(source))
  })

  it('keeps the unsplit layout whenever the last row and the whole tail fit together', () => {
    const source = input(rows, { tail: usable - continuation_head - plain_row - indicator })
    const pages = pages_of(paginate_receipt(source))
    expect(pages.every((page) => page.split === undefined)).toBe(true)
    expect_invariants(source, paginate_receipt(source))
  })

  it('splits at exactly the limit: the tail fits by <=, one pixel more splits it', () => {
    const edge = usable - continuation_head - plain_row - indicator
    expect(pages_of(paginate_receipt(input(rows, { tail: edge }))).every((page) => page.split === undefined)).toBe(true)
    const over = input(rows, { tail: edge + 1 })
    expect(pages_of(paginate_receipt(over)).map((page) => page.split)).toEqual(['totals', 'rest'])
    expect_invariants(over, paginate_receipt(over))
  })

  it('still refuses when the rest of the tail cannot fit a page of its own', () => {
    const fits = input(rows, { tail: usable - continuation_head - indicator + totals })
    expect(paginate_receipt(fits).ok).toBe(true)
    expect(paginate_receipt({ ...fits, tail: fits.tail + 1 })).toEqual({ ok: false, reason: 'tail_too_tall' })
  })

  it('still refuses when the last row and the totals fit on no page', () => {
    const tall = usable - continuation_head - totals - foot_band
    const fits = input([plain_row, tall], { tail: long_tail })
    expect(paginate_receipt(fits).ok).toBe(true)
    expect(paginate_receipt({ ...fits, rows: [plain_row, tall + 1] })).toEqual({ ok: false, reason: 'tail_too_tall' })
  })

  it('refuses a last row taller than a page as row_too_tall', () => {
    expect(paginate_receipt(input([plain_row, usable], { tail: long_tail }))).toEqual({ ok: false, reason: 'row_too_tall' })
    expect(paginate_receipt(input([plain_row, plain_row, usable - continuation_head + 1]))).toEqual({
      ok: false,
      reason: 'row_too_tall',
    })
  })

  it('keeps every invariant across a sweep of row counts, heights and tails', () => {
    let split = 0
    for (let count = 2; count <= 9; count += 1) {
      for (const row of [36, 48, photo_row, 200]) {
        for (const tail_height of [300, 520, 640, 700, 760]) {
          for (const head of [first_head, 400]) {
            const source = input(Array<number>(count).fill(row), { tail: tail_height, first_head: head })
            const result = paginate_receipt(source)
            if (!result.ok) {
              expect(['tail_too_tall', 'head_too_tall', 'row_too_tall']).toContain(result.reason)
              continue
            }
            expect_invariants(source, result)
            if (result.pages.some((page) => page.split === 'rest')) split += 1
          }
        }
      }
    }
    expect(split).toBeGreaterThan(0)
  })
})
