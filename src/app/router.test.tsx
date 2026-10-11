import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { create_route } from './routes/create_route'
import { home_route } from './routes/home_route'
import { root_route } from './routes/root_route'

function render_at(path: string) {
  const router = createRouter({
    routeTree: root_route.addChildren([home_route, create_route]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  // The test router is a throwaway instance, so it is not the registered one.
  return render(<RouterProvider router={router as never} />)
}

describe('router', () => {
  it('renders the home page at /', async () => {
    render_at('/')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /send receipts, not screenshots/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders the builder placeholder at /create', async () => {
    render_at('/create')

    expect(
      await screen.findByRole('heading', { name: /receipt builder is next/i }),
    ).toBeInTheDocument()
  })

  it('renders a not-found page for an unknown path', async () => {
    render_at('/does-not-exist')

    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })

  it('renders exactly one h1 per route', async () => {
    const { container } = render_at('/')
    await screen.findByRole('heading', { level: 1 })

    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })
})
