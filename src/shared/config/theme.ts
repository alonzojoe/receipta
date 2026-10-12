import type { IconType } from 'react-icons'
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu'

export type Theme = 'system' | 'light' | 'dark'

/** The theme the page actually renders. `system` always resolves to one of these. */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Duplicated as a literal in the no-flash script in index.html, which cannot import
 * from the bundle. A test asserts the two match, so they cannot drift silently.
 */
export const theme_storage_key = 'receipta-theme'

export const dark_media_query = '(prefers-color-scheme: dark)'

export type ThemeOption = {
  value: Theme
  label: string
  icon: IconType
}

/** The menu renders from this, so the three options exist in exactly one place. */
export const theme_options: readonly ThemeOption[] = [
  { value: 'light', label: 'Light', icon: LuSun },
  { value: 'dark', label: 'Dark', icon: LuMoon },
  { value: 'system', label: 'System', icon: LuMonitor },
]
