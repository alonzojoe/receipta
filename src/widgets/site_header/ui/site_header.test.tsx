import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { create_route } from '@/app/routes/create_route'
import { home_route } from '@/app/routes/home_route'
import { root_route } from '@/app/routes/root_route'

function render_home() {
  const router = createRouter({
    routeTree: root_route.addChildren([home_route, create_route]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(<RouterProvider router={router as never} />)
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
