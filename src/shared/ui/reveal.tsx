import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Stagger offset in ms. Keep between 30 and 80 for adjacent items. */
  delay?: number
  className?: string
}

/**
 * Fades content up as it scrolls into view, once.
 *
 * `once: true` is the whole point: a reveal that re-fires when you scroll back up
 * reads as a glitch rather than as polish.
 *
 * The animated value is a full `transform` string rather than Framer's `y` shorthand.
 * The shorthand is driven on the main thread through requestAnimationFrame, so it
 * drops frames exactly when the page is busiest - during load, which is when a
 * scroll reveal runs. The string form is hardware accelerated.
 *
 * Under reduced motion the translate is dropped and the fade is kept. The fade still
 * signals arrival without moving anything, which is the point of the preference, not
 * removing all feedback.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        transform: reduced ? 'translateY(0px)' : 'translateY(12px)',
      }}
      whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{
        duration: reduced ? 0.2 : 0.45,
        // The custom ease-out from index.css. The built-in curves are too weak to
        // feel deliberate, and ease-in is never used: it delays the first frame.
        ease: [0.23, 1, 0.32, 1],
        delay: reduced ? 0 : delay / 1000,
      }}
    >
      {children}
    </motion.div>
  )
}
