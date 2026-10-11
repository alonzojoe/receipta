import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type SectionProps = {
  id?: string
  children: ReactNode
  className?: string
  /** Inner wrapper classes, for sections that need a narrower measure. */
  innerClassName?: string
}

/**
 * Owns horizontal gutters, content width, and vertical rhythm so no widget
 * reinvents page padding. The gutter never collapses to zero, which is what keeps
 * the page from touching the screen edge at 320px.
 */
export function Section({ id, children, className, innerClassName }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'w-full px-4 py-16 sm:px-6 sm:py-20',
        // Anchor targets must clear the sticky header, or the heading lands behind it.
        id && 'scroll-mt-16',
        className,
      )}
    >
      <div className={cn('mx-auto w-full max-w-5xl', innerClassName)}>{children}</div>
    </section>
  )
}
