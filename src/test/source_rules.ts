import * as ts from 'typescript'

/**
 * The detectors behind `repo_rules.test.ts`, as pure functions of (path, source text) so
 * `source_rules.test.ts` can prove each one both ways: it fires on a real violation and
 * stays silent on look-alikes. They read the syntax tree, not the text, so a comment, a
 * string of user-facing copy or JSX prose can never be mistaken for code. A rule test that
 * fails on innocent source is one somebody deletes, which is worse than no rule.
 */

export type Hit = { line: number; text: string }

function parse(path: string, source: string) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}

function hit(file: ts.SourceFile, node: ts.Node): Hit {
  const { line } = file.getLineAndCharacterOfPosition(node.getStart(file))
  return { line: line + 1, text: node.getText(file).slice(0, 80) }
}

function collect(path: string, source: string, pick: (node: ts.Node, file: ts.SourceFile) => boolean) {
  const file = parse(path, source)
  const hits: Hit[] = []
  walk(file, (node) => {
    if (pick(node, file)) hits.push(hit(file, node))
  })
  return hits
}

/** Every `any` in a type position: `: any`, `as any`, `<any>`, `any[]`, `Array<any>`. */
export function find_any_types(path: string, source: string) {
  return collect(path, source, (node) => node.kind === ts.SyntaxKind.AnyKeyword)
}

const is_property_access = (node: ts.Node, object: string, name: string) =>
  ts.isPropertyAccessExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === object &&
  node.name.text === name

/** `Intl.NumberFormat`, however it is used. */
export function find_intl_number_format(path: string, source: string) {
  return collect(path, source, (node) => is_property_access(node, 'Intl', 'NumberFormat'))
}

/** A call to `.toFixed(` or `.toLocaleString(`. */
export function find_hand_rolled_money(path: string, source: string) {
  return collect(
    path,
    source,
    (node) =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ['toFixed', 'toLocaleString'].includes(node.expression.name.text),
  )
}

/** A `<input>` or `<textarea>` element (lower case: a component named Input is fine). */
export function find_raw_form_elements(path: string, source: string) {
  return collect(path, source, (node) => {
    if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) return false
    return ts.isIdentifier(node.tagName) && ['input', 'textarea'].includes(node.tagName.text)
  })
}

export function find_interfaces(path: string, source: string) {
  return collect(path, source, (node) => ts.isInterfaceDeclaration(node))
}

/** Module specifiers of every static import, re-export and dynamic `import()`. */
export function import_specifiers(path: string, source: string): { specifier: string; line: number }[] {
  const file = parse(path, source)
  const found: { specifier: string; line: number }[] = []
  walk(file, (node) => {
    let literal: ts.Expression | undefined
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      literal = node.moduleSpecifier
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      literal = node.arguments[0]
    }
    if (literal && ts.isStringLiteralLike(literal)) {
      found.push({ specifier: literal.text, line: hit(file, literal).line })
    }
  })
  return found
}

/** Inline `style={{ width: '120px' }}` style fixed pixel sizes. */
export function find_fixed_pixel_styles(path: string, source: string) {
  return collect(
    path,
    source,
    (node) =>
      ts.isPropertyAssignment(node) &&
      ['width', 'height'].includes(node.name.getText()) &&
      ts.isStringLiteralLike(node.initializer) &&
      /^\s*\d+(?:\.\d+)?px\s*$/.test(node.initializer.text),
  )
}

type Literal = { text: string; node: ts.Node }

const icon_sources = ['react-icons', 'lucide-react']

/** Names imported from an icon package, plus `svg`: elements whose own size may be fixed. */
function icon_tags(file: ts.SourceFile) {
  const tags = new Set(['svg'])
  walk(file, (node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return
    if (!icon_sources.some((name) => (node.moduleSpecifier as ts.StringLiteral).text.startsWith(name))) return
    const bindings = node.importClause?.namedBindings
    if (bindings && ts.isNamedImports(bindings)) bindings.elements.forEach((el) => tags.add(el.name.text))
  })
  return tags
}

function is_inside_icon(node: ts.Node, tags: Set<string>) {
  for (let current: ts.Node | undefined = node; current; current = current.parent) {
    if (ts.isJsxAttribute(current)) {
      const element = current.parent.parent
      const opening = ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element) ? element : undefined
      return Boolean(opening && ts.isIdentifier(opening.tagName) && tags.has(opening.tagName.text))
    }
  }
  return false
}

