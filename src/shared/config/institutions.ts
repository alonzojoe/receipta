import data from './institutions.json'

export type InstitutionCategory = 'ewallet' | 'digital_bank' | 'local_bank'

export type Institution = {
  id: string
  name: string
  category: InstitutionCategory
  /**
   * The regulatory classification, which is finer-grained than `category`. Today it maps
   * 1:1 onto `category`, so it looks redundant. It is kept because it stops being
   * redundant the moment thrift or rural banks are added: they would share the
   * `local_bank` category but not the type. `institutions.test.ts` pins the current 1:1
   * mapping so that change is a deliberate decision, not drift.
   */
  institutionType: string
  icon: string
}

/**
 * Philippine banks, digital banks and e-wallets, for the payment-method picker.
 *
 * Sourced from the Bangko Sentral ng Pilipinas: its Peso RTGS participant list for the
 * counts and classifications, and its FCDU/EFCDU directory for the universal and
 * commercial bank names. Rural, cooperative and thrift banks are deliberately absent -
 * BSP licenses hundreds, and this audience is not paid through them.
 *
 * Icons are served from this app, never from a favicon service. The Privacy Policy
 * states that Receipta makes no third-party requests, and a picker that quietly calls
 * out would both break that promise and reveal to a third party how someone gets paid.
 * `scripts/fetch_institution_icons.mjs` fetches them once, by hand.
 *
 * `updated` is on the dataset because this goes stale: banks merge, digital banks are
 * licensed, wallets close.
 */
// This cast asserts the shape, it does not check it: the JSON infers `category` as
// `string`, so a bad category would still compile. The runtime checks in
// `institutions.test.ts` are what enforce it - do not delete them on the strength of the
// annotation.
export const institutions: readonly Institution[] = data.institutions as Institution[]

export const institutions_updated = data.updated

export const institution_categories: readonly {
  value: InstitutionCategory
  label: string
}[] = [
  { value: 'ewallet', label: 'E-wallets' },
  { value: 'digital_bank', label: 'Digital banks' },
  { value: 'local_bank', label: 'Banks' },
]

const by_id = new Map(institutions.map((item) => [item.id, item]))

/** Looks up an institution by the id stored on a receipt. */
export function find_institution(id: string) {
  return by_id.get(id)
}

/** Groups the list for a picker, in the order defined by `institution_categories`. */
export function institutions_by_category() {
  return institution_categories.map((category) => ({
    ...category,
    items: institutions.filter((item) => item.category === category.value),
  }))
}
