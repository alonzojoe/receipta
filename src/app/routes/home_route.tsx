import { createRoute } from '@tanstack/react-router'

import { app_structured_data, head_for } from '@/shared/config/page_meta'

import { HomePage } from '@/pages/home'

import { root_route } from './root_route'

export const home_route = createRoute({
  getParentRoute: () => root_route,
  path: '/',
  component: HomePage,
  head: () => {
    const head = head_for('/')
    return {
      ...head,
      // The home page only, and through the router's own `script:ld+json` meta key rather
      // than a raw script with children: that path escapes the JSON, so a future value
      // containing `</script>` cannot break out of the tag. Every value is a constant
      // today, which is exactly when this is cheap to get right.
      //
      // The CSP does not block it: script-src governs executable scripts, and an ld+json
      // block is inert data.
      meta: [...head.meta, { 'script:ld+json': app_structured_data() }],
    }
  },
})
