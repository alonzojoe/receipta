import { createRoute } from '@tanstack/react-router'

import { CreatePlaceholderPage } from '@/pages/create'

import { root_route } from './root_route'

export const create_route = createRoute({
  getParentRoute: () => root_route,
  path: '/create',
  component: CreatePlaceholderPage,
})
