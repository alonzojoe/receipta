import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { LuArrowLeft } from 'react-icons/lu'

import { legal_last_updated } from '@/shared/config/legal'
import { Section } from '@/shared/ui/section'

type LegalDocumentProps = {
  title: string
  summary: string
  children: ReactNode
}

/**
 * Shared shell for the legal pages.
 *
 * It owns the measure, the rhythm and the heading styles so the three documents cannot
 * drift apart typographically, and so the last-updated date comes from one place.
 *
 * Two different widths, on purpose. The outer container is the same max-w-5xl every
 * other page uses, so the title and the back link line up with the logo in the navbar
 * above them. The body is then held to max-w-prose inside it, because legal text set
 * to the full container width is a wall nobody reads.
 */
export function LegalDocument({ title, summary, children }: LegalDocumentProps) {
  return (
    <Section className="pt-10 sm:pt-14">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
      >
        <LuArrowLeft aria-hidden="true" className="size-4" />
        Back to home
      </Link>

      <header className="mt-8 flex flex-col gap-3 border-b border-border pb-8">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-balance text-muted-foreground">{summary}</p>
        <p className="text-sm text-muted-foreground">
          Last updated {legal_last_updated}
        </p>
      </header>

      <div
        className={[
          'mt-8 flex max-w-prose flex-col gap-8',
          '[&_h2]:text-xl [&_h2]:font-medium [&_h2]:tracking-tight',
          '[&_h3]:text-base [&_h3]:font-medium',
          '[&_p]:text-muted-foreground',
          '[&_li]:text-muted-foreground',
          '[&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5',
          '[&_li]:list-disc',
          '[&_section]:flex [&_section]:flex-col [&_section]:gap-3',
          '[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline',
        ].join(' ')}
      >
        {children}
      </div>
    </Section>
  )
}
