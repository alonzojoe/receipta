import logo_mark_src from '@/shared/assets/logo_mark.webp'
import wordmark_dark_src from '@/shared/assets/wordmark_dark.webp'
import wordmark_light_src from '@/shared/assets/wordmark_light.webp'
import { site } from '@/shared/config/site'
import { cn } from '@/shared/lib/utils'

type LogoProps = {
  className?: string
}

/**
 * The Receipta mark: a paper plane whose tail is a torn receipt.
 *
 * A raster rather than inline SVG, because the mark is supplied as a lossy JPEG and a
 * hand-written SVG would be an approximation of it rather than the thing itself. Served
 * at 256px for a ~32px slot, which covers ordinary and retina displays.
 *
 * WebP, not PNG: 34% smaller here, and the browser support question does not arise for
 * an image we render ourselves. The icons in public/ stay PNG, because favicons and
 * apple-touch-icon are read by browsers and operating systems whose WebP support is not
 * dependable.
 *
 * It does not inherit currentColor and does not change between themes. A brand mark has
 * one set of colours.
 */
export function LogoMark({ className }: LogoProps) {
  return (
    <img
      src={logo_mark_src}
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      decoding="async"
      className={cn('size-8 shrink-0', className)}
    />
  )
}

/**
 * The wordmark, cut from the brand sheet rather than set in a typeface.
 *
 * The sheet supplies it for light and dark separately - near-black and near-white, both
 * with the violet dot on the "i" - so both ship and CSS picks one. The hidden one is
 * `display: none`, so a screen reader never reaches it.
 *
 * Both images are decorative and the name is carried by visually hidden text. That way
 * the accessible name is exactly "Receipta" once, whichever theme is showing, rather
 * than depending on which image happens to be visible.
 *
 * Both download on any load, since CSS decides which to show. They are exported at 48px
 * tall for a 20px slot - enough for retina, where 128px was four times more than needed
 * and cost about 60KB that was never displayed.
 */
export function LogoWordmark({ className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src={wordmark_light_src}
        alt=""
        aria-hidden="true"
        width={211}
        height={48}
        loading="lazy"
        decoding="async"
        className="h-5 w-auto dark:hidden"
      />
      <img
        src={wordmark_dark_src}
        alt=""
        aria-hidden="true"
        width={206}
        height={48}
        loading="lazy"
        decoding="async"
        className="hidden h-5 w-auto dark:block"
      />
      <span className="sr-only">{site.name}</span>
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
