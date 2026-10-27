/**
 * Single source of truth for every string that appears more than once, or that a
 * human might want to change without reading JSX.
 */

export type NavLink = {
  label: string
  href: string
}

/**
 * A link to a section of the home page. It carries the element id, not `#id`, because it
 * is rendered as a route link to `/` with that hash - a bare `#id` resolves against
 * whatever route the header happens to be on, so on /create it pointed at /create#faq and
 * did nothing. The header is on every route, so that was every page but the home page.
 */
export type SectionLink = {
  label: string
  hash: string
}

export const site = {
  name: 'Receipta',
  /**
   * Where the app lives. The receipt's footer links here, so someone handed a receipt can
   * find the thing that made it. Defined once: it appears in markup, in a test that pins
   * the footer's href, and nowhere else.
   */
  url: 'https://receipta-app.netlify.app',
  tagline: 'Send receipts, not screenshots.',
  description:
    'Turn a GCash, Maya, MariBank, or bank transfer payment into a clean receipt you can send in seconds.',
  /**
   * The project repository. The footer links the product here rather than to a
   * personal profile, and the legal pages use it as their contact route, so it is
   * defined once and re-exported rather than written out twice.
   */
  repository_url: 'https://github.com/alonzojoe/receipta',
  author: {
    name: 'alonzojoe',
  },
} as const

export const nav_links: readonly SectionLink[] = [
  { label: 'How it works', hash: 'how-it-works' },
  { label: 'Why Receipta', hash: 'why-receipta' },
  { label: 'FAQ', hash: 'faq' },
]

export const footer_links: readonly NavLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
]

