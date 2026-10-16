import { describe, expect, expectTypeOf, it } from 'vitest'

import { build_receipt_view, type ReceiptInput } from '@/entities/receipt'

import { make_valid_values } from '@/test/receipt_fixtures'

import type { ReceiptFormValues } from './receipt_form_values'

describe('ReceiptInput', () => {
  it('is satisfied by the form values with no conversion', () => {
    // Checked by `tsc -b` (npm run build): a field renamed on either side breaks the build.
    expectTypeOf<ReceiptFormValues>().toExtend<ReceiptInput>()
    const input: ReceiptInput = make_valid_values()
    expect(input.items).toHaveLength(1)
  })
})

describe('the document view and party type (criterion 3)', () => {
  it('is deep-equal for Individual and Organization with the same names', () => {
    const individual = make_valid_values({ issuer_type: 'individual', recipient_type: 'individual' })
    const organization = make_valid_values({ issuer_type: 'organization', recipient_type: 'organization' })
    expect(build_receipt_view(organization)).toEqual(build_receipt_view(individual))
  })
})
