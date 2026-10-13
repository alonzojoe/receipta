import { Link } from '@tanstack/react-router'

import { ThemeSwitcher } from '@/features/theme_switcher'
import { nav_links, site } from '@/shared/config/site'
import { cn } from '@/shared/lib/utils'
import { useScrolledPast } from '@/shared/lib/use_scrolled_past'
import { Button } from '@/shared/ui/button'
import { Logo } from '@/shared/ui/logo'

export function SiteHeader() {
  const { sentinel_ref, scrolled } = useScrolledPast()

  return (
    <>
      {/* Sentinel. See useScrolledPast: this is what replaces a scroll listener. */}
      <div ref={sentinel_ref} aria-hidden="true" className="h-px w-full" />

      <header
        data-scrolled={scrolled}
        className={cn(
          'sticky top-0 z-50 w-full border-b transition-[background-color,border-color,backdrop-filter,box-shadow] duration-200 ease-out',
          // At rest the header sits on the hero as one surface. It only earns its
          // border and blur once there is content behind it to separate from.
          scrolled
            ? 'border-border/70 bg-background/80 shadow-sm backdrop-blur-md'
            : 'border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" aria-label={`${site.name} home`}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav_links.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                className="h-auto px-3 py-2"
                asChild
              >
                <a href={link.href}>{link.label}</a>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <Button className="h-auto px-4 py-2" asChild>
              <Link to="/create">Create receipt</Link>
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}
