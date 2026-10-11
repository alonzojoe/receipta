const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

/** Formats an amount as Philippine pesos: 1234.5 -> "₱1,234.50". */
export function format_currency(amount: number) {
  return peso.format(amount)
}
