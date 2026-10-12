import { createRoute } from '@tanstack/react-router'

import { TermsPage } from '@/pages/legal'

import { root_route } from './root_route'

export const terms_route = createRoute({
  getParentRoute: () => root_route,
  path: '/terms',
  component: TermsPage,
})
