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
 * The item table's columns. Fixed, not content-sized: every page of a PDF is its own table and
 * must wrap a name exactly as the measurement did, which only a fixed grid guarantees. The
 * description takes what is left of the content column.
 */
export const table_columns = { qty: 64, unit_price: 96, amount: 112 } as const
export const description_width = content_width - table_columns.qty - table_columns.unit_price - table_columns.amount
/** A row that carries a thumbnail: 56 px of image plus 8 px of padding above and below. */
export const photo_row_height = 72
