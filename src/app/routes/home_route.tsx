import { createRoute } from '@tanstack/react-router'

import { app_structured_data, head_for } from '@/shared/config/page_meta'

import { HomePage } from '@/pages/home'

import { root_route } from './root_route'

export const home_route = createRoute({
  getParentRoute: () => root_route,
  path: '/',
  component: HomePage,
  head: () => ({
    ...head_for('/'),
    // The home page only. `scripts` is how TanStack Router emits a tag into the head;
    // this is data, not code, so there is nothing for the CSP to block.
    scripts: [
      { type: 'application/ld+json', children: JSON.stringify(app_structured_data()) },
    ],
  }),
})
