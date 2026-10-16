import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { download_blob, revoke_delay_ms } from './download_blob'

describe('download_blob', () => {
  const create = vi.fn(() => 'blob:fake')
  const revoke = vi.fn()
  let clicked: HTMLAnchorElement | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    URL.createObjectURL = create
    URL.revokeObjectURL = revoke
    clicked = undefined
    // Records the anchor at click time, from the DOM, so the test sees it while it is attached.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      clicked = document.querySelector('a') as HTMLAnchorElement
      expect(clicked).not.toBeNull()
      expect(revoke).not.toHaveBeenCalled()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    create.mockClear()
    revoke.mockClear()
  })

  it('clicks an anchor whose download is the filename and whose href is the object URL', () => {
    const blob = new Blob(['x'])
    download_blob(blob, 'receipta-REF-1.pdf')
    expect(create).toHaveBeenCalledWith(blob)
    expect(clicked?.download).toBe('receipta-REF-1.pdf')
    expect(clicked?.getAttribute('href')).toBe('blob:fake')
  })

  it('removes the anchor, and revokes the URL only after the click, not before', () => {
    download_blob(new Blob(['x']), 'a.png')
    expect(document.body.contains(clicked as Node)).toBe(false)
    expect(revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(revoke_delay_ms)
    expect(revoke).toHaveBeenCalledWith('blob:fake')
  })

  it('still removes the anchor and revokes if the click throws', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => download_blob(new Blob(['x']), 'a.png')).toThrow('blocked')
    expect(document.querySelector('a')).toBeNull()
    vi.advanceTimersByTime(revoke_delay_ms)
    expect(revoke).toHaveBeenCalled()
  })
})
