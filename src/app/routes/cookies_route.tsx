import { createRoute } from '@tanstack/react-router'

import { CookiePage } from '@/pages/legal'

import { root_route } from './root_route'

export const cookies_route = createRoute({
  getParentRoute: () => root_route,
  path: '/cookies',
  component: CookiePage,
})
