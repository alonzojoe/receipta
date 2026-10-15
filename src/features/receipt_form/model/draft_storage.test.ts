import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { draft_max_chars } from '@/entities/receipt'
import { draft_storage_key } from '@/shared/config/draft_storage_key'
import { make_item, make_valid_values, tiny_jpeg } from '@/test/receipt_fixtures'

import { draft_version, parse_draft, type Draft } from './draft_schema'
import { clear_draft, read_draft, write_draft } from './draft_storage'

function make_draft(step = 2, with_photos = true): Draft {
  return {
    version: draft_version,
    step,
    values: make_valid_values({
      items: [
        make_item({ id: 'a', image: with_photos ? tiny_jpeg : null }),
        make_item({ id: 'b', name: 'Second', image: with_photos ? tiny_jpeg : null }),
      ],
    }),
  }
}

function quota_error() {
  return new DOMException('The quota has been exceeded.', 'QuotaExceededError')
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('the storage key', () => {
  it('is exactly receipta:draft:v1', () => {
    expect(draft_storage_key).toBe('receipta:draft:v1')
  })

  it('is the key write_draft uses', () => {
    write_draft(make_draft())
    expect(window.localStorage.getItem('receipta:draft:v1')).not.toBeNull()
  })
})

describe('write_draft', () => {
  it('saves the full draft', () => {
    const draft = make_draft()
    expect(write_draft(draft)).toBe('saved')
    expect(window.localStorage.getItem(draft_storage_key)).toBe(JSON.stringify(draft))
  })

  it('on a quota error retries once without photos and reports it', () => {
    const before = JSON.stringify(make_draft(1))
    window.localStorage.setItem(draft_storage_key, before)

    const real = Storage.prototype.setItem
    const stored_at_retry: (string | null)[] = []
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw quota_error()
      })
      .mockImplementation(function (this: Storage, key: string, value: string) {
        // What is stored the moment the retry begins: the failed write left it alone.
        stored_at_retry.push(this.getItem(key))
        real.call(this, key, value)
      })

    const result = write_draft(make_draft(3))

    expect(result).toBe('saved_without_photos')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(stored_at_retry).toEqual([before])
    const retried = JSON.parse(spy.mock.calls[1][1] as string) as Draft
    expect(retried.values.items.every((item) => item.image === null)).toBe(true)
    expect(retried.step).toBe(3)
    expect(retried.values.items.map((item) => item.name)).toEqual(['Logo design', 'Second'])
  })

  it('when the retry also fails, leaves the stored string byte-identical', () => {
    const before = JSON.stringify(make_draft(1))
    window.localStorage.setItem(draft_storage_key, before)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota_error()
    })

    expect(write_draft(make_draft(3))).toBe('not_saved')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(window.localStorage.getItem(draft_storage_key)).toBe(before)
  })

  it('recovers: once storage works again the next write is saved', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota_error()
    })
    expect(write_draft(make_draft())).toBe('not_saved')
    spy.mockRestore()
    expect(write_draft(make_draft())).toBe('saved')
  })

  it('treats a setItem that silently does nothing as a failed write', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
    expect(write_draft(make_draft())).toBe('not_saved')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(window.localStorage.getItem(draft_storage_key)).toBeNull()
  })

  it('reports not_saved, without a pointless retry, when a draft with no photos fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota_error()
    })
    expect(write_draft(make_draft(2, false))).toBe('not_saved')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('goes straight to the photo-free write when the draft is over the 2,000,000 guard', () => {
    const huge = `data:image/jpeg;base64,${'A'.repeat(900_000)}`
    const draft: Draft = {
      version: draft_version,
      step: 2,
      values: make_valid_values({
        items: [
          make_item({ id: 'a', image: huge }),
          make_item({ id: 'b', image: huge }),
          make_item({ id: 'c', image: huge }),
        ],
      }),
    }
    expect(JSON.stringify(draft).length).toBeGreaterThan(draft_max_chars)

    const spy = vi.spyOn(Storage.prototype, 'setItem')
    expect(write_draft(draft)).toBe('saved_without_photos')
    expect(spy).toHaveBeenCalledTimes(1)
    const written = parse_draft(spy.mock.calls[0][1] as string)
    expect(written.ok && written.draft.values.items.every((item) => item.image === null)).toBe(
      true,
    )
  })

  it('never removes or clears anything while writing', () => {
    window.localStorage.setItem(draft_storage_key, JSON.stringify(make_draft(1)))
    const remove = vi.spyOn(Storage.prototype, 'removeItem')
    const clear = vi.spyOn(Storage.prototype, 'clear')

    write_draft(make_draft())
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota_error()
    })
    write_draft(make_draft())

    expect(remove).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
  })

  it('does not throw and reports not_saved when reaching localStorage throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(() => write_draft(make_draft())).not.toThrow()
    expect(write_draft(make_draft())).toBe('not_saved')
  })
})

describe('read_draft', () => {
  it('reports none when nothing is saved', () => {
    expect(read_draft()).toEqual({ status: 'none' })
  })

  it('reads back what write_draft saved', () => {
    const draft = make_draft()
    write_draft(draft)
    expect(read_draft()).toEqual({ status: 'ok', draft })
  })

  it('reports corrupt, wrong-version and invalid-shape drafts as unreadable, never throwing', () => {
    const cases: [string, string][] = [
      ['{broken', 'corrupt'],
      [JSON.stringify({ ...make_draft(), version: 2 }), 'wrong_version'],
      [JSON.stringify({ ...make_draft(), version: 7 }), 'wrong_version'],
      [JSON.stringify({ version: 1, step: 1, values: { issuer_name: 1 } }), 'invalid_shape'],
    ]
    for (const [text, reason] of cases) {
      window.localStorage.setItem(draft_storage_key, text)
      expect(read_draft()).toEqual({ status: 'unreadable', reason })
    }
  })

  it('does not throw when reaching localStorage throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(() => read_draft()).not.toThrow()
    expect(read_draft()).toEqual({ status: 'none' })
  })

  it('does not throw when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(read_draft()).toEqual({ status: 'none' })
  })

  it('does not write anything itself', () => {
    const set = vi.spyOn(Storage.prototype, 'setItem')
    read_draft()
    expect(set).not.toHaveBeenCalled()
  })
})

describe('clear_draft', () => {
  it('removes the key', () => {
    write_draft(make_draft())
    expect(clear_draft()).toBe(true)
    expect(window.localStorage.getItem(draft_storage_key)).toBeNull()
  })

  it('does not throw when storage is unreachable', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(clear_draft()).toBe(false)
  })
})
