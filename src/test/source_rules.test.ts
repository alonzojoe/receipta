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
  find_dynamic_export_library_imports,
  find_sibling_slice_imports,
  find_static_export_library_imports,
} from './source_rules'

/**
 * Each detector must fire on a real violation and stay silent on text that only looks like
 * one. The second half is the point: a rule that cries wolf gets deleted.
 */
const tsx = '/src/features/example/ui/x.tsx'
const ts = '/src/features/example/model/x.ts'
const count = (hits: unknown[]) => hits.length

describe('find_any_types', () => {
  it.each([
    'const a: any = 1',
    'const a = b as any',
    'const a = <any>b',
    'let a: any[] = []',
    'let a: Array<any> = []',
    'function f(a: Record<string, any>) {}',
  ])('catches %s', (code) => {
    expect(count(find_any_types(ts, code))).toBe(1)
  })

  it.each([
    'const copy = "Note: any change is saved"',
    'const a = 1 // foo: any',
    '/* a: any */ const a = 1',
    'const jsx = <p>Note: any change is saved</p>',
    'const company: string = "any"',
    'type Anything = { anyone: string }',
  ])('ignores prose and look-alikes: %s', (code) => {
    expect(find_any_types(tsx, code)).toEqual([])
  })
})

describe('find_arbitrary_dimensions', () => {
  it.each([
    '<div className="w-[320px]" />',
    '<div className="sm:h-[5rem] p-2" />',
    '<div className={cn("flex", "size-[40px]")} />',
    '<div className={`w-[${x}px]`} />',
    '<Panel className="w-[10px]" />',
  ])('catches %s', (code) => {
    expect(count(find_arbitrary_dimensions(tsx, code))).toBe(1)
  })

  it.each([
    ['max-width, which CLAUDE.md allows', '<p className="max-w-[60ch]" />'],
    ['max-height, which CLAUDE.md allows', '<p className="max-h-[40rem]" />'],
    ['a min floor', '<p className="min-h-[2.75rem]" />'],
    ['a scale value', '<p className="w-11 h-auto size-4" />'],
    ['a fraction', '<p className="w-1/2" />'],
    ['an icon component', "import { LuX } from 'react-icons/lu'\nconst a = <LuX className=\"size-[18px]\" />"],
    ['an svg', '<svg className="size-[18px]" />'],
    ['prose in a comment', '// avoid w-[10px]\nconst a = 1'],
    ['prose in JSX text', '<p>Do not write w-[10px]</p>'],
  ])('allows %s', (_, code) => {
    expect(find_arbitrary_dimensions(tsx, code)).toEqual([])
  })
})

describe('find_fixed_pixel_styles', () => {
  it('catches an inline pixel width and height', () => {
    expect(count(find_fixed_pixel_styles(tsx, "<div style={{ width: '120px', height: '4px' }} />"))).toBe(2)
  })
  it('ignores a percentage, a comment and prose', () => {
    expect(find_fixed_pixel_styles(tsx, "<div style={{ width: '100%' }} />\n// width: 12px")).toEqual([])
  })
})

describe('find_hand_rolled_money and find_intl_number_format', () => {
  it('catches toFixed, toLocaleString and Intl.NumberFormat', () => {
    expect(count(find_hand_rolled_money(ts, 'const a = n.toFixed(2)'))).toBe(1)
    expect(count(find_hand_rolled_money(ts, 'const a = n.toLocaleString("en")'))).toBe(1)
    expect(count(find_intl_number_format(ts, 'const f = new Intl.NumberFormat("en-PH")'))).toBe(1)
  })
  it('ignores a trailing comment and a string that mention them', () => {
    expect(find_intl_number_format(ts, 'const a = 1 // uses Intl.NumberFormat')).toEqual([])
    expect(find_intl_number_format(ts, 'const a = "Intl.NumberFormat"')).toEqual([])
    expect(find_hand_rolled_money(ts, 'const a = 1 // never n.toFixed(2)')).toEqual([])
  })
})

describe('find_raw_form_elements and find_interfaces', () => {
  it('catches a lower-case input and textarea, and an interface', () => {
    expect(count(find_raw_form_elements(tsx, 'const a = <input />'))).toBe(1)
    expect(count(find_raw_form_elements(tsx, 'const a = <textarea></textarea>'))).toBe(1)
    expect(count(find_interfaces(ts, 'export interface A { a: string }'))).toBe(1)
  })
  it('ignores a component, prose and a type alias', () => {
    expect(find_raw_form_elements(tsx, 'const a = <AppInput />')).toEqual([])
    expect(find_raw_form_elements(tsx, '// <input> is wrapped\nconst a = <p>an {"<input>"} tag</p>')).toEqual([])
    expect(find_interfaces(ts, 'type A = { a: string } // interface A')).toEqual([])
  })
})

