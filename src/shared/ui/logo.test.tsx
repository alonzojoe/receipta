import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Logo, LogoMark, LogoWordmark } from './logo'

describe('Logo', () => {
  it('hides the mark from assistive tech, since the wordmark carries the name', () => {
    const { container } = render(<LogoMark />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws the mark with currentColor so it inherits the theme', () => {
    const { container } = render(<LogoMark />)

    expect(container.innerHTML).toContain('currentColor')
  })

  it('lets the caller override the mark size', () => {
    const { container } = render(<LogoMark className="size-5" />)

    expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-5')
  })

  it('renders the wordmark as readable text', () => {
    render(<LogoWordmark />)

    expect(screen.getByText('Receipta')).toBeInTheDocument()
  })

  it('combines mark and wordmark', () => {
    const { container } = render(<Logo />)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText('Receipta')).toBeInTheDocument()
  })
})
