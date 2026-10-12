import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { footer_links } from '@/shared/config/site'

import { SiteFooter } from './site_footer'

/** The footer navigates with router Links, so it needs a router around it. */
function render_footer() {
  const root = createRootRoute({ component: SiteFooter })
  const index = createRoute({ getParentRoute: () => root, path: '/', component: () => null })

  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(<RouterProvider router={router as never} />)
}

describe('SiteFooter', () => {
  it('follows the app theme instead of forcing its own', async () => {
    const { container } = render_footer()
    await screen.findByText(/all rights reserved/i)

    // It was previously pinned dark in both themes, which made the theme switch look
    // broken in light mode.
    expect(container.querySelector('footer')).not.toHaveClass('dark')
  })

  it('still credits the author with a safe external link', async () => {
    const { container } = render_footer()
    await screen.findByText(/all rights reserved/i)

    const link = container.querySelector('a[target="_blank"]')

    expect(link).toHaveAttribute('href', 'https://github.com/alonzojoe')
    expect(link?.getAttribute('rel')).toContain('noopener')
  })

  it('links every legal page, with no placeholders left', async () => {
    const { container } = render_footer()
    await screen.findByText(/all rights reserved/i)

    for (const link of footer_links) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.href,
      )
      expect(link.href).not.toBe('#')
    }

    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0)
  })
})
