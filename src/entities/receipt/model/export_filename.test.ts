import { describe, expect, it } from 'vitest'

import { build_export_filename } from './export_filename'

/** 27 October 2026, 10:20:45 local. The author's example stamp. */
const at = (iso: string) => new Date(iso)
const now = at('2026-10-27T10:20:45')

describe('build_export_filename', () => {
  it('names the file for the recipient, in snake_case, with the moment of export', () => {
    expect(build_export_filename('Joe', 'pdf', now)).toBe('joe_receipt_10272026102045.pdf')
    expect(build_export_filename('Joe', 'png', now)).toBe('joe_receipt_10272026102045.png')
  })

  it('reduces a full name to one snake_case word', () => {
    expect(build_export_filename('Juan Dela Cruz', 'pdf', now)).toBe(
      'juan_dela_cruz_receipt_10272026102045.pdf',
    )
  })

  /**
   * Everything outside a-z and 0-9 becomes a separator, so no dot, slash, space or
   * non-ASCII character can reach a path. A name is user input, and the one place it must
   * never be trusted is a filename.
   */
  it.each([
    ['Mabini Print Shop, Inc.', 'mabini_print_shop_inc'],
    ['../../etc/passwd', 'etc_passwd'],
    ['Store #7 & Co', 'store_7_co'],
    ['  padded  ', 'padded'],
    ['O’Brien', 'o_brien'],
    ['Ana   María', 'ana_mar_a'],
  ])('makes %s safe as %s', (name, expected) => {
    expect(build_export_filename(name, 'pdf', now)).toBe(`${expected}_receipt_10272026102045.pdf`)
  })

  it('has no path separator, space, dot or non-ASCII character in the stem', () => {
    const name = build_export_filename('../a b/c\\d:e*f?"g<h>i|j', 'pdf', now)
    expect(name.slice(0, name.lastIndexOf('.'))).toMatch(/^[a-z0-9_]+$/)
  })

  /**
   * A name in a non-Latin script reduces to nothing, which is why the caller cannot trust
   * the snake form to be usable. The file still needs a name.
   */
  it.each([['', 'empty'], ['   ', 'whitespace'], ['日本語', 'a non-Latin script'], ['!!!', 'punctuation only']])(
    'falls back to a plain receipt name when the recipient is %s',
    (recipient) => {
      expect(build_export_filename(recipient, 'pdf', now)).toBe('receipt_10272026102045.pdf')
    },
  )

  it('pads every part of the stamp, so the length never varies', () => {
    expect(build_export_filename('Joe', 'pdf', at('2026-01-02T03:04:05'))).toBe(
      'joe_receipt_01022026030405.pdf',
    )
  })

  /**
   * The stamp is the moment of EXPORT, not the receipt's date. Two exports of the same
   * receipt get different names rather than one silently replacing the other in a
   * downloads folder.
   */
  it('changes between two exports of the same receipt', () => {
    const first = build_export_filename('Joe', 'pdf', at('2026-10-27T10:20:45'))
    const second = build_export_filename('Joe', 'pdf', at('2026-10-27T10:20:46'))
    expect(first).not.toBe(second)
  })

  it('caps a very long name, and leaves no trailing separator before the suffix', () => {
    const name = build_export_filename('x'.repeat(200), 'pdf', now)
    expect(name).toBe(`${'x'.repeat(40)}_receipt_10272026102045.pdf`)
    expect(name).not.toMatch(/__/)
  })

  it('caps a long name that would otherwise end mid-separator', () => {
    const name = build_export_filename(`${'a'.repeat(39)} tail`, 'pdf', now)
    expect(name.startsWith(`${'a'.repeat(39)}_receipt_`)).toBe(true)
  })
})