describe('find_banned_motion', () => {
  it.each(['transition-all', 'hover:transition-all duration-200', 'ease-in', 'ease-in duration-200'])(
    'catches %s',
    (classes) => {
      expect(count(find_banned_motion(tsx, `<div className="${classes}" />`))).toBe(1)
    },
  )
  it.each([
    '<div className="transition-colors ease-out" />',
    '<div className="transition-[opacity,transform] ease-in-out" />',
    '<div className="ease-in-out" />',
    '// ease-in is never used\nconst a = 1',
    '<p>ease-in is banned</p>',
  ])('allows %s', (code) => {
    expect(find_banned_motion(tsx, code)).toEqual([])
  })
})

describe('find_colour_literals', () => {
  it.each([
    'const a = "#ff8800"',
    'const a = "#FF880080"',
    '<div className="bg-[#fff]" />',
    'const a = "rgb(1 2 3)"',
    'const a = "oklch(0.7 0.1 200)"',
    '<div className="text-red-500" />',
    '<div className="dark:bg-slate-900" />',
  ])('catches %s', (code) => {
    expect(count(find_colour_literals(tsx, code))).toBe(1)
  })

  it.each([
    '<div className="bg-primary text-foreground border-border" />',
    '<div className="text-white" />',
    '<a href="#main">Skip</a>',
    'const id = "#add"',
    '// was #ff8800, now a token\nconst a = 1',
    '<p>Use oklch( values in index.css</p>',
    'const a = "red-500"',
  ])('allows %s', (code) => {
    expect(find_colour_literals(tsx, code)).toEqual([])
  })
})

describe('find_sibling_slice_imports', () => {
  const widget = '/src/widgets/site_header/ui/site_header.tsx'

  it('catches an alias import and a relative import of another widget', () => {
    expect(count(find_sibling_slice_imports(widget, "import { A } from '@/widgets/site_footer'"))).toBe(1)
    expect(count(find_sibling_slice_imports(widget, "import { A } from '../../site_footer/ui/a'"))).toBe(1)
    expect(count(find_sibling_slice_imports(widget, "export { A } from '@/widgets/site_footer/ui/a'"))).toBe(1)
  })

  it('catches one feature importing another', () => {
    const path = '/src/features/receipt_form/ui/a.tsx'
    expect(count(find_sibling_slice_imports(path, "import { A } from '@/features/theme_switcher'"))).toBe(1)
  })

  it.each([
    "import { A } from '@/shared/ui/button'",
    "import { A } from '@/entities/receipt'",
    "import { A } from './site_header_nav'",
    "import { A } from '../model/state'",
    "import { A } from '@/widgets/site_header/ui/other'",
    "import { A } from 'react'",
    "const a = 'import { A } from \"@/widgets/site_footer\"'",
  ])('allows %s', (code) => {
    expect(find_sibling_slice_imports(widget, code)).toEqual([])
  })

  it('does not apply to a page, which may compose widgets', () => {
    expect(find_sibling_slice_imports('/src/pages/home/ui/home.tsx', "import { A } from '@/widgets/site_header'")).toEqual([])
  })
})

describe('find_static_export_library_imports and find_dynamic_export_library_imports', () => {
  const path = '/src/features/receipt_export/lib/x.ts'

  it.each([
    "import html2canvas from 'html2canvas-pro'",
    "import { jsPDF } from 'jspdf'",
    "import type { jsPDF } from 'jspdf'",
    "import 'html2canvas-pro/dist/x'",
    "export { jsPDF } from 'jspdf'",
  ])('flags the static %s', (code) => {
    expect(count(find_static_export_library_imports(path, code))).toBe(1)
  })

  it.each([
    "const a = await import('jspdf')",
    "import { A } from 'react'",
    "import { A } from './jspdf_adapter'",
    "const a = 'import jsPDF from \"jspdf\"'",
    "// import jsPDF from 'jspdf'",
  ])('does not flag %s as static', (code) => {
    expect(find_static_export_library_imports(path, code)).toEqual([])
  })

  it('finds dynamic imports of either library, and not look-alikes', () => {
    expect(count(find_dynamic_export_library_imports(path, "await Promise.all([import('html2canvas-pro'), import('jspdf')])"))).toBe(2)
    expect(find_dynamic_export_library_imports(path, "await import('./jspdf_adapter')")).toEqual([])
    expect(find_dynamic_export_library_imports(path, "import { jsPDF } from 'jspdf'")).toHaveLength(1)
  })
})
