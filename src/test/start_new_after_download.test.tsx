import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExportDependencies } from '@/features/receipt_export'
import type { ExportPorts } from '@/features/receipt_export/model/export_ports'
import { draft_storage_key } from '@/shared/config/draft_storage_key'
import { make_valid_values } from '@/test/receipt_fixtures'
import { render_form, seed_draft } from '@/test/receipt_form_harness'

/**
 * The export itself is stubbed down to its outcome: this is about what happens AFTER a file
 * is saved, not about making one. `run` is the seam the hook already takes.
 */
function deps(outcome: 'saved' | 'failed'): ExportDependencies {
  return {
    load_ports: async () => ({}) as ExportPorts,
    run: async (kind) => {
      if (outcome === 'failed') throw new Error('export failed')
      return { filename: `receipt.${kind}`, warnings: [] }
    },
  }
}

const dialog = () => screen.queryByRole('alertdialog')
const download = (kind: 'PDF' | 'image') => screen.getByRole('button', { name: `Download ${kind}` })
const keep = () => screen.getByRole('button', { name: /keep this receipt/i })

beforeEach(() => {
  localStorage.clear()
})

/**
 * Someone who has just downloaded their receipt is usually finished with it, and the form
 * otherwise keeps everything - so the next receipt starts with the last one's items,
 * amounts and photos still in place.
 *
 * The rules worth testing are the restraints, not the offer: never after a failure, and
 * never twice for the same work. A dialog people dismiss by reflex stops being read.
 */
describe('the offer to start a new receipt', () => {
  it.each(['PDF', 'image'] as const)('appears after a successful %s download', async (kind) => {
    seed_draft(4, make_valid_values())
    const { user } = render_form(undefined, deps('saved'))

    expect(dialog()).toBeNull()
    await user.click(download(kind))

    await waitFor(() => expect(dialog()).toBeInTheDocument())
    expect(dialog()).toHaveTextContent('Your file is saved')
  })

  /**
   * The worst possible timing: a failed export leaves the user with nothing, and offering
   * to clear their work at that moment would be the application kicking them.
   */
  it.each(['PDF', 'image'] as const)('never appears after a failed %s download', async (kind) => {
    seed_draft(4, make_valid_values())
    const { user } = render_form(undefined, deps('failed'))

    await user.click(download(kind))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(dialog()).toBeNull()
  })

  /** Every saved file asks, on the author's instruction - including the second of a pair. */
  it('asks again after the second download', async () => {
    seed_draft(4, make_valid_values())
    const { user } = render_form(undefined, deps('saved'))

    await user.click(download('PDF'))
    await waitFor(() => expect(dialog()).toBeInTheDocument())
    await user.click(keep())
    await waitFor(() => expect(dialog()).toBeNull())

    await user.click(download('image'))
    await waitFor(() => expect(dialog()).toBeInTheDocument())
  })

  it('keeps every field and the stored draft when the receipt is kept', async () => {
    seed_draft(4, make_valid_values({ recipient_name: 'Maria Santos' }))
    const { user } = render_form(undefined, deps('saved'))
    const stored_before = localStorage.getItem(draft_storage_key)

    await user.click(download('PDF'))
    await waitFor(() => expect(dialog()).toBeInTheDocument())
    await user.click(keep())

    await waitFor(() => expect(dialog()).toBeNull())
    expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0)
    expect(localStorage.getItem(draft_storage_key)).toBe(stored_before)
  })

  /**
   * `queryByText` does not see an input's VALUE, so asserting the name is gone from the
   * document proves almost nothing on a form - it would pass while every field still held
   * its text. This checks the field, the stored draft and the step.
   */
  it('clears the form, the stored draft and the step when a new receipt is started', async () => {
    seed_draft(4, make_valid_values({ recipient_name: 'Maria Santos' }))
    const { user } = render_form(undefined, deps('saved'))
    expect(localStorage.getItem(draft_storage_key)).not.toBeNull()

    await user.click(download('PDF'))
    await waitFor(() => expect(dialog()).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /start a new receipt/i }))
    await waitFor(() => expect(dialog()).toBeNull())

    // Back at the first step, with the field itself empty rather than merely absent.
    // The timeline renders at two widths, so the label appears more than once.
    await waitFor(() => expect(screen.getAllByText(/step 1 of 4/i).length).toBeGreaterThan(0))
    const recipient = document.querySelector('input[name="recipient_name"]') as HTMLInputElement
    expect(recipient, 'no recipient field on step 1').not.toBeNull()
    expect(recipient.value).toBe('')
    expect(localStorage.getItem(draft_storage_key)).toBeNull()
  })

  it('is an alert dialog carrying its own title and description', async () => {
    seed_draft(4, make_valid_values())
    const { user } = render_form(undefined, deps('saved'))

    await user.click(download('PDF'))
    await waitFor(() => expect(dialog()).toBeInTheDocument())

    const box = dialog() as HTMLElement
    expect(box).toHaveAccessibleName(/start a new receipt/i)
    expect(box).toHaveAccessibleDescription(/your file is saved/i)
  })

  /** The copy leads with the reassurance, because "clears" seconds after a download reads
   *  for a moment as though it might delete the file. */
  it('says the download is safe before it says anything is cleared', async () => {
    seed_draft(4, make_valid_values())
    const { user } = render_form(undefined, deps('saved'))

    await user.click(download('PDF'))
    await waitFor(() => expect(dialog()).toBeInTheDocument())

    const text = dialog()?.textContent ?? ''
    expect(text.indexOf('file is saved')).toBeLessThan(text.indexOf('clears'))
    // Names the photos, which is the part someone would be annoyed to re-attach.
    expect(text).toContain('photos')
  })
})

vi.mock('@/features/receipt_export/lib/load_ports', () => ({ load_ports: vi.fn() }))
