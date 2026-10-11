import '@testing-library/jest-dom/vitest'

import { vi } from 'vitest'

// jsdom does not implement scrollTo, and the router's scroll restoration calls it.
window.scrollTo = vi.fn()

// jsdom implements neither matchMedia nor IntersectionObserver. Both are used by the
// scroll reveal, so without these stubs every page render throws.
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly scrollMargin: string = ''
  readonly thresholds: readonly number[] = []
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  // Report every observed element as visible, so revealed content is assertable.
  observe(target: Element) {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this)
  }

  unobserve() {}
  disconnect() {}

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

window.IntersectionObserver = IntersectionObserverStub
