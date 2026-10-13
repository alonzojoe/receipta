import logo_mark_src from '@/shared/assets/logo_mark.png'
import wordmark_dark_src from '@/shared/assets/wordmark_dark.png'
import wordmark_light_src from '@/shared/assets/wordmark_light.png'
import { site } from '@/shared/config/site'
import { cn } from '@/shared/lib/utils'

type LogoProps = {
  className?: string
}

/**
 * The Receipta mark: a paper plane whose tail is a torn receipt.
 *
 * A raster rather than inline SVG, because the mark is supplied as artwork and a
 * hand-written SVG would be an approximation of it rather than the thing itself. Served
 * at 256px for a ~32px slot, which covers ordinary and retina displays.
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
 */
export function LogoWordmark({ className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src={wordmark_light_src}
        alt=""
        aria-hidden="true"
        width={563}
        height={128}
        decoding="async"
        className="h-5 w-auto dark:hidden"
      />
      <img
        src={wordmark_dark_src}
        alt=""
        aria-hidden="true"
        width={549}
        height={128}
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
