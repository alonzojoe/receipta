import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type RevealProps = {
  children: ReactNode
  /** Stagger offset in ms. Keep between 30 and 80 for adjacent items. */
  delay?: number
  className?: string
}

function prefers_reduced_motion() {
  // matchMedia is missing in some test and server environments; treat its absence as
  // "no preference" rather than letting the render throw.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function read_motion_state() {
  const reduced = prefers_reduced_motion()

  return {
    reduced,
    // Reduced motion shows immediately. So does a missing IntersectionObserver:
    // without it there is no way to detect visibility, and hiding the content
    // forever is far worse than skipping the animation.
    immediate: reduced || typeof IntersectionObserver === 'undefined',
  }
}

/**
 * Fades content up as it scrolls into view, once. The page is seen a handful of
 * times, so an entrance is justified; it never replays, because a reveal that
 * re-fires on scroll-back reads as a glitch.
 *
 * Only opacity and transform animate. Under reduced motion the translate is dropped
 * and the fade kept: the fade still signals arrival without moving anything.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [motion] = useState(read_motion_state)
  const [shown, set_shown] = useState(motion.immediate)

  useEffect(() => {
    if (motion.immediate) return

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        set_shown(true)
        observer.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [motion.immediate])

  return (
    <div
      ref={ref}
      data-shown={shown}
      style={{ transitionDelay: shown && !motion.reduced ? `${delay}ms` : undefined }}
      className={cn(
        'transition-[opacity,transform] duration-[400ms] ease-out',
        shown ? 'opacity-100' : 'opacity-0',
        !motion.reduced && !shown && 'translate-y-2',
        className,
      )}
    >
      {children}
    </div>
  )
}
