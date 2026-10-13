import { site } from '@/shared/config/site'
import { theme_storage_key } from '@/shared/config/theme'

/**
 * One date for all three legal pages, so they cannot drift apart. Update it whenever
 * any of them changes in substance.
 */
export const legal_last_updated = '12 October 2026'

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
]
