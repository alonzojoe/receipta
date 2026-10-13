import { describe, expect, it } from 'vitest'

import raw from './institutions.json'

/*
 * Enumerated through Vite rather than node:fs, so the app's tsconfig does not have to
 * pull in Node types just for this check. The keys are the file paths; the modules
 * themselves are never loaded.
 */
const icon_modules = import.meta.glob('../../../public/institutions/*.png')
import {
  find_institution,
  institution_categories,
  institutions,
  institutions_by_category,
  institutions_updated,
} from './institutions'

const categories = institution_categories.map((category) => category.value)

describe('institutions dataset', () => {
  it('declares the country and an updated date', () => {
    expect(raw.country).toBe('PH')
    expect(institutions_updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('gives every entry the required fields', () => {
    for (const item of institutions) {
      expect(item.id, 'id').toBeTruthy()
      expect(item.name, `${item.id} name`).toBeTruthy()
      expect(item.institutionType, `${item.id} institutionType`).toBeTruthy()
      expect(categories, `${item.id} category`).toContain(item.category)
    }
  })

  it('keeps ids unique and url-safe', () => {
    const ids = institutions.map((item) => item.id)

    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('uses trading names, not registered legal names', () => {
    for (const item of institutions) {
      expect(item.name, item.id).not.toMatch(/\b(Inc|Incorporated|Corporation|Co)\.?$/)
    }
  })

  /*
   * The point of the whole icon pipeline. The Privacy Policy promises no third-party
   * requests; an icon pointing at a favicon service would make that false and would
   * tell someone else which institutions a visitor was shown.
   */
  it('serves every icon from this app, never a third party', () => {
    for (const item of institutions) {
      expect(item.icon, item.id).toMatch(/^\/institutions\//)
      expect(item.icon, item.id).not.toMatch(/^https?:/)
    }
  })

  it('ships an image for every entry, and no orphans', () => {
    const files = new Set(
      Object.keys(icon_modules).map((path) => path.split('/').pop() as string),
    )

    for (const item of institutions) {
      expect(files.has(`${item.id}.png`), `missing icon for ${item.id}`).toBe(true)
    }

    expect(files.size, 'an image with no dataset entry').toBe(institutions.length)
  })

  it('covers every category', () => {
    const present = new Set(institutions.map((item) => item.category))

    for (const category of categories) {
      expect(present.has(category), category).toBe(true)
    }
  })

  it('includes all seven BSP-licensed digital banks', () => {
    const digital = institutions
      .filter((item) => item.category === 'digital_bank')
      .map((item) => item.id)

    expect(digital).toHaveLength(7)
    for (const id of [
      'gotyme',
      'maya-bank',
      'maribank',
      'ofbank',
      'tonik',
      'uniondigital',
      'unobank',
    ]) {
      expect(digital, id).toContain(id)
    }
  })

  it('includes the banks people are actually paid into', () => {
    const ids = institutions.map((item) => item.id)

    for (const id of ['bdo', 'bpi', 'metrobank', 'landbank', 'gcash', 'maya']) {
      expect(ids, id).toContain(id)
    }
  })

  it('finds an institution by id, and nothing by a made-up one', () => {
    expect(find_institution('gcash')?.name).toBe('GCash')
    expect(find_institution('not-a-bank')).toBeUndefined()
  })

  it('groups for a picker without losing or duplicating an entry', () => {
    const grouped = institutions_by_category()
    const total = grouped.reduce((sum, group) => sum + group.items.length, 0)

    expect(grouped).toHaveLength(institution_categories.length)
    expect(total).toBe(institutions.length)
  })
})
