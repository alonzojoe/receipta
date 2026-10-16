import { describe, expect, it } from 'vitest'

import { measure_document, measure_page_content, measure_units, whole_pixels } from './measure_layout'

function build(units: Record<string, number | number[]>) {
  const root = document.createElement('div')
  const heights = new Map<Element, number>()
  for (const [name, value] of Object.entries(units)) {
    for (const height of Array.isArray(value) ? value : [value]) {
      const element = document.createElement('div')
      element.setAttribute('data-measure', name === 'rows' ? 'row' : name)
      root.appendChild(element)
      heights.set(element, height)
    }
  }
  return { root, read: (element: Element) => heights.get(element) ?? 0 }
}

// The parts as measured. first_head is first_top + table_head, continuation_head is
// running_head + table_head, and the indicator is 0 (the page label shares the footer line).
const parts = { first_top: 214, running_head: 70, table_head: 32, foot_band: 51, tail: 300, totals: 80, rows: [72, 36, 72] }
const full = parts

describe('whole_pixels', () => {
  it('rounds a real fraction up and leaves an exact value alone', () => {
    expect(whole_pixels(56)).toBe(56)
    expect(whole_pixels(56.0000001)).toBe(56)
    expect(whole_pixels(56.5)).toBe(57)
    expect(whole_pixels(56.02)).toBe(57)
  })
})

describe('measure_units', () => {
  it('reads every unit and every row in order', () => {
    const { root, read } = build(full)
    expect(measure_units(root, read)).toEqual({
      ok: true,
      units: { first_head: 246, continuation_head: 102, foot_band: 51, indicator: 0, tail: 300, totals: 80, rows: [72, 36, 72] },
    })
  })

  it('rounds each unit up to a whole pixel', () => {
    const { root, read } = build({ ...full, rows: [71.3, 55.9] })
    const result = measure_units(root, read)
    expect(result.ok && result.units.rows).toEqual([72, 56])
  })

  it.each(['first_top', 'running_head', 'table_head', 'foot_band', 'tail', 'totals'])(
    'reports %s by name when it is missing',
    (name) => {
      const { [name]: _omitted, ...rest } = full as Record<string, number | number[]>
      void _omitted
      const { root, read } = build(rest)
      expect(measure_units(root, read)).toEqual({ ok: false, missing: name })
    },
  )

  it.each([0, -4, Number.NaN, Number.POSITIVE_INFINITY])('reports a unit that measures %s, with no estimate', (bad) => {
    for (const name of ['first_top', 'tail', 'totals']) {
      const { root, read } = build({ ...full, [name]: bad })
      expect(measure_units(root, read)).toEqual({ ok: false, missing: name })
    }
    const { root, read } = build({ ...full, rows: [72, bad] })
    expect(measure_units(root, read)).toEqual({ ok: false, missing: 'row 2' })
  })

  it('reports no rows, and a unit that appears twice', () => {
    const empty = build({ ...full, rows: [] })
    expect(measure_units(empty.root, empty.read)).toEqual({ ok: false, missing: 'rows' })
    const twice = build({ ...full, tail: [300, 300] })
    expect(measure_units(twice.root, twice.read)).toEqual({ ok: false, missing: 'tail' })
  })

  it('refuses everything under jsdom, which has no layout (every height is 0)', () => {
    const { root } = build(full)
    expect(measure_units(root).ok).toBe(false)
  })
})

describe('measure_document and measure_page_content', () => {
  it('reads and rounds the document height, and refuses an unreadable one', () => {
    const node = document.createElement('div')
    expect(measure_document(node, () => 5400.2)).toBe(5401)
    expect(measure_document(node, () => 0)).toBeUndefined()
    expect(measure_document(node)).toBeUndefined()
  })

  it('reads the page body scrollHeight, and refuses a page with no body or no layout', () => {
    const page = document.createElement('div')
    expect(measure_page_content(page)).toBeUndefined()
    const body = document.createElement('div')
    body.setAttribute('data-page-body', '')
    Object.defineProperty(body, 'scrollHeight', { value: 790, configurable: true })
    page.appendChild(body)
    expect(measure_page_content(page)).toBe(790)
    Object.defineProperty(body, 'scrollHeight', { value: 0, configurable: true })
    expect(measure_page_content(page)).toBeUndefined()
  })
})
