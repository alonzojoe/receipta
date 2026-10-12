import { MotionConfig } from 'motion/react'
import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'

/**
 * App shell. Holds the outlet and the single Toaster instance, so any feature can
 * call toast() without wiring its own provider.
 */
export function RootLayout() {
  return (
    // reducedMotion="user" makes every motion component in the tree honour the OS
    // preference by default, so a new animation cannot silently forget to.
    <MotionConfig reducedMotion="user">
      <Outlet />
      <Toaster position="bottom-center" />
    </MotionConfig>
  )
}
