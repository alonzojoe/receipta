/** What pagination adds up. `first_head` and `continuation_head` are sums of measured parts. */
export type Units = {
  first_head: number
  continuation_head: number
  foot_band: number
  /** Height `Page N of M` adds to the last page. 0: it shares the footer's line. */
  indicator: number
  tail: number
  totals: number
  rows: number[]
}

export type MeasureResult = { ok: true; units: Units } | { ok: false; missing: string }

export type ReadHeight = (element: Element) => number

const read_rect_height: ReadHeight = (element) => element.getBoundingClientRect().height

/**
 * Rounded up to a whole pixel, so a bottom border is never clipped. The small allowance
 * absorbs layout rounding (56.0000001) so a unit that is exactly 56 is not reported as 57;
 * a real fraction is always above it.
 */
export function whole_pixels(height: number) {
  return Math.ceil(height - 0.01)
}

function usable(height: number | undefined): height is number {
  return height !== undefined && Number.isFinite(height) && height > 0
}

/**
 * Reads the height of every unit pagination adds up from a mounted measurement instance.
 * A unit that is missing, zero, negative or not finite is reported by name instead of being
 * guessed: there is no fallback estimate, because a built-in 72 / 48 guess is a rows-per-page
 * constant by another name and would clip a row in exactly the case it was needed. jsdom
 * returns 0 for everything, which is why this is the natural place to test that.
 */
export function measure_units(root: ParentNode, read: ReadHeight = read_rect_height): MeasureResult {
  function one(name: string): number | undefined {
    const matches = root.querySelectorAll(`[data-measure="${name}"]`)
    if (matches.length !== 1) return undefined
    const height = whole_pixels(read(matches[0]))
    return usable(height) ? height : undefined
  }

  // The top of page 1 is the title block plus the table's heading row; a later page opens with
  // the running header plus the same heading row, because a column of bare numbers is
  // unreadable without it.
  const parts = {} as Record<'first_top' | 'running_head' | 'table_head' | 'foot_band' | 'tail' | 'totals', number>
  for (const name of ['first_top', 'running_head', 'table_head', 'foot_band', 'tail', 'totals'] as const) {
    const height = one(name)
    if (height === undefined) return { ok: false, missing: name }
    parts[name] = height
  }
  const single = {
    first_head: parts.first_top + parts.table_head,
    continuation_head: parts.running_head + parts.table_head,
    foot_band: parts.foot_band,
    indicator: 0,
    tail: parts.tail,
    totals: parts.totals,
  }

  const rows: number[] = []
  for (const [index, element] of [...root.querySelectorAll('[data-measure="row"]')].entries()) {
    const height = whole_pixels(read(element))
    if (!usable(height)) return { ok: false, missing: `row ${index + 1}` }
    rows.push(height)
  }
  if (rows.length === 0) return { ok: false, missing: 'rows' }
  return { ok: true, units: { ...single, rows } }
}

/** The whole document's height, for the image export. Undefined when it cannot be read. */
export function measure_document(node: Element, read: ReadHeight = read_rect_height) {
  const height = whole_pixels(read(node))
  return usable(height) ? height : undefined
}

/**
 * How tall a page's content really is, for the check after render: a page whose content
 * exceeds the budget is a failure, not an export with a clipped line. `scrollHeight` of the
 * fixed-height body reports the overflow that `getBoundingClientRect` would hide.
 */
export function measure_page_content(page: Element) {
  const body = page.querySelector('[data-page-body]')
  if (!body) return undefined
  const height = (body as HTMLElement).scrollHeight
  return usable(height) ? height : undefined
}
