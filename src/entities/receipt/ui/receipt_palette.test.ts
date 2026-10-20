import { describe, expect, it } from 'vitest'

import { css_rules, declarations } from '@/test/css_blocks'

const index_css = Object.values(
  import.meta.glob('/src/index.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
)[0]

function receipt_properties(selector_test: (selector: string) => boolean) {
  return css_rules(index_css)
    .filter((rule) => selector_test(rule.selector))
    .flatMap((rule) => declarations(rule.body))
    .filter(({ property }) => property.startsWith('--receipt-'))
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground: string, background: string) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

describe('the --receipt-* palette (criterion 17)', () => {
  const in_root = receipt_properties((selector) => selector === ':root')
  const palette = Object.fromEntries(in_root.map(({ property, value }) => [property, value]))

  it('defines paper, ink, muted, rule and stamp in :root, as plain hex', () => {
    expect(Object.keys(palette).sort()).toEqual([
      '--receipt-ink',
      '--receipt-muted',
      '--receipt-paper',
      '--receipt-rule',
      '--receipt-stamp',
    ])
    for (const value of Object.values(palette)) expect(value).toMatch(/^#[0-9a-f]{6}$/i)
    expect(palette['--receipt-paper'].toLowerCase()).toBe('#ffffff')
  })

  it('does not override any of them in .dark, or anywhere else', () => {
    const elsewhere = receipt_properties((selector) => selector !== ':root')
    expect(elsewhere).toEqual([])
    expect(receipt_properties((selector) => /\.dark/.test(selector))).toEqual([])
  })

  it('finds a decoy: the extractor does see an override placed in .dark', () => {
    const decoy = ':root { --receipt-ink: #000000; } .dark { --receipt-ink: #ffffff; }'
    const found = css_rules(decoy).filter((rule) => /\.dark/.test(rule.selector)).flatMap((rule) => declarations(rule.body))
    expect(found).toEqual([{ property: '--receipt-ink', value: '#ffffff' }])
  })

  it('keeps text readable on the paper: ink, muted and the stamp at 4.5:1 or better', () => {
    const paper = palette['--receipt-paper']
    expect(contrast(palette['--receipt-ink'], paper)).toBeGreaterThan(15)
    expect(contrast(palette['--receipt-muted'], paper)).toBeGreaterThan(7)
    // The stamp is text as well as a border, so it clears AA rather than only 3:1.
    expect(contrast(palette['--receipt-stamp'], paper)).toBeGreaterThan(4.5)
  })

  it('measures contrast correctly (black on white is 21:1)', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })
})
