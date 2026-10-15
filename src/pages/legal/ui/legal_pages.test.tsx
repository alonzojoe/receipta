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
import { draft_storage_key } from '@/shared/config/draft_storage_key'
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

  it('lists the receipt draft in the cookie table, under the key the code writes', async () => {
    const { container } = render_at('/cookies')
    await screen.findByRole('heading', { level: 1 })

    const table = container.querySelector('table') as HTMLElement
    expect(within(table).getByText(draft_storage_key)).toBeInTheDocument()
    expect(stored_items.map((item) => item.key)).toEqual(
      expect.arrayContaining([theme_storage_key, draft_storage_key]),
    )
    expect(table.querySelectorAll('tbody tr')).toHaveLength(2)
  })

  describe('the stored-data claims stay true now that a draft is saved', () => {
    // Each of these was published before the receipt draft existed and is false now.
    const retired_claims = [
      /your receipts are not saved/i,
      /a single preference/i,
      /that is the complete list/i,
      /not written to local storage/i,
      /nothing about your receipts is written/i,
      /closing the tab discards/i,
      /discarded when you close the tab/i,
      /held in your browser.s memory while the page is open/i,
    ]

    it.each(['/privacy', '/cookies'])('%s makes none of the retired claims', async (path) => {
      const { container } = render_at(path)
      await screen.findByRole('heading', { level: 1 })
      const text = container.querySelector('main')?.textContent ?? ''

      expect(text.length).toBeGreaterThan(500)
      for (const claim of retired_claims) {
        expect(text).not.toMatch(claim)
      }
    })

    it.each(['/privacy', '/cookies'])('%s discloses the saved draft and Clear draft', async (path) => {
      const { container } = render_at(path)
      await screen.findByRole('heading', { level: 1 })
      const text = container.querySelector('main')?.textContent ?? ''

      expect(text).toMatch(/receipt draft/i)
      expect(text).toMatch(/clear draft/i)
      expect(text).toMatch(/photos/i)
    })

    it.each([
      { path: '/privacy', heading: /removing your data/i },
      { path: '/cookies', heading: /clearing it/i },
    ])('$path tells the reader how to remove the draft in the section about removal', async ({ path, heading }) => {
      render_at(path)
      const section = (await screen.findByRole('heading', { name: heading })).closest('section')

      expect(section?.textContent).toMatch(/clear draft/i)
    })

    it('the privacy page says the draft is unencrypted and never sent anywhere', async () => {
      render_at('/privacy')
      await screen.findByRole('heading', { level: 1 })
      const text = document.querySelector('main')?.textContent ?? ''

      expect(text).toMatch(/not encrypted/i)
      expect(text).toMatch(/never sent to us or anyone else/i)
    })
  })

  it.each(pages)('leaves no placeholder links on $path', async ({ path }) => {
    const { container } = render_at(path)
    await screen.findByRole('heading', { level: 1 })

    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0)
  })
})
