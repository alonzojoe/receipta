import { useReducedMotion } from 'motion/react'
import { Children, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type MarqueeProps = {
  /**
   * The items to scroll. Each child becomes one `<li>`; do not pass `<li>` yourself.
   *
   * Children are mounted TWICE (a real copy and an aria-hidden copy for the loop), so
   * they must be pure and stateless, and must NOT carry an `id`, a `name`, or anything
   * else that has to be unique in the document. Do not put state, effects, or anything
   * focusable in them either: the duplicate would hold its own copy, and a focusable
   * item in a moving track is a trap.
   */
  children: ReactNode
  /**
   * Seconds for one full pass. Derive it from the item count rather than fixing it, or
   * the strip speeds up every time an item is added. If it is not a finite number above
   * zero, or there are no children, the strip renders statically instead of as a broken
   * 0s animation.
   */
  duration_seconds: number
  className?: string
}

type MarqueeListProps = {
  items: ReactNode[]
  /** The loop copy. Hidden from assistive technology so nothing is read twice. */
  hidden?: boolean
  className?: string
}

/*
 * The one place an item is wrapped. Both the animated and the static branch render
 * through it, so they cannot drift apart in markup or semantics.
 *
 * role="list" is explicit because Safari/VoiceOver stops announcing a `ul` as a list once
 * list-style is removed, which Tailwind's preflight does.
 */
function MarqueeList({ items, hidden = false, className }: MarqueeListProps) {
  return (
    <ul
      role="list"
      aria-hidden={hidden || undefined}
      className={cn('flex items-center gap-4', className)}
    >
      {items.map((item, index) => (
        <li key={index} className="shrink-0">
          {item}
        </li>
      ))}
    </ul>
  )
}

/**
 * A strip of content that scrolls continuously and loops.
 *
 * Not a carousel: nothing is current, nothing is clickable, and it never settles on a
 * position. That is why it needs no state.
 *
 * The content is rendered twice. The first copy is the real list; the second exists only
 * so the loop has somewhere to go, and is aria-hidden - otherwise a screen reader reads
 * the whole list twice. See `children` for what that means for what you may pass in.
 *
 * It does not animate under reduced motion, or when `duration_seconds` is unusable or
 * there is nothing to show. The content wraps into a static, centred row instead. A strip
 * that moves forever is not decoration that can be dialled back, so the preference is
 * honoured by stopping it, not slowing it.
 */
export function Marquee({ children, duration_seconds, className }: MarqueeProps) {
  const reduced = useReducedMotion()
  const items = Children.toArray(children)

  const can_animate = Number.isFinite(duration_seconds) && duration_seconds > 0 && items.length > 0

  if (reduced || !can_animate) {
    return (
      <MarqueeList
        items={items}
        className={cn('flex-wrap justify-center', className)}
      />
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
        <MarqueeList items={items} className="shrink-0 pr-4" />
        <MarqueeList items={items} hidden className="shrink-0 pr-4" />
      </div>
    </div>
  )
}
