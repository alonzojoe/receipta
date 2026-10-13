import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Marquee } from './marquee'

/*
 * motion/react reads the reduced-motion media query when its module loads, before a
 * test can stub matchMedia, so stubbing the query does not reach it. Mocking the hook
 * tests what actually matters here: that the component branches correctly on the
 * answer, whatever the answer is.
 */
const reduced_motion = vi.hoisted(() => ({ value: false }))

vi.mock('motion/react', () => ({
  useReducedMotion: () => reduced_motion.value,
}))

function items() {
  return (
    <>
      <span>GCash</span>
      <span>Maya</span>
    </>
  )
}

function set_reduced_motion(reduced: boolean) {
  reduced_motion.value = reduced
}

beforeEach(() => {
  reduced_motion.value = false
})

describe('Marquee', () => {
  it('renders its content twice so the loop has somewhere to go', () => {
    set_reduced_motion(false)
    render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    expect(screen.getAllByText('GCash')).toHaveLength(2)
  })

  it('hides the duplicate from assistive technology', () => {
    set_reduced_motion(false)
    const { container } = render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    const hidden = container.querySelector('[aria-hidden="true"]')
    expect(hidden).not.toBeNull()
    // The copy inside the hidden track, not the real one.
    expect(within(hidden as HTMLElement).getByText('GCash')).toBeInTheDocument()
  })

  it('takes its speed from the caller, so the strip does not accelerate as it grows', () => {
    set_reduced_motion(false)
    const { container } = render(<Marquee duration_seconds={34}>{items()}</Marquee>)

    const track = container.querySelector('[style*="animation-duration"]')
    expect(track?.getAttribute('style')).toContain('34s')
  })

  it('animates nothing under reduced motion, but still shows everything', () => {
    set_reduced_motion(true)
    const { container } = render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    expect(container.innerHTML).not.toContain('animate-[marquee')
    expect(container.querySelector('[style*="animation-duration"]')).toBeNull()
    expect(screen.getByText('GCash')).toBeInTheDocument()
    expect(screen.getByText('Maya')).toBeInTheDocument()
  })

  it('renders each item once under reduced motion, with no hidden duplicate', () => {
    set_reduced_motion(true)
    render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    expect(screen.getAllByText('GCash')).toHaveLength(1)
  })

  it('contains nothing focusable, since a focusable item in a moving track is a trap', () => {
    set_reduced_motion(false)
    const { container } = render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    expect(
      container.querySelectorAll('a, button, input, select, textarea, [tabindex]'),
    ).toHaveLength(0)
  })
})
