export type ExportKind = 'pdf' | 'png'

const unsafe = /[^a-z0-9]+/g
const fallback_stem = 'receipt'
const max_name_length = 40

function two(value: number) {
  return String(value).padStart(2, '0')
}

/**
 * `MMDDYYYYHHMMSS` in the device's local time, which is what the author asked for. It is the
 * moment of export, not the receipt's own date: two exports of the same receipt get
 * different names rather than one silently replacing the other in a downloads folder.
 */
function stamp(now: Date) {
  return [
    two(now.getMonth() + 1),
    two(now.getDate()),
    now.getFullYear(),
    two(now.getHours()),
    two(now.getMinutes()),
    two(now.getSeconds()),
  ].join('')
}

/**
 * The recipient's name as one snake_case word: `Juan Dela Cruz` becomes `juan_dela_cruz`.
 *
 * Everything outside a-z and 0-9 becomes a separator, so no dot, slash, space or non-ASCII
 * character can reach a path. A name written entirely in a non-Latin script therefore
 * reduces to nothing, which is why the caller falls back rather than trusting this to
 * return something usable.
 */
function snake(name: string) {
  return name
    .toLowerCase()
    .replace(unsafe, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, max_name_length)
    .replace(/_+$/, '')
}

/**
 * `juan_dela_cruz_receipt_10272026102045.pdf`.
 *
 * Named for the recipient, on the author's instruction. Note this is a deliberate reversal:
 * the first version took the Receipt No. and nothing else, so that a party's name could not
 * reach a filename by construction. The file is saved to the user's own device and they
 * asked for it to be recognisable there, which is a fair trade - but a receipt sent on is a
 * file whose name now carries a customer's name, and that is the thing that changed.
 */
export function build_export_filename(recipient: string, kind: ExportKind, now: Date) {
  const name = snake(recipient)
  const stem = name === '' ? fallback_stem : `${name}_${fallback_stem}`
  return `${stem}_${stamp(now)}.${kind}`
}
