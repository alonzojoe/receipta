import { createRoute } from '@tanstack/react-router'

import { head_for } from '@/shared/config/page_meta'

import { CreatePage } from '@/pages/create'

import { root_route } from './root_route'

export const create_route = createRoute({
  getParentRoute: () => root_route,
  path: '/create',
  component: CreatePage,
  head: () => head_for('/create'),
})
