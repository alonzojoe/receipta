import { createRoute } from '@tanstack/react-router'

import { HomePage } from '@/pages/home'

import { root_route } from './root_route'

export const home_route = createRoute({
  getParentRoute: () => root_route,
  path: '/',
  component: HomePage,
})
