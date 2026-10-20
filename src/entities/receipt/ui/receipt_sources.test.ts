import { describe, expect, it } from 'vitest'

import { declarations, rules_for } from '@/test/css_blocks'
import { import_specifiers } from '@/test/source_rules'
import { strip_code_comments, find_theme_utilities, find_dark_variants, find_current_color, find_foreign_css_colours, theme_token_names } from '@/test/white_rules'

import { line_height, page_height, page_margin, page_usable_height, page_width, payment_logo_size, footer_wordmark_height, title_mark_size, thumbnail_radius, thumbnail_size, table_column_chars, numeric_cell_padding, type_scale } from '../model/type_scale'

/**
 * Layer 1 of the white-background proof (receipt-export spec): the files that render the
 * document may not take colour from the app. Layers 2 and 3 (the computed-style walk and the
 * light-versus-dark pixel difference) need a browser and are recorded, not asserted here.
 */
const raw = import.meta.glob(['./*.tsx', './*.css'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const index_css = Object.values(
  import.meta.glob('/src/index.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
)[0]

const files = Object.entries(raw)
  .filter(([path]) => !path.endsWith('.test.tsx'))
  .map(([path, text]) => [path, strip_code_comments(text)] as const)
const tsx_files = files.filter(([path]) => path.endsWith('.tsx'))
const css = strip_code_comments(raw['./receipt_document.css'])

describe('the document files (white-background layer 1)', () => {
  it('reads the files it claims to guard', () => {
    expect(tsx_files.map(([path]) => path).sort()).toEqual([
      './receipt_blocks.tsx',
      './receipt_document.tsx',
      './receipt_page.tsx',
    ])
    expect(css.length).toBeGreaterThan(1000)
    expect(index_css).toContain('--receipt-paper')
  })

  it('derives the theme token list from index.css, and it is not empty', () => {
    const tokens = theme_token_names(index_css)
    expect(tokens.length).toBeGreaterThan(20)
    expect(tokens).toEqual(expect.arrayContaining(['background', 'card', 'muted-foreground', 'border', 'foreground']))
  })

  it('uses no dark: variant, no theme token utility and no currentColor', () => {
    const tokens = theme_token_names(index_css)
    for (const [path, text] of files) {
      expect(find_dark_variants(text), `${path} dark`).toEqual([])
      expect(find_theme_utilities(text, tokens), `${path} theme utility`).toEqual([])
      expect(find_current_color(text), `${path} currentColor`).toEqual([])
    }
  })

  it('takes colour from --receipt-* properties only', () => {
    expect(find_foreign_css_colours(css)).toEqual([])
  })

  it('renders no LogoWordmark, imports no dark wordmark, no theme hook, no icon package (criterion 14)', () => {
    for (const [path, text] of tsx_files) {
      const specifiers = import_specifiers(path, text).map(({ specifier }) => specifier)
      expect(specifiers.filter((s) => /wordmark_dark|shared\/ui\/logo|use_theme|react-icons|lucide/.test(s)), path).toEqual([])
      expect(text, path).not.toMatch(/LogoWordmark|LogoMark|wordmark_dark/)
    }
  })

  it('does no arithmetic of its own and no formatting (criterion 23)', () => {
    for (const [path, text] of tsx_files) {
      expect(text, path).not.toMatch(/Intl\.|toFixed|toLocale|parseFloat|Number\(/)
    }
  })

  it('uses no React context', () => {
    for (const [path, text] of tsx_files) expect(text, path).not.toMatch(/useContext|createContext|useTheme/)
  })

  it('never uses the forbidden words in copy (criterion 11)', () => {
    for (const [path, text] of files) {
      expect(text, path).not.toMatch(/\bInvoice\b|OR No\.|\bSerial\b|\bTIN\b|\bVAT\b/)
    }
  })
})

/** Inherited colour properties: a global rule that sets one on `*` would reach the document in dark mode. */
const inherited_colour_properties = ['caret-color', 'accent-color', 'text-decoration-color']

describe('receipt_document.css', () => {
  it('declares its own background, colour, colour scheme and font on the root (criterion 16)', () => {
    const rules = rules_for(css, '.receipt')
    expect(rules).toHaveLength(1)
    const map = Object.fromEntries(declarations(rules[0].body).map(({ property, value }) => [property, value]))
    expect(map['background']).toBe('var(--receipt-paper)')
    expect(map['color']).toBe('var(--receipt-ink)')
    expect(map['color-scheme']).toBe('light')
    expect(map['font-family']).toMatch(/^'Geist Variable', /)
    expect(map['outline']).toBe('none')
    expect(map['box-shadow']).toBe('none')
    expect(map['border-color']).toBe('var(--receipt-rule)')
    expect(map['outline-color']).toBe('var(--receipt-rule)')
    for (const property of inherited_colour_properties) expect(map[property], property).toBe('var(--receipt-ink)')
  })

  it('resets border, outline and shadow colour on every descendant, unlayered (the dark leak)', () => {
    const rule = rules_for(css, '.receipt *')[0]
    const map = Object.fromEntries(declarations(rule.body).map(({ property, value }) => [property, value]))
    expect(map['border-color']).toBe('var(--receipt-rule)')
    expect(map['outline-color']).toBe('var(--receipt-rule)')
    expect(map['box-shadow']).toBe('none')
    for (const property of inherited_colour_properties) expect(map[property], property).toBe('var(--receipt-ink)')
    expect(css).not.toMatch(/@layer/)
  })

  it('declares each size from type_scale.ts', () => {
    for (const value of [...Object.values(type_scale), ...Object.values(line_height)]) {
      expect(css, `${value}px`).toMatch(new RegExp(`(?<![\\d.])${value}px`))
    }
    for (const value of [page_width, page_height, page_margin, page_usable_height, thumbnail_size, thumbnail_radius, payment_logo_size, footer_wordmark_height, title_mark_size]) {
      expect(css, `${value}px`).toMatch(new RegExp(`(?<![\\d.])${value}px`))
    }
  })

  it('uses whole-pixel font sizes from the scale and whole-pixel line heights from the table', () => {
    const sizes = new Set<number>(Object.values(type_scale))
    const heights = new Set<number>(Object.values(line_height))
    const found = { size: 0, height: 0 }
    for (const rule of rules_for(css, '') .concat(rules_for(css, '.receipt'))) void rule
    const all = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .flatMap((block) => declarations(block.slice(block.indexOf('{') + 1)))
    for (const { property, value } of all) {
      if (property === 'font-size') {
        found.size += 1
        expect(sizes.has(Number.parseInt(value, 10)), `font-size ${value}`).toBe(true)
        expect(value).toMatch(/^\d+px$/)
      }
      if (property === 'line-height') {
        found.height += 1
        expect(heights.has(Number.parseInt(value, 10)), `line-height ${value}`).toBe(true)
        expect(value).toMatch(/^\d+px$/)
      }
    }
    expect(found.size).toBeGreaterThanOrEqual(5)
    expect(found.height).toBeGreaterThanOrEqual(5)
  })

  it('sets no vertical margin, so the measured heights add up', () => {
    const all = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .flatMap((block) => declarations(block.slice(block.indexOf('{') + 1)))
    const margins = all.filter(({ property }) => property.startsWith('margin'))
    expect(margins.length).toBeGreaterThan(0)
    for (const { property, value } of margins) {
      const allowed = (property === 'margin' && value === '0') || (property === 'margin-left' && value === 'auto')
      expect(allowed, `${property}: ${value}`).toBe(true)
    }
  })

  it('uses three weights only, 400, 500 and 600, and never a bold 700', () => {
    const weights = [...css.matchAll(/font-weight:\s*([^;]+);/g)].map((match) => match[1].trim())
    expect(weights.length).toBeGreaterThan(5)
    expect([...new Set(weights)].sort()).toEqual(['400', '500', '600'])
    expect(css).not.toMatch(/\bbold\b|font-weight:\s*[789]00/)
  })

  it('declares the table columns from type_scale.ts, in ch, so a figure always fits and a page wraps a name as the measurement did', () => {
    const { qty, unit_price, amount } = table_column_chars
    const pad = numeric_cell_padding
    expect(css).toContain(
      `grid-template-columns: minmax(0, 1fr) calc(${qty}ch + ${pad}px) calc(${unit_price}ch + ${pad}px) calc(${amount}ch + ${pad}px)`,
    )
    expect(rules_for(css, '.receipt-num')[0].body).toContain(`padding-left: ${pad}px`)
  })

  it('never breaks a figure: money and quantity cells do not wrap and do not break inside a word', () => {
    for (const selector of ['.receipt-num', '.receipt-summary-row dd']) {
      const map = Object.fromEntries(declarations(rules_for(css, selector)[0].body).map(({ property, value }) => [property, value]))
      expect(map['white-space'], selector).toBe('nowrap')
      expect(map['overflow-wrap'], selector).toBe('normal')
    }
    // Nothing that can break a number may appear in a rule for a numeric cell.
    expect(rules_for(css, '.receipt-num')[0].body).not.toMatch(/anywhere|break-word|word-break/)
  })

  it('sets the heading row size on its cells, so a ch means the same in every row of the table', () => {
    const head = Object.fromEntries(declarations(rules_for(css, '.receipt-table-head')[0].body).map(({ property, value }) => [property, value]))
    expect(head['font-size']).toBeUndefined()
    const cells = Object.fromEntries(declarations(rules_for(css, '.receipt-table-head > *')[0].body).map(({ property, value }) => [property, value]))
    expect(cells['font-size']).toBe('13px')
  })

  it('spends violet in two CSS places, the rule under the title and the Amount paid figure (the mark is the third)', () => {
    const uses = [...css.matchAll(/([^{}]+)\{[^{}]*var\(--receipt-accent\)[^{}]*\}/g)].map((match) => match[1].trim())
    expect(uses).toEqual(['.receipt-title-row', '.receipt-summary-paid dd'])
  })

  it('does not ask for tabular figures, which the rasteriser does not honour', () => {
    expect(css).not.toMatch(/tabular-nums|font-variant-numeric/)
  })

  it('animates nothing', () => {
    expect(css).not.toMatch(/transition|animation|@keyframes/)
  })
})
