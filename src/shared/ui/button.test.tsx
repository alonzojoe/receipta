import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from './button'

const variants = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'link',
  'destructive',
] as const

const sizes = ['sm', 'default', 'lg', 'icon'] as const

describe('Button', () => {
  it('renders every variant with a distinct class string', () => {
    const seen = new Map<string, string>()

    for (const variant of variants) {
      const { unmount } = render(<Button variant={variant}>press</Button>)
      const classes = screen.getByRole('button').className
      expect(classes, `${variant} produced no classes`).not.toBe('')
      seen.set(variant, classes)
      unmount()
    }

    expect(new Set(seen.values()).size).toBe(variants.length)
  })

  it('renders every size with a distinct class string', () => {
    const seen = new Map<string, string>()

    for (const size of sizes) {
      const { unmount } = render(<Button size={size}>press</Button>)
      seen.set(size, screen.getByRole('button').className)
      unmount()
    }

    expect(new Set(seen.values()).size).toBe(sizes.length)
  })

  it('gives every variant press feedback', () => {
    for (const variant of variants) {
      const { unmount } = render(<Button variant={variant}>press</Button>)
      expect(
        screen.getByRole('button').className,
        `${variant} is missing press feedback`,
      ).toContain('active:scale-[0.97]')
      unmount()
    }
  })

  it('names the transitioned properties instead of using transition-all', () => {
    render(<Button>press</Button>)
    const classes = screen.getByRole('button').className

    expect(classes).toContain('transition-[transform,')
    expect(classes).not.toContain('transition-all')
  })

  it('exposes variant and size as data attributes', () => {
    render(
      <Button variant="outline" size="lg">
        press
      </Button>,
    )
    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('data-variant', 'outline')
    expect(button).toHaveAttribute('data-size', 'lg')
  })

  it('merges a caller className over the variant styles', () => {
    render(<Button className="rounded-full">press</Button>)

    expect(screen.getByRole('button').className).toContain('rounded-full')
  })

  it('renders as a child element when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/create">create</a>
      </Button>,
    )

    expect(screen.getByRole('link', { name: 'create' })).toBeInTheDocument()
  })
})
