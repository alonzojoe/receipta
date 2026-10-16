import { page_usable_height } from './type_scale'

/**
 * Every height is a measured, whole-pixel number from the rendered document. The
 * function knows nothing of photos, names or counts: a row with a thumbnail is a bigger
 * number, and that is the only way it differs.
 */
export type PaginationInput = {
  /** Room on one page between the margins. Defaults to the A4 page. */
  usable?: number
  /** Header, summary row and items caption: the top of page 1. */
  first_head: number
  /** The compact running header on every later page. */
  continuation_head: number
  /** Statement and `REF - Page N of M`, at the bottom of every page except the last. */
  foot_band: number
  /** Extra height `Page N of M` adds to the last page of a multi-page receipt. 0 when it shares a line. */
  indicator: number
  /** One height per item row, in order. */
  rows: readonly number[]
  /** Totals, payment, notes, statement and footer: the unit the last row travels with. */
  tail: number
  /**
   * The totals block alone, which is the first part of `tail`. It is only used when a
   * receipt of one item cannot fit on a single page: the item and its totals stay on page 1
   * and the rest of the tail (payment, notes, statement, footer) moves to page 2, so the
   * first page always carries an item and a reader can check the sum from it.
   */
  totals: number
}

/** `only`: the whole receipt. Otherwise `first`, any number of `middle`, then `last`. */
export type PageKind = 'only' | 'first' | 'middle' | 'last'

export type PageSlice = {
  kind: PageKind
  /** Indices into `rows`, in order. Empty only for the closing page of a split tail. */
  rows: readonly number[]
  /**
   * Present only for a single item that does not fit on one page with its tail, where the
   * tail is dealt out across two pages. On the first page: `totals` (the item and its totals,
   * the rest follows) or `none` (the item alone). On the last page: `rest` (what follows the
   * totals) or `whole` (the entire tail). Absent means the page carries the whole tail if it
   * is `only` or `last`, and none of it otherwise.
   */
  split?: 'totals' | 'rest' | 'none' | 'whole'
}

export type PaginationFailure =
  /** A height is missing, zero, negative, not finite, or there are no rows. */
  | 'unmeasured'
  /** A single row cannot fit on a page of its own. */
  | 'row_too_tall'
  /** The last row, the totals block and the indicator cannot fit on one page. */
  | 'tail_too_tall'
  /** The header and its foot band alone do not fit on a page. */
  | 'head_too_tall'

export type Pagination =
  | { ok: true; pages: readonly PageSlice[] }
  | { ok: false; reason: PaginationFailure }

function is_height(value: number) {
  return Number.isFinite(value) && value > 0
}

function sum(heights: readonly number[], indices: readonly number[]) {
  return indices.reduce((total, index) => total + heights[index], 0)
}

/** The content height of one page, foot band or indicator included. */
export function page_content_height(input: PaginationInput, page: PageSlice) {
  const head = page.kind === 'only' || page.kind === 'first' ? input.first_head : input.continuation_head
  const rows = sum(input.rows, page.rows)
  if (page.split === 'totals') return head + rows + input.totals + input.foot_band
  if (page.split === 'none') return head + rows + input.foot_band
  if (page.split === 'rest') return head + rows + (input.tail - input.totals) + input.indicator
  if (page.split === 'whole') return head + rows + input.tail + input.indicator
  if (page.kind === 'only') return head + rows + input.tail
  if (page.kind === 'last') return head + rows + input.tail + input.indicator
  return head + rows + input.foot_band
}

/**
 * Breaks the items into pages. A pure function of measured heights.
 *
 * - If everything fits, it is one page with no foot band and no indicator.
 * - Otherwise rows fill a page until the next would not fit; a row that fits exactly
 *   stays (`<=`). A row that does not fit moves to the next page whole.
 * - The last row is held back and travels with the totals block: filling is greedy over
 *   every row but the last, and the page left open becomes the final page only if it can
 *   also hold the last row, the totals and the indicator. Otherwise they open a new final
 *   page and the open page keeps its foot band. Totals never sit alone.
 *
 * The first page always carries at least one item row (author decision). For a receipt of
 * a single item that cannot fit with its tail, that means the tail is split: page 1 holds
 * the item and the totals, page 2 the payment, notes, statement and footer. This is the one
 * case where a page has no item row, and it is the closing page, not the totals page. Only
 * when even the totals do not fit beside the item (a header taller than half a page) does the
 * whole tail take page 2.
 *
 * The same split applies to the last row of a longer receipt: when it cannot share a page
 * with the whole tail, it keeps the totals (on the open page if it fits there, else on a page
 * of its own) and the rest of the tail closes the receipt. The totals are still on exactly one
 * page, and it is the one that carries the last item row.
 */
