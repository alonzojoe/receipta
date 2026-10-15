import { describe, expect, it } from 'vitest'

import {
  find_any_types,
  find_arbitrary_dimensions,
  find_banned_motion,
  find_colour_literals,
  find_fixed_pixel_styles,
  find_hand_rolled_money,
  find_interfaces,
  find_intl_number_format,
  find_raw_form_elements,
  find_sibling_slice_imports,
  import_specifiers,
  type Hit,
} from './source_rules'

/**
 * Repository rules from CLAUDE.md and the receipt form spec, checked against the source
 * text. Each one is a search that must come back empty (or come back with exactly the
 * known exceptions), so a violation fails here instead of waiting for a reviewer to
 * notice it.
 *
 * Source is read with Vite's glob import so the app tsconfig does not need Node types.
 *
 * Most rules read the syntax tree through `source_rules.ts`, so a comment, user-facing copy
 * or JSX prose cannot trip them; `source_rules.test.ts` proves each detector fires on a
 * violation and stays quiet on look-alikes. Two rules below (useState, and the comment
 * stripper they use) still search text and say so.
 */
const modules = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const is_test = (path: string) => /\.test\.tsx?$/.test(path) || path.startsWith('/src/test/')

/** Block and whole-line comments removed, so prose that mentions `<input>` is not a hit. */
function strip_comments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
}

const sources = Object.entries(modules)
  .filter(([path]) => !is_test(path))
  .map(([path, text]) => ({ path, code: strip_comments(text) }))

/** Paths of the non-test files in which `find` reports anything. */
function with_hits(find: (path: string, source: string) => Hit[], skip: (path: string) => boolean = () => false) {
  return Object.entries(modules)
    .filter(([path]) => !is_test(path) && !skip(path))
    .filter(([path, text]) => find(path, text).length > 0)
    .map(([path]) => path)
}

function offenders(pattern: RegExp, skip: (path: string) => boolean = () => false) {
  return sources.filter(({ path, code }) => !skip(path) && pattern.test(code)).map(({ path }) => path)
}

function imports_matching(pattern: RegExp) {
  return (path: string, source: string): Hit[] =>
    import_specifiers(path, source)
      .filter(({ specifier }) => pattern.test(specifier))
      .map(({ specifier, line }) => ({ line, text: specifier }))
}

describe('the repository rules', () => {
  it('reads the source tree (so every rule below is searching something)', () => {
    expect(sources.length).toBeGreaterThan(80)
    expect(sources.some(({ path }) => path === '/src/features/receipt_form/ui/receipt_wizard.tsx')).toBe(true)
  })

  it('keeps field values out of useState in the step files (criterion 38)', () => {
    const steps = sources.filter(({ path }) => path.startsWith('/src/features/receipt_form/ui/steps/'))
    expect(steps.length).toBeGreaterThanOrEqual(4)

    const uses = steps.flatMap(({ path, code }) =>
      [...code.matchAll(/const \[(\w+),[^\]]*\]\s*=\s*useState/g)].map((match) => `${path}:${match[1]}`),
    )
    // The one allowed use is a focus request after Add item. It is not a field value.
    expect(uses).toEqual(['/src/features/receipt_form/ui/steps/items_step.tsx:focus_request'])
    expect(offenders(/\buseState\b/, (path) => !path.includes('/steps/'))).toEqual([
      '/src/features/receipt_form/ui/steps/items_step.tsx',
    ])
  })

  it('has no raw <input> or <textarea> outside the shadcn primitives', () => {
    expect(with_hits(find_raw_form_elements)).toEqual([
      '/src/shared/ui/input.tsx',
      '/src/shared/ui/textarea.tsx',
    ])
  })

  it('has no arbitrary w-, h- or size- value outside icons (criterion 68)', () => {
    // CLAUDE.md allows max-w-* and max-h-* and fixed sizes on icons, so neither is flagged.
    // dropdown_menu.tsx is generated shadcn code from before this feature.
    expect(with_hits(find_arbitrary_dimensions, (path) => path === '/src/shared/ui/dropdown_menu.tsx')).toEqual([])
  })

  it('has no fixed pixel width or height in inline styles', () => {
    expect(with_hits(find_fixed_pixel_styles)).toEqual([])
  })

  it('has no `any` type', () => {
    expect(with_hits(find_any_types)).toEqual([])
  })

  it('takes icons only from react-icons, and lucide-react only inside shadcn primitives', () => {
    const outside_primitives = (path: string) => path.startsWith('/src/shared/ui/')
    expect(with_hits(imports_matching(/^lucide-react$/), outside_primitives)).toEqual([])
    expect(with_hits(imports_matching(/^(?:@heroicons|@radix-ui\/react-icons|@tabler|phosphor|@fortawesome)/))).toEqual([])
  })

  it('uses react-hot-toast and no other toast library', () => {
    expect(with_hits(imports_matching(/^(?:sonner|react-toastify|react-toast)/))).toEqual([])
  })

  it('creates the money formatter in exactly one source file (criterion 13)', () => {
    expect(with_hits(find_intl_number_format)).toEqual(['/src/shared/lib/format_currency.ts'])
  })

  it('does not format money with toFixed or toLocaleString', () => {
    expect(with_hits(find_hand_rolled_money)).toEqual([])
  })

  it('keeps shared/ from importing upward (FSD)', () => {
    expect(
      with_hits(
        imports_matching(/^@\/(?:features|entities|widgets|pages|app)\b/),
        (path) => !path.startsWith('/src/shared/'),
      ),
    ).toEqual([])
  })

  it('keeps one widget, feature or page slice from importing another on its layer (FSD)', () => {
    expect(with_hits(find_sibling_slice_imports)).toEqual([])
  })

  it('uses no colour literal or palette shade outside index.css', () => {
    expect(with_hits(find_colour_literals)).toEqual([])
  })

  it('uses no transition-all and no ease-in', () => {
    expect(with_hits(find_banned_motion)).toEqual([])
  })

  it('names every file in snake_case', () => {
    const bad = Object.keys(modules).filter((path) => {
      const file = path.split('/').pop() ?? ''
      return !/^[a-z][a-z0-9_]*(?:\.test|\.d)?\.tsx?$/.test(file)
    })
    expect(bad).toEqual([])
  })

  it('declares no interface outside the router module augmentation', () => {
    expect(with_hits(find_interfaces)).toEqual(['/src/app/router.tsx'])
  })
})
