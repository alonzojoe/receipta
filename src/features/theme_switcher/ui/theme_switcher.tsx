import { LuCheck } from 'react-icons/lu'

import { theme_options } from '@/shared/config/theme'
import { useTheme } from '@/shared/lib/use_theme'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown_menu'

/**
 * Theme switcher for the navbar.
 *
 * The trigger is icon-only so it fits beside the call to action at every width, and it
 * shows the icon of the active choice rather than a fixed glyph, so the current state
 * is readable without opening the menu.
 *
 * The switch itself is not animated. Cross-fading every colour on the page is
 * expensive and draws attention to a change the user just asked for.
 */
export function ThemeSwitcher() {
  const { theme, set_theme } = useTheme()

  const active = theme_options.find((option) => option.value === theme)
  const ActiveIcon = active?.icon ?? theme_options[0].icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-auto p-2"
          aria-label={`Theme: ${active?.label ?? 'System'}. Change theme`}
        >
          <ActiveIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-40">
        {theme_options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => set_theme(option.value)}
            aria-current={option.value === theme}
            className="justify-between gap-3"
          >
            <span className="inline-flex items-center gap-2">
              <option.icon aria-hidden="true" />
              {option.label}
            </span>
            {option.value === theme ? (
              <LuCheck aria-hidden="true" className="text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
