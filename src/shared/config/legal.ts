import { draft_storage_key } from '@/shared/config/draft_storage_key'
import { site } from '@/shared/config/site'
import { theme_storage_key } from '@/shared/config/theme'

/**
 * One date for all three legal pages, so they cannot drift apart. Update it whenever
 * any of them changes in substance.
 */
export const legal_last_updated = '15 October 2026'

export const legal_contact_url = site.repository_url

export type StoredItem = {
  key: string
  purpose: string
  values: string
  duration: string
}

/**
 * Everything Receipta keeps on the visitor's device.
 *
 * The Cookie Policy renders its table from this rather than restating it in prose. If a
 * feature adds a stored value and does not add it here, the published page becomes
 * wrong - which is the point of keeping it as data.
 */
export const stored_items: readonly StoredItem[] = [
  {
    key: theme_storage_key,
    purpose: 'Remembers whether you chose light, dark, or to follow your device.',
    values: '"system", "light", or "dark"',
    duration: 'Until you clear your browser data.',
  },
  {
    key: draft_storage_key,
    purpose:
      'Keeps the receipt you are working on, so it is still there if you close the tab or the page reloads.',
    values:
      'Everything on the form: names, item details, amounts, discount, payment method and reference, notes, the date, and any attached photos as shrunken images. It is plain text on your device, not encrypted.',
    duration:
      'Until you use Clear draft on the form or clear your browser data. It does not expire on its own.',
  },
]
