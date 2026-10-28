import { MotionConfig } from 'motion/react'
import { HeadContent, Outlet } from '@tanstack/react-router'
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
      {/* Writes each route's own title, description, canonical and Open Graph tags. Before
          this every route shipped index.html's single title, so /create and the three
          legal pages were indistinguishable in a search result, a tab and a bookmark. */}
      <HeadContent />
      <Outlet />
      <Toaster position="bottom-center" />
    </MotionConfig>
  )
}
