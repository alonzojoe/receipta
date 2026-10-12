import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Logo, LogoMark, LogoWordmark } from './logo'

describe('Logo', () => {
  it('renders the brand artwork', () => {
    const { container } = render(<LogoMark />)
    const img = container.querySelector('img')

    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBeTruthy()
  })

  it('hides the mark from assistive tech, since the wordmark carries the name', () => {
    const { container } = render(<LogoMark />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(img).toHaveAttribute('alt', '')
  })

  it('reserves space so the header does not shift while the mark loads', () => {
    const { container } = render(<LogoMark />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute('width')
    expect(img).toHaveAttribute('height')
  })

  it('lets the caller override the mark size', () => {
    const { container } = render(<LogoMark className="size-5" />)

    expect(container.querySelector('img')?.getAttribute('class')).toContain('size-5')
  })

  it('renders the wordmark as readable text', () => {
    render(<LogoWordmark />)

    expect(screen.getByText('Receipta')).toBeInTheDocument()
  })

  it('combines mark and wordmark', () => {
    const { container } = render(<Logo />)

    expect(container.querySelector('img')).toBeInTheDocument()
    expect(screen.getByText('Receipta')).toBeInTheDocument()
  })
})
