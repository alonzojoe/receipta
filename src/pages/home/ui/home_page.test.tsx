import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { create_route } from '@/app/routes/create_route'
import { home_route } from '@/app/routes/home_route'
import { root_route } from '@/app/routes/root_route'
import { site } from '@/shared/config/site'

function render_home() {
  const router = createRouter({
    routeTree: root_route.addChildren([home_route, create_route]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(<RouterProvider router={router as never} />)
}

describe('HomePage', () => {
  it('renders every section heading in order', async () => {
    const { container } = render_home()
    await screen.findByRole('heading', { level: 1 })

    const headings = [...container.querySelectorAll('h1, h2')].map((node) =>
      node.textContent?.trim(),
    )

    expect(headings).toEqual([
      'Send receipts, not screenshots.',
      'Three steps, about a minute',
      'Why Receipta',
      'Your receipts never leave your device',
      'Your next receipt takes about a minute',
    ])
  })

  it('formats the mock receipt amounts as pesos', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    expect(screen.getByText('₱1,125.00')).toBeInTheDocument()
    expect(screen.getByText('₱750.00')).toBeInTheDocument()
  })

  it('names every payment mode', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    for (const label of ['GCash', 'Maya', 'MariBank', 'Bank Transfer']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('renders six feature cards', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    const why = screen.getByRole('heading', { name: 'Why Receipta' })
    const section = why.closest('section')
    expect(section).not.toBeNull()
    expect(within(section as HTMLElement).getAllByRole('listitem')).toHaveLength(6)
  })

  it('links both CTAs to the builder', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    const ctas = screen.getAllByRole('link', { name: /create a receipt/i })
    expect(ctas.length).toBe(2)
    for (const cta of ctas) expect(cta).toHaveAttribute('href', '/create')
  })

  it('credits the author with a safe external GitHub link', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    const link = screen.getByRole('link', { name: new RegExp(site.author.name, 'i') })

    expect(link).toHaveAttribute('href', 'https://github.com/alonzojoe')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('renders Privacy and Terms as deliberate placeholders', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    for (const label of ['Privacy Policy', 'Terms & Conditions']) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', '#')
    }
  })
})
