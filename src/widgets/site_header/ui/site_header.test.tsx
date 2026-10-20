import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { create_route } from '@/app/routes/create_route'
import { home_route } from '@/app/routes/home_route'
import { root_route } from '@/app/routes/root_route'

function render_at(path: string) {
  const router = createRouter({
    routeTree: root_route.addChildren([home_route, create_route]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  return render(<RouterProvider router={router as never} />)
}

function render_home() {
  return render_at('/')
}

describe('SiteHeader', () => {
  it('attaches no scroll listener to the window', async () => {
    const add_listener = vi.spyOn(window, 'addEventListener')

    render_home()
    await screen.findByRole('heading', { level: 1 })

    const scroll_listeners = add_listener.mock.calls.filter(
      ([event]) => event === 'scroll',
    )

    expect(scroll_listeners).toHaveLength(0)
    add_listener.mockRestore()
  })

  it('exposes a scrolled state the styles can hang off', async () => {
    const { container } = render_home()
    await screen.findByRole('heading', { level: 1 })

    await waitFor(() => {
      expect(container.querySelector('header')).toHaveAttribute('data-scrolled')
    })
  })

  /**
   * The bug this replaces: the section links were bare fragments, `#faq` and the rest. A
   * fragment resolves against whatever route the header is on, and the header is on every
   * route - so on /create they pointed at /create#faq, where no such section exists, and
   * clicking them did nothing at all. Every page but the home page was affected, and no
   * test noticed because the only test rendered the home page, where a fragment happens
   * to work.
   */
  it.each([
    ['the home page', '/'],
    ['the builder', '/create'],
  ])('points the section links at the home page from %s', async (_name, path) => {
    const { container } = render_at(path)
    await waitFor(() => expect(container.querySelector('header nav')).toBeInTheDocument())

    // Scoped to the header's own nav: "How it works" also appears in the hero, and the
    // point here is what the HEADER does on a route that is not the home page.
    const nav = within(container.querySelector('header nav') as HTMLElement)

    for (const [label, hash] of [
      ['How it works', 'how-it-works'],
      ['Why Receipta', 'why-receipta'],
      ['FAQ', 'faq'],
    ]) {
      // `/#faq`, never a bare `#faq`: the second is what broke.
      expect(nav.getByRole('link', { name: label })).toHaveAttribute('href', `/#${hash}`)
    }
  })

  it('links the logo home and the cta to the builder', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    expect(screen.getByRole('link', { name: /receipta home/i })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Create receipt' })).toHaveAttribute(
      'href',
      '/create',
    )
  })
})
