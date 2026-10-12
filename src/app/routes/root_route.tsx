import { createRootRoute } from '@tanstack/react-router'

import { NotFound } from '../ui/not_found'
import { RootLayout } from '../ui/root_layout'

export const root_route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})