export function paginate_receipt(input: PaginationInput): Pagination {
  const { first_head, continuation_head, foot_band, indicator, rows, tail, totals } = input
  const usable = input.usable ?? page_usable_height
  const measured = [usable, first_head, continuation_head, foot_band, tail, totals, ...rows]
  // The indicator may be 0: the page label can sit in a line that is there anyway.
  const indicator_ok = Number.isFinite(indicator) && indicator >= 0
  if (rows.length === 0 || !indicator_ok || !measured.every(is_height) || totals >= tail) return { ok: false, reason: 'unmeasured' }

  const all = rows.map((_, index) => index)
  if (first_head + sum(rows, all) + tail <= usable) {
    return { ok: true, pages: [{ kind: 'only', rows: all }] }
  }

  if (first_head + foot_band > usable) return { ok: false, reason: 'head_too_tall' }

  const last = rows.length - 1

  if (rows.length === 1) {
    // One item that does not fit with its tail. The first page must carry an item, so the
    // item stays on page 1 and the tail closes the receipt on page 2. (The alternative, the
    // header alone on page 1, reads as a broken document.)
    if (first_head + rows[0] + foot_band > usable) return { ok: false, reason: 'row_too_tall' }
    const rest = tail - totals
    // Preferred: the totals stay with the item, so page 1 can be checked against its sum.
    if (first_head + rows[0] + totals + foot_band <= usable && continuation_head + rest + indicator <= usable) {
      return {
        ok: true,
        pages: [
          { kind: 'first', rows: [0], split: 'totals' },
          { kind: 'last', rows: [], split: 'rest' },
        ],
      }
    }
    // A header so tall (a 100-character issuer and recipient, a wrapped amount) that the
    // totals do not fit beside the item: the whole tail takes page 2. The totals then sit on a
    // page with no item row, which is the lesser evil next to refusing to make the file.
    if (continuation_head + tail + indicator <= usable) {
      return {
        ok: true,
        pages: [
          { kind: 'first', rows: [0], split: 'none' },
          { kind: 'last', rows: [], split: 'whole' },
        ],
      }
    }
    return { ok: false, reason: 'tail_too_tall' }
  }

  const closed: number[][] = []
  let open: number[] = []
  let used = first_head + foot_band

  for (let index = 0; index < last; index += 1) {
    const height = rows[index]
    if (used + height > usable) {
      // The first page always carries an item: if the first row does not fit under the
      // header, nothing will, and a header-only page is not an outcome we produce.
      if (open.length === 0 && closed.length === 0) return { ok: false, reason: 'row_too_tall' }
      // Close the page and start a continuation page. A continuation page is only ever
      // opened for a row, so it is never empty, and a row that does not fit even there
      // fits nowhere.
      closed.push(open)
      open = []
      used = continuation_head + foot_band
      if (used + height > usable) return { ok: false, reason: 'row_too_tall' }
    }
    open.push(index)
    used += height
  }

  const pages: PageSlice[] = closed.map((slice, position) => ({
    kind: position === 0 ? 'first' : 'middle',
    rows: slice,
  }))

  // The open page was filled with a foot band in mind. As the final page it needs none,
  // but it must also take the last row, the totals and the indicator. It cannot be page 1
  // here: the first rule would have kept the whole receipt on one page.
  const unit = rows[last] + tail + indicator
  if (closed.length > 0 && continuation_head + sum(rows, open) + unit <= usable) {
    pages.push({ kind: 'last', rows: [...open, last] })
    return { ok: true, pages }
  }

  if (continuation_head + unit <= usable) {
    pages.push({ kind: closed.length === 0 ? 'first' : 'middle', rows: open })
    pages.push({ kind: 'last', rows: [last] })
    return { ok: true, pages }
  }

  // The last row and the whole tail do not fit on a continuation page of their own. Deal the
  // tail out as a single item does: the last row keeps the totals, the rest of the tail closes
  // the receipt on one more page. The totals page is the open page when the last row fits
  // there (the head is the first page's if nothing was closed), otherwise a page of its own.
  const rest_fits = continuation_head + (tail - totals) + indicator <= usable
  const last_row = rows[last]
  const open_head = closed.length === 0 ? first_head : continuation_head
  if (rest_fits && open_head + sum(rows, open) + last_row + totals + foot_band <= usable) {
    pages.push({ kind: closed.length === 0 ? 'first' : 'middle', rows: [...open, last], split: 'totals' })
    pages.push({ kind: 'last', rows: [], split: 'rest' })
    return { ok: true, pages }
  }
  if (rest_fits && continuation_head + last_row + totals + foot_band <= usable) {
    pages.push({ kind: closed.length === 0 ? 'first' : 'middle', rows: open })
    pages.push({ kind: 'middle', rows: [last], split: 'totals' })
    pages.push({ kind: 'last', rows: [], split: 'rest' })
    return { ok: true, pages }
  }
  // A row taller than a continuation page fits nowhere; otherwise it is the tail that cannot be placed.
  return { ok: false, reason: continuation_head + last_row > usable ? 'row_too_tall' : 'tail_too_tall' }
}
