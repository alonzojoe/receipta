/**
 * The receipt document's fixed sizes, in CSS pixels. The document is a fixed-size
 * artefact, not a responsive page (receipt-export spec, "Fixed pixel sizes"), so these are
 * numbers rather than rem. The CSS and the tests read the same constants.
 *
 * Nothing below `label`: a 600 px document viewed on a 390 pt phone is shown at about
 * 0.65, so 13 px already reads as about 8.5.
 *
 * The hierarchy follows a Stripe-style receipt (author direction): a large title, then
 * everything else small and tight, with weight and colour rather than size carrying the
 * emphasis in the table and the summary. Four sizes, and three weights (400, 500, 600).
 */
export const type_scale = {
  /** The word "Receipt", the biggest text on the page. */
  title: 28,
  /** The amount as a sentence: "P1,234.56 paid on 16 October 2026". */
  lead: 18,
  body: 14,
  /** Labels, table headings, the statement. Nothing is set smaller. */
  label: 13,
} as const

/**
 * Whole-pixel line heights. The spike measured that a fractional layout position blurs a
 * 1 px rule across three device rows, while an integer one is exactly three rows at ratio
 * 3. Every unit's height is a sum of these, so every rule lands on a whole pixel.
 */
export const line_height = {
  title: 36,
  lead: 26,
  body: 20,
  label: 18,
} as const

export const page_width = 600
export const page_height = 849
export const page_margin = 40
/** 849 - 2 x 40 = 769. Derived, never typed twice. */
export const page_usable_height = page_height - 2 * page_margin
/** The content column: the page less the margin on each side. */
export const content_width = page_width - 2 * page_margin

export const thumbnail_size = 56
export const thumbnail_radius = 6
export const payment_logo_size = 28
/** The Receipta mark at the top right, on the title's line. */
export const title_mark_size = 28
export const footer_wordmark_height = 16
/**
 * The item table's numeric columns, sized in characters of the body font (CSS `ch`, the advance
 * of "0"), not in pixels. The widest value each column can hold is knowable from the form's
 * limits, so a column is made that many characters wide plus room for the heavier punctuation
 * and the peso sign. A figure is never allowed to wrap (`white-space: nowrap`), so a column
 * that is too narrow would clip, never split a number; sizing in `ch` makes "too narrow"
 * impossible by construction whatever the font draws, because every digit is at most one `ch`
 * wide and the comma and the point are narrower.
 *
 * - qty: `9,999.999` is 9 characters.
 * - unit price: `₱999,999.99` is 11.
 * - amount: `₱9,999,998,900.00` is 17 (price 999,999.99 x quantity 9,999.999).
 *
 * `type_scale.test.ts` derives those strings from the limits and fails if a limit grows past
 * a column. Rows are separate grids, so a fixed column is also what keeps them aligned, and
 * every page of a PDF must wrap a name exactly as the measurement did.
 */
export const table_column_chars = { qty: 9, unit_price: 11, amount: 17 } as const
/** Left padding of a numeric cell, in px: the gap between one column's figure and the last. */
export const numeric_cell_padding = 12
/**
 * What the pagination tests assume a `ch` is worth in px. An assumption, not a measurement
 * (the width of Geist's "0" was not rasterised): 0.65em, a little above the 0.6em a sans
 * digit usually has, so the estimate errs towards a narrower description. Used by tests only;
 * the layout itself uses `ch`.
 */
export const ch_px_upper_bound = type_scale.body * 0.65
/** The description column's width at its narrowest: the content column less the three numeric ones. */
export const description_width_floor =
  content_width -
  Object.values(table_column_chars).reduce((sum, chars) => sum + Math.ceil(chars * ch_px_upper_bound) + numeric_cell_padding, 0)
/** A row that carries a thumbnail: 56 px of image plus 8 px of padding above and below. */
export const photo_row_height = 72
