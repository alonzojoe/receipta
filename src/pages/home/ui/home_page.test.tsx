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
import { institutions } from '@/shared/config/institutions'
import { site } from '@/shared/config/site'
import hero_css from '@/widgets/home_hero/ui/hero_receipt.css?raw'

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

  /**
   * The hero shows the REAL document now, from the real view model, rather than a card
   * that resembled one. The card had already drifted - a `PAID` chip the receipt does not
   * have, no receipt number, no payment method, no statement - and that gap only widens as
   * the document changes. This asserts the things only the real one has.
   */
  it('shows the real receipt in the hero, not a mock of one', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    // Money through the real formatter: 2 x 450 + 650, less a 100 discount.
    expect(screen.getByText('₱1,550.00')).toBeInTheDocument()
    expect(screen.getByText('-₱100.00')).toBeInTheDocument()
    // Twice: the Total and the Amount paid row below it, which is what the real document
    // does and the mock did not.
    expect(screen.getAllByText('₱1,450.00')).toHaveLength(2)

    // Only the real document carries these.
    expect(screen.getByText('REF-20261027-104530')).toBeInTheDocument()
    expect(screen.getByText(/Discount \(/)).toHaveTextContent('regular client')
    expect(screen.getByText('This is a proof of payment.')).toBeInTheDocument()
    expect(screen.queryByText('PAID')).toBeNull()
  })

  /**
   * The document's footer carries two real links. `aria-hidden` hides them from a screen
   * reader but leaves them tabbable, so a keyboard user would land on links they cannot
   * see, inside a frame clipped at 420px - focusing one scrolls the clipped sheet and
   * shifts it. `inert` is what removes them from both.
   */
  it('puts nothing focusable inside the decorative hero receipt', async () => {
    const { container } = render_home()
    await screen.findByRole('heading', { level: 1 })

    const sheet = container.querySelector('.hero-receipt') as HTMLElement
    expect(sheet).toHaveAttribute('aria-hidden', 'true')
    expect(sheet).toHaveAttribute('inert')

    // It does contain links - that is why inert is needed rather than optional.
    expect(sheet.querySelectorAll('a').length).toBeGreaterThan(0)
  })

  /**
   * The sheet is white in both themes on purpose: the document carries fixed colours so an
   * export from dark mode is identical to one from light. A theme token reaching it would
   * break that silently, and the only symptom would be a dark receipt in a downloaded PDF.
   */
  it('keeps the hero sheet on the receipt palette, never the app theme', async () => {
    const { container } = render_home()
    await screen.findByRole('heading', { level: 1 })

    const sheet = container.querySelector('.hero-receipt') as HTMLElement
    expect(sheet.querySelector('.receipt')).not.toBeNull()
    // The fade over the cut edge must be paper-coloured, or it paints a grey band across
    // white paper in dark mode.
    expect(hero_css).toMatch(/var\(--receipt-paper\)/)
    expect(hero_css).not.toMatch(/var\(--(background|card|foreground|muted|border)\)/)
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

  it('exposes the institutions as one list, without the loop duplicate', async () => {
    render_home()
    await screen.findByRole('heading', { level: 1 })

    const strip = screen.getByText('Works with how you already get paid').parentElement
    const list = within(strip as HTMLElement).getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(institutions.length)
    expect(institutions).toHaveLength(31)
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
