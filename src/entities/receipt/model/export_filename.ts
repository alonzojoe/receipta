export type ExportKind = 'pdf' | 'png'

const unsafe = /[^A-Za-z0-9-]/g
const fallback_stem = 'receipt'
const max_stem_length = 60

/**
 * `receipta-REF-20261016-154212.pdf`.
 *
 * It takes the Receipt No. and nothing else, so a party name cannot reach a filename by
 * construction. The number is the form's own, but a hand-edited draft can hold anything,
 * so everything outside letters, digits and hyphen is dropped: no separator, dot, space or
 * non-ASCII character can survive into a path.
 */
export function build_export_filename(receipt_no: string, kind: ExportKind) {
  const cleaned = receipt_no.replace(unsafe, '').replace(/^-+|-+$/g, '').slice(0, max_stem_length)
  return `receipta-${cleaned === '' ? fallback_stem : cleaned}.${kind}`
}
