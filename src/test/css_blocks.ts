/**
 * Just enough CSS reading for the tests that guard stylesheets: comments removed, rule
 * bodies found by matching braces (so a nested at-rule is one block), declarations split out.
 * Not a parser; it is only ever pointed at this repository's own two files.
 */

export function strip_css_comments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

export type CssRule = { selector: string; body: string; depth: number }

/** Every rule with its selector and body, outermost first. A nested rule is also listed. */
export function css_rules(css: string): CssRule[] {
  const text = strip_css_comments(css)
  const rules: CssRule[] = []

  function scan(start: number, end: number, depth: number) {
    let cursor = start
    while (cursor < end) {
      const open = text.indexOf('{', cursor)
      if (open === -1 || open >= end) return
      const before = text.slice(cursor, open)
      const selector = before.slice(Math.max(before.lastIndexOf(';'), before.lastIndexOf('}')) + 1).trim()
      let level = 1
      let index = open + 1
      while (index < end && level > 0) {
        if (text[index] === '{') level += 1
        else if (text[index] === '}') level -= 1
        index += 1
      }
      const body = text.slice(open + 1, index - 1)
      rules.push({ selector, body, depth })
      if (body.includes('{')) scan(open + 1, index - 1, depth + 1)
      cursor = index
    }
  }

  scan(0, text.length, 0)
  return rules
}

/** `prop: value` pairs of a rule body, ignoring nested blocks. */
export function declarations(body: string): { property: string; value: string }[] {
  let flat = ''
  let level = 0
  for (const char of body) {
    if (char === '{') level += 1
    else if (char === '}') level -= 1
    else if (level === 0) flat += char
  }
  return flat
    .split(';')
    .map((piece) => piece.trim())
    .filter((piece) => piece.includes(':'))
    .map((piece) => {
      const split = piece.indexOf(':')
      return { property: piece.slice(0, split).trim(), value: piece.slice(split + 1).trim() }
    })
}

/** Declarations of every rule whose selector, split on commas, includes `selector` exactly. */
export function rules_for(css: string, selector: string) {
  return css_rules(css).filter((rule) => rule.selector.split(',').some((part) => part.trim() === selector))
}
