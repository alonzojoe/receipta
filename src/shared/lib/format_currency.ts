const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

/** Formats an amount as Philippine pesos: 1234.5 -> "₱1,234.50". */
export function format_currency(amount: number) {
  return peso.format(amount)
}

/**
 * Formats an integer number of centavos: 123450 -> "₱1,234.50". Money is carried as
 * integers everywhere else, so this is the single place centavos meet the formatter.
 * Still the one `Intl.NumberFormat`.
 */
export function format_centavos(centavos: number) {
  return format_currency(centavos / 100)
}
