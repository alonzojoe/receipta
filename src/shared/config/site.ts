/**
 * Single source of truth for every string that appears more than once, or that a
 * human might want to change without reading JSX.
 */

export type NavLink = {
  label: string
  href: string
}

export type PaymentMode = {
  id: string
  label: string
}

export const site = {
  name: 'Receipta',
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

export const nav_links: readonly NavLink[] = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Why Receipta', href: '#why-receipta' },
  { label: 'FAQ', href: '#faq' },
]

export const footer_links: readonly NavLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
]

/**
 * Payment providers. Rendered as labels for now: react-icons carries no Philippine
 * fintech marks, and official brand assets have not been sourced yet. The strip is
 * shaped so a logo component can slot in beside each label without restructuring.
 */
export const payment_modes: readonly PaymentMode[] = [
  { id: 'gcash', label: 'GCash' },
  { id: 'maya', label: 'Maya' },
  { id: 'maribank', label: 'MariBank' },
  { id: 'bank-transfer', label: 'Bank Transfer' },
]
