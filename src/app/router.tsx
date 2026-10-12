import { createRouter } from '@tanstack/react-router'

import { cookies_route } from './routes/cookies_route'
import { create_route } from './routes/create_route'
import { home_route } from './routes/home_route'
import { privacy_route } from './routes/privacy_route'
import { root_route } from './routes/root_route'
import { terms_route } from './routes/terms_route'

/*
 * Code-based routes rather than file-based: no extra plugin, no generated route
 * tree, and the definitions sit naturally in the app layer instead of a routes/
 * directory that competes with the FSD structure. Revisit past roughly ten routes.
 */
const route_tree = root_route.addChildren([
  home_route,
  create_route,
  privacy_route,
  terms_route,
  cookies_route,
])

export const router = createRouter({
  routeTree: route_tree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

/*
 * Module augmentation for type-safe links and params. This must be an `interface`:
 * TypeScript cannot augment a type alias, so the project's prefer-types rule does
 * not apply here.
 */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
