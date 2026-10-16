import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { steps } from '../model/step_rules'
import { StepTimeline } from './step_timeline'

/**
 * These tests pin class names, which is usually a smell. They exist because the colours
 * here are the whole feature, and because the failure they guard is silent in two
 * directions: dropping `dark:bg-brand-fill` leaves the active disc lavender with nothing
 * failing, and writing `bg-brand-fill` without the `dark:` prefix fills the disc in LIGHT
 * mode, where the spec requires no change at all. Neither is visible to a behavioural
 * test, and neither is visible to a reader of the diff.
 *
 * The brand violet is a FILL and `--primary` is ink. That division is what keeps the
 * active disc legible, so the tests assert the division rather than the colour.
 */

const disc_of = (label: string) => {
  const row = screen.getByText(label).closest('li')
  expect(row, `no row for ${label}`).not.toBeNull()
  // The rail disc is the fixed-size circle; the strip segment beside it is `lg:hidden`.
  const disc = [...row!.querySelectorAll('span')].find((s) => /size-8/.test(s.className))
  expect(disc, `no disc for ${label}`).toBeDefined()
  return disc!.className
}

const timeline = (current: 1 | 2 | 3 | 4) =>
  render(<StepTimeline current={current} on_select={vi.fn()} />)

describe('StepTimeline colours', () => {
  it('fills the active disc with the brand violet in dark mode only', () => {
    timeline(2)
    const active = disc_of('Items')

    expect(active).toContain('dark:bg-brand-fill')
    expect(active).toContain('dark:text-brand-fill-foreground')
  })

  /**
   * The one that matters most. A bare `bg-brand-fill` on the disc would satisfy the test
   * above while repainting light mode, which the spec forbids.
   */
  it('never fills the active disc unconditionally, which would repaint light mode', () => {
    timeline(2)
    const active = disc_of('Items')

    const classes = active.split(/\s+/)
    expect(classes).not.toContain('bg-brand-fill')
    expect(classes).not.toContain('text-brand-fill-foreground')
    // Light mode keeps the outline: a card-coloured disc with violet ink.
    expect(classes).toContain('bg-card')
    expect(classes).toContain('text-primary')
  })

  it('keeps the active disc rim and halo on primary, because they are ink', () => {
    timeline(2)
    const active = disc_of('Items')

    expect(active).toContain('border-primary')
    expect(active).toContain('ring-primary/20')
    expect(active).not.toContain('border-brand-fill')
    expect(active).not.toContain('ring-brand-fill')
  })

  it('leaves the completed discs on primary', () => {
    timeline(3)

    for (const label of ['Parties', 'Items']) {
      const done = disc_of(label)
      expect(done).toContain('bg-primary')
      expect(done).not.toContain('brand-fill')
    }
  })

  it('leaves the upcoming discs alone', () => {
    timeline(2)
    const upcoming = disc_of('Review')

    expect(upcoming).toContain('border-control-border')
    expect(upcoming).not.toContain('brand-fill')
    expect(upcoming).not.toContain('bg-primary')
  })

  /**
   * The progress stays on `--primary`. The mark violet separated from its own empty track
   * at only 1.89:1 in dark, against about 4.5:1 for lavender - both are dark colours, so
   * the filled and empty halves of a gauge stopped being distinguishable. The violet
   * belongs on the disc, which is identified by its rim and its white content, not on a
   * bar whose only job is a boundary.
   */
  it('leaves the progress line and bar on primary, so the gauge stays readable', () => {
    const { container } = timeline(2)

    const brand = [...container.querySelectorAll('*')].filter((el) =>
      /brand-fill/.test(el.className),
    )
    // Only the active disc may carry the brand fill.
    expect(brand).toHaveLength(1)
    expect(brand[0].className).toContain('dark:bg-brand-fill')

    const bars = [...container.querySelectorAll('*')].filter((el) =>
      /origin-left|origin-top/.test(el.className),
    )
    expect(bars.length).toBeGreaterThanOrEqual(2)
    for (const bar of bars) {
      expect(bar.className).toContain('bg-primary')
      expect(bar.className).not.toContain('brand-fill')
    }
  })

  it('leaves the compact strip segments on primary, since the author scoped this to the sidebar', () => {
    const { container } = timeline(2)
    const strip = [...container.querySelectorAll('span')].filter((s) =>
      /lg:hidden/.test(s.className),
    )

    expect(strip.length).toBeGreaterThan(0)
    for (const seg of strip) {
      const inner = seg.querySelector('span')
      if (inner) expect(inner.className).not.toContain('brand-fill')
    }
  })

  it('never recolours the focus ring, which was raised to pass contrast separately', () => {
    const { container } = timeline(3)

    expect(container.innerHTML).not.toContain('focus-visible:ring-brand-fill')
    expect(container.innerHTML).toContain('focus-visible:ring-ring')
  })

  it('renders every step at every position', () => {
    for (const current of [1, 2, 3, 4] as const) {
      const { unmount } = timeline(current)
      expect(screen.getAllByRole('listitem')).toHaveLength(steps.length)
      unmount()
    }
  })
})
