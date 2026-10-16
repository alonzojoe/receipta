import { describe, expect, it } from 'vitest'

import { build_export_filename } from './export_filename'

describe('build_export_filename', () => {
  it('is receipta, the receipt number and the extension', () => {
    expect(build_export_filename('REF-20261016-154212', 'pdf')).toBe('receipta-REF-20261016-154212.pdf')
    expect(build_export_filename('REF-20261016-154212', 'png')).toBe('receipta-REF-20261016-154212.png')
  })

  it('differs between the pair only by the extension', () => {
    const stem = (name: string) => name.replace(/\.(pdf|png)$/, '')
    expect(stem(build_export_filename('REF-1', 'pdf'))).toBe(stem(build_export_filename('REF-1', 'png')))
  })

  it('lets no separator, dot, space or non-ASCII character through', () => {
    expect(build_export_filename('../x/ñ', 'pdf')).toBe('receipta-x.pdf')
    expect(build_export_filename('a\\b c.d', 'png')).toBe('receipta-abcd.png')
    for (const hostile of ['../../etc/passwd', 'C:\\Windows', 'ñandú 山田', 'a\u0000b', '%2e%2e']) {
      expect(build_export_filename(hostile, 'pdf')).toMatch(/^receipta-[A-Za-z0-9-]+\.pdf$/)
    }
  })

  it('falls back when nothing usable is left', () => {
    expect(build_export_filename('', 'pdf')).toBe('receipta-receipt.pdf')
    expect(build_export_filename('山田/../', 'png')).toBe('receipta-receipt.png')
    expect(build_export_filename('---', 'png')).toBe('receipta-receipt.png')
  })

  it('trims hyphens left at the ends by the stripping', () => {
    expect(build_export_filename('-/REF-1/-', 'pdf')).toBe('receipta-REF-1.pdf')
  })

  it('caps a very long number', () => {
    expect(build_export_filename('A'.repeat(500), 'pdf')).toBe(`receipta-${'A'.repeat(60)}.pdf`)
  })

  it('takes only the receipt number: a party name cannot reach it by construction', () => {
    // @ts-expect-error a second argument of that kind is not accepted
    build_export_filename('REF-1', 'Maria Santos', 'pdf')
    expect(build_export_filename.length).toBe(2)
  })
})
