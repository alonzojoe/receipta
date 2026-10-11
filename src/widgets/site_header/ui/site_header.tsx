import { Link } from '@tanstack/react-router'

import { nav_links, site } from '@/shared/config/site'
import { Button } from '@/shared/ui/button'
import { Logo } from '@/shared/ui/logo'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label={`${site.name} home`}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav_links.map((link) => (
            <Button key={link.href} variant="ghost" className="h-auto px-3 py-2" asChild>
              <a href={link.href}>{link.label}</a>
            </Button>
          ))}
        </nav>

        <Button className="h-auto px-4 py-2" asChild>
          <Link to="/create">Create receipt</Link>
        </Button>
      </div>
    </header>
  )
}
