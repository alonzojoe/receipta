import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'
import { FaGithub } from 'react-icons/fa6'

import { footer_links, site } from '@/shared/config/site'
import { Logo } from '@/shared/ui/logo'

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">{site.description}</p>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <a
              href={site.repository_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${site.name} on GitHub`}
              className="inline-flex items-center gap-2 transition-colors duration-150 ease-out hover:text-foreground"
            >
              <FaGithub className="size-4" aria-hidden="true" />
              <span>{site.name}</span>
            </a>
            {/*
              Hidden below sm for the same reason as the legal separators: the line
              wraps at narrow widths and a trailing dot reads as a typo.
            */}
            <span aria-hidden="true" className="hidden sm:inline">
              &middot;
            </span>
            <span>
              &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
            </span>
          </p>

          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
          >
            {footer_links.map((link, index) => (
              <Fragment key={link.label}>
                {/*
                  Decorative separator. Rendered as an element rather than ::before
                  content so it can be hidden from assistive technology - otherwise a
                  screen reader announces "Privacy Policy dot Terms" - and so it can be
                  dropped once the row wraps, where a trailing dot reads as a typo.
                */}
                {index > 0 ? (
                  <span aria-hidden="true" className="hidden text-muted-foreground sm:inline">
                    &middot;
                  </span>
                ) : null}
                <Link
                  to={link.href}
                  className="text-muted-foreground underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground hover:underline"
                >
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
