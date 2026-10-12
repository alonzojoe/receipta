import { describe, expect, it } from 'vitest'

import { cn } from '@/shared/lib/utils'

describe('cn', () => {
  it('resolves conflicting tailwind utilities so the last one wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('bg-background', 'bg-card')).toBe('bg-card')
  })

  it('keeps non-conflicting utilities', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('ignores falsy values', () => {
    expect(cn('flex', undefined, null, false, '')).toBe('flex')
  })

  it('flattens arrays and conditional objects', () => {
    expect(cn(['flex', 'gap-2'], { hidden: false, 'text-sm': true })).toBe(
      'flex gap-2 text-sm',
    )
  })
})
