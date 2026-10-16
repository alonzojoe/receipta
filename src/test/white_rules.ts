import { css_rules, declarations, strip_css_comments } from './css_blocks'

/**
 * The detectors behind the white-background source tests. The receipt document is a sheet of
 * paper: it must not take a colour from the app, from the theme, or from its parent. Pure
 * functions of text, so `white_rules.test.ts` proves each both ways, like `source_rules.ts`.
 */

/** The names Tailwind turns into `bg-*`, `text-*`, `border-*`... utilities, read from index.css. */
export function theme_token_names(index_css: string) {
  const names = new Set<string>()
  for (const match of strip_css_comments(index_css).matchAll(/--color-([a-z0-9-]+)\s*:/g)) names.add(match[1])
  return [...names].sort((a, b) => b.length - a.length)
}

const colour_utility_prefixes =
  'bg|text|border|border-[trblxyse]|ring|ring-offset|fill|stroke|outline|from|to|via|divide|decoration|shadow|accent|caret|placeholder|inset-ring'

/**
 * A utility class that resolves to an app theme colour: `bg-card`, `text-muted-foreground`,
 * `dark:bg-black`'s `dark:` too. The token list comes from index.css, so a new token covers
 * itself. `(?<![\w-])` stops `receipt-caption-accent` matching `accent`.
 */
export function find_theme_utilities(text: string, tokens: readonly string[]) {
  const names = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const pattern = new RegExp(
    `(?<![\\w-])(?:[a-z0-9-]+:)*(?:${colour_utility_prefixes})-(?:${names})(?:/\\d+|/\\[[^\\]]+\\])?(?![\\w-])`,
    'g',
  )
  return [...text.matchAll(pattern)].map((match) => match[0])
}

/** A `dark:` variant, or a `.dark` selector. */
export function find_dark_variants(text: string) {
  return [...text.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*dark:[^\s"'`]+|\.dark\b/g)].map((match) => match[0])
}

/** `currentColor` in any case. */
export function find_current_color(text: string) {
  return [...text.matchAll(/currentcolor/gi)].map((match) => match[0])
}

const colour_properties = /^(?:color|background(?:-color)?|border(?:-[a-z]+)*-color|outline-color|fill|stroke|caret-color|text-decoration-color)$/

/**
 * Colour in a stylesheet that is not a `--receipt-*` property: a hex, a colour function, a
 * `var()` of anything else, `currentColor`, or `inherit` on a colour property. Reading
 * `rgb(` etc. catches an inline value; `var(--border)` is the app's token leaking in.
 */
export function find_foreign_css_colours(css: string) {
  const found: string[] = []
  for (const rule of css_rules(css)) {
    for (const { property, value } of declarations(rule.body)) {
      if (/#[0-9a-fA-F]{3,8}\b/.test(value)) found.push(`${property}: ${value}`)
      if (/\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb|color-mix)\(/.test(value)) found.push(`${property}: ${value}`)
      for (const used of value.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!used[1].startsWith('--receipt-')) found.push(`${property}: ${value}`)
      }
      if (/currentcolor/i.test(value)) found.push(`${property}: ${value}`)
      if (colour_properties.test(property) && /^(?:inherit|initial|unset|revert)$/i.test(value)) {
        found.push(`${property}: ${value}`)
      }
    }
  }
  return found
}

/** Block comments and whole-line `//` comments removed, so prose that mentions a rule is not a hit. */
export function strip_code_comments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
}
