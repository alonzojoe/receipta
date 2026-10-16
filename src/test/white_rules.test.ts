import { describe, expect, it } from 'vitest'

import { css_rules, declarations, rules_for } from './css_blocks'
import {
  find_current_color,
  find_dark_variants,
  find_foreign_css_colours,
  find_theme_utilities,
  theme_token_names,
} from './white_rules'

const fixture_css = `
@theme inline {
  --color-background: var(--background);
  --color-card: var(--card);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
}
`

describe('theme_token_names', () => {
  it('reads the --color-* entries and nothing else', () => {
    const tokens = theme_token_names(fixture_css + ':root { --background: red; --radius: 1px; }')
    expect(tokens.sort()).toEqual(['background', 'border', 'card', 'muted-foreground'])
  })

  it('ignores a token that is only mentioned in a comment', () => {
    expect(theme_token_names('/* --color-ghost: x; */ @theme { --color-real: y; }')).toEqual(['real'])
  })
})

describe('find_theme_utilities', () => {
  const tokens = theme_token_names(fixture_css)

  it('fires on app colour utilities, with variants and opacity', () => {
    for (const text of ['bg-card', 'text-muted-foreground', 'border-border', 'sm:bg-background', 'hover:text-card/80']) {
      expect(find_theme_utilities(text, tokens), text).toHaveLength(1)
    }
  })

  it('finds every one in a class list', () => {
    expect(find_theme_utilities('flex bg-card text-muted-foreground p-2', tokens)).toHaveLength(2)
  })

  it('is silent on the document own classes, prose and unrelated utilities', () => {
    for (const text of [
      'receipt-caption receipt-caption-accent',
      'flex items-center gap-2',
      'The card is on the table and the border is wide',
      'text-sm',
      'border-t',
    ]) {
      expect(find_theme_utilities(text, tokens), text).toEqual([])
    }
  })

  it('covers a token added later, because the list comes from the stylesheet', () => {
    const later = theme_token_names(`${fixture_css} @theme { --color-brand-sixth: red; }`)
    expect(find_theme_utilities('bg-brand-sixth', later)).toHaveLength(1)
    expect(find_theme_utilities('bg-brand-sixth', tokens)).toEqual([])
  })
})

describe('find_dark_variants and find_current_color', () => {
  it('fires on dark: in a class and a .dark selector', () => {
    expect(find_dark_variants('flex dark:bg-black')).toHaveLength(1)
    expect(find_dark_variants('sm:dark:hidden')).toHaveLength(1)
    expect(find_dark_variants('.dark .receipt { color: red }')).toHaveLength(1)
  })

  it('is silent on prose that contains the letters', () => {
    expect(find_dark_variants('a dark horse, darkness, the Dark Ages')).toEqual([])
  })

  it('fires on currentColor in any case', () => {
    expect(find_current_color('border-color: currentColor')).toHaveLength(1)
    expect(find_current_color('fill: currentcolor')).toHaveLength(1)
    expect(find_current_color('color: var(--receipt-ink)')).toEqual([])
  })
})

describe('find_foreign_css_colours', () => {
  it('fires on a hex, a colour function, an app token, currentColor and inherited colour', () => {
    for (const body of [
      'color: #fff',
      'background: #0f172aff',
      'color: rgb(0 0 0)',
      'color: oklch(0.5 0 0)',
      'color: var(--foreground)',
      'border-color: var(--border)',
      'border: 1px solid currentColor',
      'color: inherit',
      'background-color: inherit',
    ]) {
      expect(find_foreign_css_colours(`.x { ${body} }`), body).toHaveLength(1)
    }
  })

  it('is silent on receipt properties, and on inherit for a non-colour', () => {
    const css = `.x { color: var(--receipt-ink); border: 1px solid var(--receipt-rule); font: inherit; box-shadow: none }`
    expect(find_foreign_css_colours(css)).toEqual([])
  })

  it('does not read comments', () => {
    expect(find_foreign_css_colours('/* color: #fff */ .x { color: var(--receipt-ink) }')).toEqual([])
  })
})

describe('css_rules', () => {
  const css = `
    :root { --a: 1; --receipt-x: #fff; }
    .dark { --a: 2; }
    @media (x) { .inner { color: red; } }
    .a, .b { margin: 0; }
  `

  it('finds a rule by selector, including one in a comma list', () => {
    expect(rules_for(css, '.b')).toHaveLength(1)
    expect(rules_for(css, '.dark')).toHaveLength(1)
    expect(rules_for(css, '.missing')).toEqual([])
  })

  it('finds a nested rule and keeps its depth', () => {
    expect(css_rules(css).find((rule) => rule.selector === '.inner')?.depth).toBe(1)
  })

  it('reads declarations, ignoring nested blocks', () => {
    expect(declarations('a: 1; b: var(--c); .n { d: 2 }')).toEqual([
      { property: 'a', value: '1' },
      { property: 'b', value: 'var(--c)' },
    ])
  })
})
