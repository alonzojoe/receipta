import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { theme_storage_key } from '@/shared/config/theme'

// Imported through Vite rather than node:fs, so the app's tsconfig does not have to
// pull in Node types just for one assertion.
import index_html from '../../../index.html?raw'

import { useTheme } from './use_theme'

type Listener = (event: MediaQueryListEvent) => void

/** A matchMedia stub whose value can be changed, so the system path is testable. */
function stub_media(prefers_dark: boolean) {
  const listeners = new Set<Listener>()
  let matches = prefers_dark

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return matches
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

  return {
    listener_count: () => listeners.size,
    change(to_dark: boolean) {
      matches = to_dark
      for (const listener of listeners) {
        listener({ matches: to_dark } as MediaQueryListEvent)
      }
    },
  }
}

const is_dark = () => document.documentElement.classList.contains('dark')

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useTheme', () => {
  it('defaults to the device theme when nothing is stored', async () => {
    stub_media(true)
    const { result } = renderHook(() => useTheme())

    await waitFor(() => expect(result.current.theme).toBe('system'))
    await waitFor(() => expect(result.current.resolved_theme).toBe('dark'))
    expect(is_dark()).toBe(true)
  })

  it('lets a stored choice win over the device preference', async () => {
    localStorage.setItem(theme_storage_key, JSON.stringify('dark'))
    stub_media(false)

    const { result } = renderHook(() => useTheme())

    await waitFor(() => expect(result.current.resolved_theme).toBe('dark'))
    expect(is_dark()).toBe(true)
  })

  it('applies light by removing the dark class', async () => {
    stub_media(true)
    const { result } = renderHook(() => useTheme())
    await waitFor(() => expect(is_dark()).toBe(true))

    act(() => result.current.set_theme('light'))

    await waitFor(() => expect(is_dark()).toBe(false))
  })

  it('applies dark by adding the dark class', async () => {
    stub_media(false)
    const { result } = renderHook(() => useTheme())
    await waitFor(() => expect(is_dark()).toBe(false))

    act(() => result.current.set_theme('dark'))

    await waitFor(() => expect(is_dark()).toBe(true))
  })

  it('follows a live device change while set to system', async () => {
    const media = stub_media(false)
    const { result } = renderHook(() => useTheme())
    await waitFor(() => expect(result.current.resolved_theme).toBe('light'))

    act(() => media.change(true))

    await waitFor(() => expect(result.current.resolved_theme).toBe('dark'))
    expect(is_dark()).toBe(true)
  })

  it('ignores a device change once a theme is pinned', async () => {
    const media = stub_media(false)
    const { result } = renderHook(() => useTheme())
    act(() => result.current.set_theme('light'))
    await waitFor(() => expect(result.current.resolved_theme).toBe('light'))

    act(() => media.change(true))

    expect(result.current.resolved_theme).toBe('light')
    expect(is_dark()).toBe(false)
  })

  it('unsubscribes from the media query on unmount', async () => {
    const media = stub_media(false)
    const { unmount } = renderHook(() => useTheme())
    await waitFor(() => expect(media.listener_count()).toBe(1))

    unmount()

    expect(media.listener_count()).toBe(0)
  })

  it('persists the choice to local storage', async () => {
    stub_media(false)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.set_theme('dark'))

    await waitFor(() =>
      expect(localStorage.getItem(theme_storage_key)).toBe(JSON.stringify('dark')),
    )
  })

  it('falls back to the device theme when storage throws', async () => {
    stub_media(true)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    const { result } = renderHook(() => useTheme())

    await waitFor(() => expect(result.current.resolved_theme).toBe('dark'))
  })
})

describe('no-flash script', () => {
  it('uses the same storage key as the app', () => {
    expect(index_html).toContain(`localStorage.getItem('${theme_storage_key}')`)
  })

  it('runs before the app module so the theme is set before first paint', () => {
    expect(index_html.indexOf(theme_storage_key)).toBeLessThan(
      index_html.indexOf('/src/main.tsx'),
    )
  })
})
