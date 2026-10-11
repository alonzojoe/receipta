import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'

/**
 * App shell. Holds the outlet and the single Toaster instance, so any feature can
 * call toast() without wiring its own provider.
 */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="bottom-center" />
    </>
  )
}
