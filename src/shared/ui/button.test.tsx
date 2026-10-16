import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from './button'
import css from '@/index.css?raw'

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

  it('fills the default variant from the button tokens', () => {
    render(<Button>press</Button>)
    const classes = screen.getByRole('button').className.split(' ')

    expect(classes).toContain('bg-button')
    expect(classes).toContain('text-button-foreground')
    expect(classes).toContain('dark:hover:bg-button-hover')
  })

  /**
   * A class name is not a colour. Tailwind inlines `@theme` values into the utilities it
   * emits, so a token declared only in `:root` never reaches `bg-*` - this project has
   * shipped that bug twice, once with `--shadow-*` and once here. Asserting the class
   * alone would pass with no CSS behind it, so the stylesheet is read directly.
   */
  it('backs each button utility with a token the theme actually exposes', () => {
    // Anchored on the at-rule at the start of a line. A plain indexOf('@theme inline')
    // matches the comment that explains this very class of bug, 90 lines earlier.
    const block = (head: string) => {
      const m = new RegExp(`^${head} \\{([\\s\\S]*?)^\\}`, 'm').exec(css)
      expect(m, `no ${head} block in index.css`).not.toBeNull()
      return m![1]
    }

    const theme = block('@theme inline')
    const exposed = ['button', 'button-foreground', 'button-hover', 'brand-fill', 'brand-fill-foreground']
    for (const name of exposed) {
      // Anchored, not a substring: a declaration commented out with // or wrapped in
      // /* */ still satisfies toContain while contributing nothing to the build.
      expect(theme).toMatch(new RegExp(`^\\s*--color-${name}:\\s*var\\(--${name}\\);`, 'm'))
    }

    /**
     * The violet literal lives on --brand-fill, which the Button and the /create
     * timeline's active step both consume; --button is an alias of it. Pinning the whole
     * chain, not just the end of it: an alias that resolves to nothing still reads as a
     * valid declaration, and this test exists because a token defined in the wrong place
     * never reaches the utility that is supposed to use it.
     */
    const dark = block('\\.dark')
    expect(dark).toMatch(/--brand-fill:\s*oklch\(/)
    expect(dark).toMatch(/--brand-fill-foreground:\s*oklch\(/)
    expect(dark).toMatch(/--button:\s*var\(--brand-fill\);/)
    expect(dark).toMatch(/--button-foreground:\s*var\(--brand-fill-foreground\);/)
    expect(dark).toMatch(/--button-hover:\s*color-mix\(/)

    const root = block(':root')
    expect(root).toMatch(/--brand-fill:\s*var\(--primary\);/)
    expect(root).toMatch(/--button:\s*var\(--brand-fill\);/)
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
