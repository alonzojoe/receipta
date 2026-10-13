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
  return [<span key="gcash">GCash</span>, <span key="maya">Maya</span>]
}

function animated_track(container: HTMLElement) {
  return container.querySelector('[style*="animation-duration"]')
}

beforeEach(() => {
  reduced_motion.value = false
})

describe('Marquee', () => {
  it('renders its content twice so the loop has somewhere to go', () => {
    render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    expect(screen.getAllByText('GCash')).toHaveLength(2)
  })

  it('hides the duplicate from assistive technology', () => {
    const { container } = render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    const hidden = container.querySelectorAll('ul[aria-hidden="true"]')
    expect(hidden).toHaveLength(1)
    expect(within(hidden[0] as HTMLElement).getByText('GCash')).toBeInTheDocument()
    // getByText ignores aria-hidden, so exposure is asserted by role in the list test.
  })

  it('exposes one list with one item per child, not the duplicate', () => {
    render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    const lists = screen.getAllByRole('list')
    expect(lists).toHaveLength(1)
    expect(within(lists[0]).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('keeps list semantics under reduced motion, with no duplicate', () => {
    reduced_motion.value = true
    render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    expect(screen.getAllByRole('list')).toHaveLength(1)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getAllByText('GCash')).toHaveLength(1)
  })

  it('takes its speed from the caller, so the strip does not accelerate as it grows', () => {
    const { container } = render(<Marquee duration_seconds={34}>{items()}</Marquee>)

    expect(animated_track(container)?.getAttribute('style')).toContain('34s')
  })

  it('uses the marquee keyframes and pauses on hover-capable pointers only', () => {
    const { container } = render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    const track = animated_track(container) as HTMLElement
    expect(track.className).toContain('animate-[marquee_linear_infinite]')
    expect(track.className).toContain(
      '[@media(hover:hover)]:group-hover:[animation-play-state:paused]',
    )
    // The pause is driven by the wrapper, so the wrapper must be the group.
    expect(track.parentElement?.className).toMatch(/(^|\s)group(\s|$)/)
  })

  it('animates nothing under reduced motion, but still shows everything', () => {
    reduced_motion.value = true
    const { container } = render(<Marquee duration_seconds={10}>{items()}</Marquee>)

    expect(container.innerHTML).not.toContain('animate-')
    expect(container.innerHTML).not.toContain('marquee')
    expect(animated_track(container)).toBeNull()
    expect(screen.getByText('GCash')).toBeInTheDocument()
    expect(screen.getByText('Maya')).toBeInTheDocument()
  })

  it.each([0, -5, NaN, Infinity])(
    'renders statically instead of a broken animation when duration is %s',
    (duration) => {
      const { container } = render(<Marquee duration_seconds={duration}>{items()}</Marquee>)

      expect(animated_track(container)).toBeNull()
      expect(container.innerHTML).not.toContain('animate-')
      expect(screen.getAllByText('GCash')).toHaveLength(1)
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    },
  )

  it('renders statically when there are no children', () => {
    const { container } = render(<Marquee duration_seconds={10}>{[]}</Marquee>)

    expect(animated_track(container)).toBeNull()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
