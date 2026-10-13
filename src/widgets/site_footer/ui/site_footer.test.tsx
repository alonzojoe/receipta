import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { footer_links, site } from '@/shared/config/site'

import { SiteFooter } from './site_footer'

/** The footer navigates with router Links, so it needs a router around it. */
function render_footer() {
  const root = createRootRoute({ component: SiteFooter })
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => null,
  })

  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(<RouterProvider router={router as never} />)
}

async function settled() {
  return screen.findByText(/all rights reserved/i)
}

describe('SiteFooter', () => {
  it('follows the app theme instead of forcing its own', async () => {
    const { container } = render_footer()
    await settled()

    expect(container.querySelector('footer')).not.toHaveClass('dark')
  })

  it('links the product name to the repository, not a personal profile', async () => {
    render_footer()
    await settled()

    const link = screen.getByRole('link', { name: /receipta on github/i })

    expect(link).toHaveAttribute('href', site.repository_url)
    expect(link.textContent).toContain(site.name)
    expect(site.repository_url).toMatch(/\/receipta$/)
  })

  it('opens the repository link safely in a new tab', async () => {
    render_footer()
    await settled()

    const link = screen.getByRole('link', { name: /receipta on github/i })

    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('no longer credits an individual', async () => {
    const { container } = render_footer()
    await settled()

    expect(container.textContent).not.toMatch(/built by/i)
  })

  it('puts the legal links in a named nav, with no section heading', async () => {
    const { container } = render_footer()
    await settled()

    const nav = screen.getByRole('navigation', { name: /legal/i })
    expect(nav).toBeInTheDocument()

    // The stacked column's "Legal" heading is gone; a row of three does not need one.
    expect(container.querySelectorAll('footer h2')).toHaveLength(0)
  })

  it('links every legal page, with no placeholders left', async () => {
    const { container } = render_footer()
    await settled()

    const nav = screen.getByRole('navigation', { name: /legal/i })

    for (const link of footer_links) {
      expect(
        within(nav).getByRole('link', { name: link.label }),
      ).toHaveAttribute('href', link.href)
      expect(link.href).not.toBe('#')
    }

    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0)
  })

  it('hides the separators from assistive technology', async () => {
    const { container } = render_footer()
    await settled()

    const separators = [...container.querySelectorAll('span')].filter((node) =>
      node.textContent?.trim() === '·',
    )

    expect(separators.length).toBeGreaterThan(0)
    for (const separator of separators) {
      expect(separator).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
