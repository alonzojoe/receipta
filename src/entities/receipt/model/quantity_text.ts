/**
 * `9999.999` -> `9,999.999`. A quantity tops out at 9,999.999, so there is at most one
 * separator; the grouping is on the digits of the whole part and the fraction is left alone.
 * Takes the text `format_thousandths` produced, so it never sees a float.
 */
export function group_quantity(plain: string) {
  const [whole, fraction] = plain.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}
