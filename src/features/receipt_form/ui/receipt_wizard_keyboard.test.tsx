import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { make_export_dependencies, render_form, whole_flow_timeout } from '@/test/receipt_form_harness'

beforeEach(() => {
  localStorage.clear()
})

const heading = () => screen.getAllByRole('heading', { level: 2 })[0]

/** Presses Tab until the focused element satisfies `wanted`. Never touches a pointer. */
async function tab_to(user: ReturnType<typeof render_form>['user'], wanted: (element: Element) => boolean) {
  for (let presses = 0; presses < 40; presses += 1) {
    await user.tab()
    if (wanted(document.activeElement!)) return
  }
  throw new Error('Tab never reached the element')
}

const field_named = (name: string) => (element: Element) => element.getAttribute('name') === name
const button_named = (text: string) => (element: Element) =>
  element.tagName === 'BUTTON' && element.textContent?.trim() === text

describe('keyboard only', () => {
  it('completes the whole wizard from Parties to Review without a pointer', async () => {
    const export_dependencies = make_export_dependencies()
    const { user } = render_form(undefined, export_dependencies)

    // Parties: type both names, Enter advances.
    await tab_to(user, field_named('issuer_name'))
    await user.keyboard('Juan Dela Cruz')
    await tab_to(user, field_named('recipient_name'))
    await user.keyboard('Acme Trading{Enter}')
    expect(heading()).toHaveTextContent('Items')
    expect(document.activeElement).toBe(heading())

    // Items: name, (quantity is already 1), price. Add a second row with Enter on the button.
    await tab_to(user, field_named('items[0].name'))
    await user.keyboard('Logo design')
    await tab_to(user, field_named('items[0].price'))
    await user.keyboard('1500')
    await tab_to(user, button_named('Add item'))
    await user.keyboard('{Enter}')
    expect(heading()).toHaveTextContent('Items')
    expect(document.activeElement).toHaveAttribute('name', 'items[1].name')
    await user.keyboard('Printing')
    await tab_to(user, field_named('items[1].price'))
    await user.keyboard('20{Enter}')
    expect(heading()).toHaveTextContent('Payment')

    // Payment: open the picker, filter, choose; then the date and the notes.
    await tab_to(user, field_named('payment_method'))
    await user.keyboard('{Enter}')
    await user.keyboard('maya{Enter}')
    expect(screen.getByRole('combobox', { name: /Payment method/ })).toHaveTextContent('Maya')
    await tab_to(user, field_named('receipt_date'))
    await user.keyboard('2026-10-01')
    await tab_to(user, field_named('notes'))
    await user.keyboard('Thank you')
    await tab_to(user, button_named('Next'))
    await user.keyboard(' ')
    expect(heading()).toHaveTextContent('Review')

    // Review: everything typed is there, and Back is reachable.
    expect(document.body.textContent).toContain('Juan Dela Cruz')
    expect(document.body.textContent).toContain('Printing')
    expect(document.body.textContent).toContain('₱1,520.00')
    expect(document.body.textContent).toContain('Maya')
    // The receipt shows its date long, as it will be sent.
    expect(document.body.textContent).toContain('1 October 2026')
    expect(document.body.textContent).toContain('Thank you')

    // Both downloads are reachable by Tab and work with Enter, and Back is reachable after.
    await tab_to(user, button_named('Download PDF'))
    await user.keyboard('{Enter}')

    // A saved file offers a fresh start. The offer is keyboard-reachable too: it opens with
    // the keep action focused, so Enter alone dismisses it without touching the receipt.
    const keep = await screen.findByRole('button', { name: /keep this receipt/i })
    await waitFor(() => expect(keep).toHaveFocus())
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())

    await waitFor(() => expect(screen.getByRole('button', { name: 'Download image' })).toBeEnabled())
    await tab_to(user, button_named('Download image'))
    await user.keyboard('{Enter}')
    expect(export_dependencies.run.mock.calls.map(([kind]) => kind)).toEqual(['pdf', 'png'])

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    await tab_to(user, button_named('Back'))
  }, whole_flow_timeout)
})
