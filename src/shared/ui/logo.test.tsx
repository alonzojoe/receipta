import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { site } from '@/shared/config/site'

import { Logo, LogoMark, LogoWordmark } from './logo'

describe('LogoMark', () => {
  it('renders the brand artwork', () => {
    const { container } = render(<LogoMark />)

    expect(container.querySelector('img')?.getAttribute('src')).toBeTruthy()
  })

  it('is decorative, since the wordmark carries the name', () => {
    const { container } = render(<LogoMark />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(img).toHaveAttribute('alt', '')
  })

  it('reserves space so the header does not shift while it loads', () => {
    const { container } = render(<LogoMark />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute('width')
    expect(img).toHaveAttribute('height')
  })

  it('lets the caller override its size', () => {
    const { container } = render(<LogoMark className="size-5" />)

    expect(container.querySelector('img')?.getAttribute('class')).toContain('size-5')
  })
})

describe('LogoWordmark', () => {
  it('ships a light and a dark version', () => {
    const { container } = render(<LogoWordmark />)

    expect(container.querySelectorAll('img')).toHaveLength(2)
  })

  it('shows exactly one of them per theme', () => {
    const { container } = render(<LogoWordmark />)
    const classes = [...container.querySelectorAll('img')].map((i) => i.className)

    // One is hidden in dark, the other hidden until dark. Never both, never neither.
    expect(classes.some((c) => c.includes('dark:hidden'))).toBe(true)
    expect(classes.some((c) => c.includes('hidden') && c.includes('dark:block'))).toBe(
      true,
    )
  })

  it('makes both images decorative, so neither is announced', () => {
    const { container } = render(<LogoWordmark />)

    for (const img of container.querySelectorAll('img')) {
      expect(img).toHaveAttribute('aria-hidden', 'true')
      expect(img).toHaveAttribute('alt', '')
    }
  })

  it('carries the name once, in text rather than in an image', () => {
    render(<LogoWordmark />)

    // Not alt text: alt on the hidden image would be announced in the wrong theme, and
    // alt on both would be announced twice.
    expect(screen.getByText(site.name)).toBeInTheDocument()
  })

  it('reserves space for both, so neither shifts the header', () => {
    const { container } = render(<LogoWordmark />)

    for (const img of container.querySelectorAll('img')) {
      expect(img).toHaveAttribute('width')
      expect(img).toHaveAttribute('height')
    }
  })
})

describe('Logo', () => {
  it('combines the mark and the wordmark', () => {
    const { container } = render(<Logo />)

    // One mark plus two wordmark variants.
    expect(container.querySelectorAll('img')).toHaveLength(3)
    expect(screen.getByText(site.name)).toBeInTheDocument()
  })
})
