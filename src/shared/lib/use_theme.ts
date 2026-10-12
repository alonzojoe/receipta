import { useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'

import {
  dark_media_query,
  theme_storage_key,
  type ResolvedTheme,
  type Theme,
} from '@/shared/config/theme'

function read_system_theme(): ResolvedTheme {
  // matchMedia is missing in some test and server environments. Treat its absence as
  // light rather than letting the hook throw.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia(dark_media_query).matches ? 'dark' : 'light'
}

/**
 * The selected theme, the theme actually showing, and a setter.
 *
 * `system` is not a stored colour, it is a subscription: while it is selected the page
 * follows the device live, so changing the OS theme in another window updates this tab
 * without a reload.
 *
 * The file is snake_case per the project rule; the hook is camelCase because
 * react-hooks/rules-of-hooks only recognises `use` followed by an uppercase letter.
 */
export function useTheme() {
  const [theme, set_theme] = useLocalStorage<Theme>(theme_storage_key, 'system', {
    initializeWithValue: false,
  })
  const [system_theme, set_system_theme] = useState<ResolvedTheme>(read_system_theme)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const query = window.matchMedia(dark_media_query)
    const on_change = (event: MediaQueryListEvent) => {
      set_system_theme(event.matches ? 'dark' : 'light')
    }

    query.addEventListener('change', on_change)
    return () => query.removeEventListener('change', on_change)
  }, [])

  const resolved_theme: ResolvedTheme = theme === 'system' ? system_theme : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved_theme === 'dark')
  }, [resolved_theme])

  return { theme, resolved_theme, set_theme }
}
