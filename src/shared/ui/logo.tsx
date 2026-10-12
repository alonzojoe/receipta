import logo_mark_src from '@/shared/assets/logo_mark.png'
import { site } from '@/shared/config/site'
import { cn } from '@/shared/lib/utils'

type LogoProps = {
  className?: string
}

/**
 * The Receipta mark, from the brand artwork.
 *
 * This is a raster rather than inline SVG on purpose: the mark carries a gradient
 * squircle, a curled paper edge and a check badge, and a hand-written SVG would be an
 * approximation of it rather than the thing itself. It is served at 256px for a ~32px
 * slot, which covers ordinary and retina displays.
 *
 * It does not inherit currentColor and does not change between light and dark. A brand
 * mark has one set of colours, the same way the receipt preview does.
 *
 * Intrinsic width and height are set so the header does not shift while it loads, and
 * it loads eagerly because it sits above the fold.
 */
export function LogoMark({ className }: LogoProps) {
  return (
    <img
      src={logo_mark_src}
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      loading="eager"
      decoding="async"
      className={cn('size-8 shrink-0', className)}
    />
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
      {site.name}
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
