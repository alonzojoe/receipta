import { cn } from '@/shared/lib/utils'

type LogoProps = {
  className?: string
}

/**
 * The Receipta mark: a rounded square holding a receipt with a torn zigzag bottom
 * edge.
 *
 * The geometry is tuned for 16px. An earlier version used four shallow teeth and
 * three thin rules; at favicon size the teeth fell below a pixel and the rules merged
 * into a smudge. Three deep teeth and two thick rules are what survive - verified by
 * rasterising at 16px, not by assumption.
 *
 * Drawn with currentColor so it inherits text colour and themes for free. The caller
 * sizes it - icons are the one place fixed dimensions are permitted.
 *
 * public/favicon.svg carries the same geometry but adds a vertical gradient and
 * hardcodes the brand violet, because a favicon cannot inherit a theme. This
 * component stays a flat currentColor fill: at nav and footer size the gradient is
 * invisible, and a flat fill is what keeps it themeable.
 */
export function LogoMark({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      className={cn('size-8 text-primary', className)}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      {/*
        The receipt. A single filled path: body, then a four-tooth zigzag tear across
        the bottom. Drawn in the square's foreground colour so it reads as a cutout.
      */}
      <path
        d="M7.5 6.8A2.5 2.5 0 0 1 10 4.3h12A2.5 2.5 0 0 1 24.5 6.8v18.5l-2.83 3.2-2.84-3.2-2.83 3.2-2.84-3.2-2.83 3.2-2.84-3.2V6.8Z"
        fill="var(--primary-foreground)"
      />
      {/* One full line and one short line. Two is the most that stays separable at 16px. */}
      <path
        d="M11.25 12h9.5M11.25 16.75h6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LogoWordmark({ className }: LogoProps) {
  return (
    <span
      className={cn(
        'text-lg font-semibold tracking-tight text-foreground',
        className,
      )}
    >
      Receipta
    </span>
  )
}

/** Mark plus wordmark, for the nav and footer. */
export function Logo({ className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <LogoWordmark />
    </span>
  )
}
