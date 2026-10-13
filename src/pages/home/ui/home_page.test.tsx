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

    // Scoped to <main>: the footer now carries its own "Legal" heading, which is not
    // part of the page's section order.
    const main = container.querySelector('main')
    const headings = [...(main?.querySelectorAll('h1, h2') ?? [])].map((node) =>
      node.textContent?.trim(),
    )

    expect(headings).toEqual([
      'Send receipts, not screenshots.',
      'Three steps, about a minute',
      'Why Receipta',
      'Your receipts never leave your device',
      'Questions, answered',
      'Your next receipt takes about a minute',
    ])
  })

  it('formats the mock receipt amounts as pesos', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    expect(screen.getByText('₱1,125.00')).toBeInTheDocument()
    expect(screen.getByText('₱750.00')).toBeInTheDocument()
  })

  it('shows the institutions people are paid through', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    // The marquee renders its content twice so the loop is seamless, so each name
    // appears more than once in the DOM. The duplicate is aria-hidden; see the marquee
    // tests for that.
    for (const name of ['GCash', 'Maya', 'MariBank', 'BDO Unibank', 'Landbank']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
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

  it('links the repository from the footer, safely', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    const link = screen.getByRole('link', { name: /receipta on github/i })

    expect(link).toHaveAttribute('href', site.repository_url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('links the legal pages from the footer', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    const expected = {
      'Privacy Policy': '/privacy',
      'Terms & Conditions': '/terms',
      'Cookie Policy': '/cookies',
    }

    for (const [label, href] of Object.entries(expected)) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
  })

  it('leaves no placeholder links anywhere on the page', async () => {
    const { container } = render_home()
    await screen.findByRole('heading', { level: 1 })

    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0)
  })
})
