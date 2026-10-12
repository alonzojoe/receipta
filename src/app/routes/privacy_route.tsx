import { createRoute } from '@tanstack/react-router'

import { PrivacyPage } from '@/pages/legal'

import { root_route } from './root_route'

export const privacy_route = createRoute({
  getParentRoute: () => root_route,
  path: '/privacy',
  component: PrivacyPage,
})
