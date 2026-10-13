import { useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type MarqueeProps = {
  children: ReactNode
  /**
   * Seconds for one full pass. Derive it from the item count rather than fixing it, or
   * the strip speeds up every time an item is added.
   */
  duration_seconds: number
  className?: string
}

/**
 * A strip of content that scrolls continuously and loops.
 *
 * Not a carousel: nothing is current, nothing is clickable, and it never settles on a
 * position. That is why it needs no state.
 *
 * The content is rendered twice. The first copy is the real one; the second exists only
 * so the loop has somewhere to go, and is hidden from assistive technology - otherwise a
 * screen reader reads the whole list twice.
 *
 * Under reduced motion it does not animate at all. The content wraps into a static,
 * centred row instead. A strip that moves forever is not decoration that can be dialled
 * back, so the preference is honoured by stopping it, not slowing it.
 */
export function Marquee({ children, duration_seconds, className }: MarqueeProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <div className={cn('flex flex-wrap items-center justify-center gap-4', className)}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden',
        // Items enter and leave rather than being sliced off at a hard edge.
        '[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]',
        className,
      )}
    >
      <div
        style={{ animationDuration: `${duration_seconds}s` }}
        className={cn(
          // No gap between the two copies. A flex gap here sits BETWEEN them and is not
          // counted by translateX(-50%), so the strip lands half a gap short and jumps
          // by that much once per loop. Each copy carries its own trailing space
          // instead, so the two tile exactly.
          'flex w-max items-center',
          'animate-[marquee_linear_infinite]',
          // Pause so someone who spots their bank can actually look at it. Gated behind
          // a hover-capable pointer, or a tap leaves a touch device stuck paused.
          '[@media(hover:hover)]:group-hover:[animation-play-state:paused]',
        )}
      >
        <div className="flex shrink-0 items-center gap-4 pr-4">{children}</div>
        <div aria-hidden="true" className="flex shrink-0 items-center gap-4 pr-4">
          {children}
        </div>
      </div>
    </div>
  )
}
