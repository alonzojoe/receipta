import { describe, expect, it } from 'vitest'

/**
 * Repository rules from CLAUDE.md and the receipt form spec, checked against the source
 * text. Each one is a search that must come back empty (or come back with exactly the
 * known exceptions), so a violation fails here instead of waiting for a reviewer to
 * notice it.
 *
 * Source is read with Vite's glob import so the app tsconfig does not need Node types.
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

function offenders(pattern: RegExp, skip: (path: string) => boolean = () => false) {
  return sources.filter(({ path, code }) => !skip(path) && pattern.test(code)).map(({ path }) => path)
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
    expect(offenders(/<(input|textarea)[\s>/]/)).toEqual([
      '/src/shared/ui/input.tsx',
      '/src/shared/ui/textarea.tsx',
    ])
  })

  it('has no arbitrary w-, h-, size- or min/max dimension values (criterion 68)', () => {
    // dropdown_menu.tsx is generated shadcn code from before this feature.
    const found = offenders(/(?<![\w-])(?:min-|max-)?(?:w|h|size)-\[/, (path) => path === '/src/shared/ui/dropdown_menu.tsx')
    expect(found).toEqual([])
  })

  it('has no fixed pixel width or height in inline styles', () => {
    expect(offenders(/(?:width|height)\s*:\s*['"`]?\d+px/)).toEqual([])
  })

  it('has no `any` type', () => {
    expect(offenders(/(?::\s*any\b|\bas any\b|<any>|\bany\[\]|Array<any>)/)).toEqual([])
  })

  it('takes icons only from react-icons, and lucide-react only inside shadcn primitives', () => {
    const outside_primitives = (path: string) => path.startsWith('/src/shared/ui/')
    expect(offenders(/from ['"]lucide-react['"]/, outside_primitives)).toEqual([])
    expect(offenders(/from ['"](?:@heroicons|@radix-ui\/react-icons|@tabler|phosphor|@fortawesome)/)).toEqual([])
  })

  it('uses react-hot-toast and no other toast library', () => {
    expect(offenders(/from ['"](?:sonner|react-toastify|react-toast)/)).toEqual([])
  })

  it('creates the money formatter in exactly one source file (criterion 13)', () => {
    expect(offenders(/Intl\.NumberFormat/, () => false)).toEqual(['/src/shared/lib/format_currency.ts'])
  })

  it('does not format money with toFixed or toLocaleString', () => {
    expect(offenders(/\.(?:toFixed|toLocaleString)\s*\(/)).toEqual([])
  })

  it('keeps shared/ from importing upward (FSD)', () => {
    expect(
      offenders(
        /from ['"]@\/(?:features|entities|widgets|pages|app)\b/,
        (path) => !path.startsWith('/src/shared/'),
      ),
    ).toEqual([])
  })

  it('names every file in snake_case', () => {
    const bad = Object.keys(modules).filter((path) => {
      const file = path.split('/').pop() ?? ''
      return !/^[a-z][a-z0-9_]*(?:\.test|\.d)?\.tsx?$/.test(file)
    })
    expect(bad).toEqual([])
  })

  it('declares no interface outside the router module augmentation', () => {
    expect(offenders(/^\s*(?:export\s+)?interface\s/m)).toEqual(['/src/app/router.tsx'])
  })
})
