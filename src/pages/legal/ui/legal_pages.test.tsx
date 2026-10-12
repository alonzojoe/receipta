import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { cookies_route } from '@/app/routes/cookies_route'
import { create_route } from '@/app/routes/create_route'
import { home_route } from '@/app/routes/home_route'
import { privacy_route } from '@/app/routes/privacy_route'
import { root_route } from '@/app/routes/root_route'
import { terms_route } from '@/app/routes/terms_route'
import { legal_last_updated, stored_items } from '@/shared/config/legal'
import { theme_storage_key } from '@/shared/config/theme'

function render_at(path: string) {
  const router = createRouter({
    routeTree: root_route.addChildren([
      home_route,
      create_route,
      privacy_route,
      terms_route,
      cookies_route,
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  return render(<RouterProvider router={router as never} />)
}

const pages = [
  { path: '/privacy', heading: /privacy policy/i },
  { path: '/terms', heading: /terms & conditions/i },
  { path: '/cookies', heading: /cookie policy/i },
]

describe('legal pages', () => {
  it.each(pages)('renders $path with a single h1', async ({ path, heading }) => {
    const { container } = render_at(path)

    expect(
      await screen.findByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })

  it.each(pages)('shows the shared last-updated date on $path', async ({ path }) => {
    render_at(path)

    expect(
      await screen.findByText(new RegExp(legal_last_updated, 'i')),
    ).toBeInTheDocument()
  })

  it.each(pages)('keeps $path navigable with header and footer', async ({ path }) => {
    const { container } = render_at(path)
    await screen.findByRole('heading', { level: 1 })

    expect(container.querySelector('header')).toBeInTheDocument()
    expect(container.querySelector('footer')).toBeInTheDocument()
  })

  it.each(pages)('does not skip heading levels on $path', async ({ path }) => {
    const { container } = render_at(path)
    await screen.findByRole('heading', { level: 1 })

    const main = container.querySelector('main')
    const levels = [...(main?.querySelectorAll('h1,h2,h3,h4') ?? [])].map((node) =>
      Number(node.tagName[1]),
    )

    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
  })

  it('states plainly in the terms that this is not a BIR official receipt', async () => {
    render_at('/terms')
    await screen.findByRole('heading', { level: 1 })

    expect(screen.getByText(/not a BIR Official Receipt/i)).toBeInTheDocument()
  })

  it('states plainly in the cookie policy that no cookies are set', async () => {
    render_at('/cookies')

    expect(
      await screen.findByRole('heading', { name: /sets no cookies/i }),
    ).toBeInTheDocument()
  })

  it('renders the cookie table from the storage inventory', async () => {
    const { container } = render_at('/cookies')
    await screen.findByRole('heading', { level: 1 })

    const table = container.querySelector('table')
    expect(table).not.toBeNull()

    for (const item of stored_items) {
      expect(within(table as HTMLElement).getByText(item.key)).toBeInTheDocument()
    }
    // One row per stored item, so the page cannot silently omit one.
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(stored_items.length)
  })

  it('keeps the inventory honest about the theme key the app actually writes', () => {
    expect(stored_items.map((item) => item.key)).toContain(theme_storage_key)
  })

  it.each(pages)('leaves no placeholder links on $path', async ({ path }) => {
    const { container } = render_at(path)
    await screen.findByRole('heading', { level: 1 })

    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0)
  })
})
