import { Link } from '@tanstack/react-router'
import { FaGithub } from 'react-icons/fa6'

import { footer_links, site } from '@/shared/config/site'
import { Logo } from '@/shared/ui/logo'

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground">
              {site.description}
            </p>
          </div>

          <nav aria-label="Legal" className="flex flex-col gap-3 sm:items-end">
            <h2 className="text-sm font-medium text-foreground">Legal</h2>
            {footer_links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>

          <a
            href={site.author.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
          >
            <FaGithub className="size-4" aria-hidden="true" />
            <span>Built by {site.author.name}</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