/**
 * The text of every string and template literal, which is where class names live. Comments
 * and JSX prose are not literals, so they are never searched. A literal on an icon (a
 * react-icons or lucide component, or an `<svg>`) is left out when `skip_icons` is set,
 * because fixed dimensions are allowed on icons.
 */
function string_literals(path: string, source: string, skip_icons: boolean): Literal[] {
  const file = parse(path, source)
  const tags = skip_icons ? icon_tags(file) : new Set<string>()
  const literals: Literal[] = []
  walk(file, (node) => {
    const is_text =
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    if (!is_text) return
    // `import x from 'a'` specifiers are not class names.
    if (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent)) return
    if (skip_icons && is_inside_icon(node, tags)) return
    literals.push({ text: node.text, node })
  })
  return literals
}

function in_literals(path: string, source: string, pattern: RegExp, skip_icons = false): Hit[] {
  const file = parse(path, source)
  return string_literals(path, source, skip_icons)
    .filter(({ text }) => pattern.test(text))
    .map(({ node }) => hit(file, node))
}

/**
 * Arbitrary w-, h- and size- values: `w-[320px]`, `sm:h-[5rem]`. CLAUDE.md forbids them on
 * non-icon elements. It allows `max-w-*` and `max-h-*`, and the `(?<![\w-])` guard is what
 * lets `max-w-[60ch]` through: a preceding `-` means it is some other utility. `min-*` is
 * not matched either: it is a floor, not an exact size, and the rule does not forbid it.
 * Icons (react-icons, lucide, svg) may carry fixed sizes.
 */
export function find_arbitrary_dimensions(path: string, source: string) {
  return in_literals(path, source, /(?<![\w-])(?:w|h|size)-\[/, true)
}

/** `transition-all`, and a bare `ease-in` (but not `ease-in-out`, which the project uses). */
export function find_banned_motion(path: string, source: string) {
  return in_literals(path, source, /(?<![\w-])(?:transition-all|ease-in)(?![\w-])/)
}

/**
 * A colour written in a component instead of taken from the tokens in index.css: a 6 or 8
 * digit hex, a bracketed hex such as `bg-[#fff]`, a colour function, or a Tailwind palette
 * shade such as `text-red-500`. Bare `white` and `black` are not flagged: they are used on
 * brand gradients and cannot be told from a mistake by pattern. A 3 digit hex is only
 * matched in brackets, because `#add` or `#bad` is as likely to be an element id.
 */
export function find_colour_literals(path: string, source: string) {
  const palette =
    'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
  const pattern = new RegExp(
    [
      '#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?(?![\\w])',
      '\\[#[0-9a-fA-F]{3,8}\\]',
      '\\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb)\\(',
      `(?<![\\w-])(?:[a-z]+:)?(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|accent|caret|shadow)-(?:${palette})-\\d{2,3}(?![\\w-])`,
    ].join('|'),
  )
  return in_literals(path, source, pattern)
}

const sliced_layers = ['widgets', 'features', 'pages']

/** `/src/widgets/site_header/ui/x.tsx` -> `{ layer: 'widgets', slice: 'site_header' }`. */
function slice_of(path: string) {
  const match = path.match(/^\/src\/([^/]+)\/([^/]+)\//)
  return match && sliced_layers.includes(match[1]) ? { layer: match[1], slice: match[2] } : null
}

/**
 * Imports that reach into a sibling slice on the same layer (one widget using another,
 * one feature using another), which Feature Sliced Design forbids. Handles the `@/` alias
 * and relative paths; an import of the file's own slice is fine.
 */
export function find_sibling_slice_imports(path: string, source: string): Hit[] {
  const own = slice_of(path)
  if (!own) return []
  const directory = path.split('/').slice(0, -1)
  return import_specifiers(path, source).filter(({ specifier }) => {
    let target: string | null = null
    if (specifier.startsWith('@/')) target = `/src/${specifier.slice(2)}/`
    else if (specifier.startsWith('.')) {
      const parts = [...directory]
      for (const part of specifier.split('/')) {
        if (part === '..') parts.pop()
        else if (part !== '.') parts.push(part)
      }
      target = `${parts.join('/')}/`
    }
    const other = target && slice_of(target)
    return Boolean(other && other.layer === own.layer && other.slice !== own.slice)
  }).map(({ specifier, line }) => ({ line, text: specifier }))
}
