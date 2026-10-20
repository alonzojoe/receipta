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
export const footer_wordmark_height = 16
/** The Receipta mark beside the footer wordmark. Taller than the wordmark on purpose: a
 *  compact shape next to lowercase text reads smaller than it measures. */
export const footer_mark_size = 20
/**
 * The item table's numeric columns, sized in characters of the body font (CSS `ch`, the advance
 * of "0"), not in pixels. The widest value each column can hold is knowable from the form's
 * limits, so each column is sized from that string - but by its real WIDTH, not its character
 * count, which is what `widest_chars` below computes.
 *
 * Counting characters was the first version and it was far too generous: `\u20b19,999,998,900.00`
 * is 17 characters but only about 14.2ch wide, because a comma and a point are each under a
 * third of a digit. Those 3 wasted characters came out of the description column, which is the
 * one that has to hold an item name beside a thumbnail.
 *
 * A figure is never allowed to wrap (`white-space: nowrap`), so a column that is too narrow
 * would overflow rather than split a number. The page clips at its edge, so an overflow is
 * visible rather than silent - but the margin below means it cannot happen at the form's limits.
 *
 * Fractional, not rounded up to whole characters: rounding each column to an integer `ch`
 * wasted most of what measuring the glyphs recovered.
 *
 * `type_scale.test.ts` builds the worst-case strings FROM `limits.ts` and fails if a limit
 * grows past its column. Rows are separate grids, so a fixed column is also what keeps them
 * aligned, and every page of a PDF must wrap a name exactly as the measurement did.
 */
const glyph_chars = { digit: 1.035, peso: 1.06, separator: 0.32 } as const

/**
 * The width of `text` in `ch`, from the advances of the shipped Geist files. "0" is the widest
 * digit (0.663em at 400, 0.683 at 600, so a bold digit is 1.03ch of the 400-weight grid the
 * columns are declared on); a comma or point is 0.201em, under a third of that; the peso sign
 * is a little over one. Each weight is rounded up from the measured value, so the result is an
 * upper bound rather than an estimate.
 */
export function widest_chars(text: string) {
  let total = 0
  for (const character of text) {
    if (character >= '0' && character <= '9') total += glyph_chars.digit
    else if (character === '\u20b1') total += glyph_chars.peso
    else total += glyph_chars.separator
  }
  return total
}

export const table_column_chars = { qty: 7.9, unit_price: 10.0, amount: 14.8 } as const
/** Left padding of a numeric cell, in px: the gap between one column's figure and the last. */
export const numeric_cell_padding = 12
/**
 * What a `ch` is worth in px, as an upper bound. Read from the shipped Geist files rather
 * than assumed: "0" is 0.663em at weight 400 and 0.683em at 600, so 0.70 is above every
 * weight the document uses. The earlier 0.65 was called an upper bound and was below the
 * real 400-weight value, which made the description's floor about 4px too generous.
 */
export const ch_px_upper_bound = type_scale.body * 0.7
/** The description column's width at its narrowest: the content column less the three numeric ones. */
export const description_width_floor =
  content_width -
  Object.values(table_column_chars).reduce((sum, chars) => sum + Math.ceil(chars * ch_px_upper_bound) + numeric_cell_padding, 0)
/** A row that carries a thumbnail: 56 px of image plus 8 px of padding above and below. */
export const photo_row_height = 72
