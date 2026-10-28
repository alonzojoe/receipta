import { createRoute } from '@tanstack/react-router'

import { head_for } from '@/shared/config/page_meta'

import { CookiePage } from '@/pages/legal'

import { root_route } from './root_route'

export const cookies_route = createRoute({
  getParentRoute: () => root_route,
  path: '/cookies',
  component: CookiePage,
  head: () => head_for('/cookies'),
})
