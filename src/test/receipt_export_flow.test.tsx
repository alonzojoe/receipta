import { act, screen, waitFor } from '@testing-library/react'
import toast from 'react-hot-toast'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExportDependencies } from '@/features/receipt_export'
import type { ExportPorts, RenderedCanvas } from '@/features/receipt_export/model/export_ports'
import { make_item, make_valid_values } from '@/test/receipt_fixtures'
import { read_stored_draft, render_form, seed_draft, whole_flow_timeout } from '@/test/receipt_form_harness'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

/*
 * The whole flow, the way a user meets it: the wizard walked from step 1 to Review, then the
 * real panel, the real `run_export` and the real off-screen mount, with only the two
 * libraries and the DOM measurements (jsdom has no layout) stubbed. The unit tests cover each
 * piece; these two prove the pieces are wired to each other and to the form.
 */

const values = make_valid_values({
  issuer_name: 'Maria Clara',
  items: [make_item({ id: 'a', name: 'Logo design', price: '1,500' }), make_item({ id: 'b', name: 'Printing', price: '50.25' })],
})

const heading = () => screen.getAllByRole('heading', { level: 2 })[0]
const button = (name: string | RegExp) => screen.getByRole('button', { name })

/** A canvas that looks like a painted receipt: white margin rows, ink in between. */
function make_canvas(): RenderedCanvas {
  return {
    width: 1200,
    height: 800,
    to_blob: vi.fn(async () => new Blob(['png-bytes'])),
    read_strip: vi.fn((top: number, rows: number) => {
      const bytes = new Uint8ClampedArray(rows * 1200 * 4).fill(255)
      if (top <= 100 && 100 < top + rows) bytes.set([15, 23, 42, 255], (100 - top) * 4 * 1200)
      return bytes
    }),
    release: vi.fn(),
  }
}

/** jsdom lays nothing out, so the heights the pipeline reads are stubbed; everything else is real. */
function make_dependencies(ports: ExportPorts): ExportDependencies {
  return {
    load_ports: async () => ports,
    env: {
      wait: async () => [],
      measure_document: () => 900,
      measure_page: () => 700,
      measure_units: () => ({
        ok: true,
        units: { first_head: 260, continuation_head: 71, foot_band: 53, indicator: 0, tail: 300, totals: 130, rows: [36, 36] },
      }),
    },
  }
}

function open_review(dependencies: ExportDependencies) {
  seed_draft(1, values)
  return render_form(undefined, dependencies)
}

async function walk_to_review(user: ReturnType<typeof render_form>['user']) {
  for (const step of ['Items', 'Payment', 'Review']) {
    await user.click(button('Next'))
    expect(heading()).toHaveTextContent(step)
  }
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the whole export flow', () => {
  it(
    'walks the wizard to Review, downloads the PDF and then the image, and leaves the form as it was',
    async () => {
      let release!: (canvas: RenderedCanvas) => void
      const pending = new Promise<RenderedCanvas>((resolve) => (release = resolve))
      const ports: ExportPorts = {
        rasterise: vi.fn().mockReturnValueOnce(pending).mockImplementation(async () => make_canvas()),
        assemble_pdf: vi.fn(async () => new Blob(['pdf-bytes'])),
        save: vi.fn(),
      }
      const { user } = open_review(make_dependencies(ports))
      await walk_to_review(user)
      const preview = () => screen.getByRole('region', { name: 'Receipt preview' }).textContent
      const before = preview()

      await user.click(button('Download PDF'))

      // Busy: the running button says so and both are unavailable while the canvas is made.
      const running = await screen.findByRole('button', { name: 'Preparing PDF...' })
      expect(running).toHaveAttribute('aria-busy', 'true')
      expect(running).toHaveAttribute('aria-disabled', 'true')
      expect(button('Download image')).toBeDisabled()
      expect(ports.save).not.toHaveBeenCalled()

      await act(async () => release(make_canvas()))

      // Handed over under the right name, then said so, once, in the toast and the live region.
      await waitFor(() => expect(ports.save).toHaveBeenCalledTimes(1))
      expect(vi.mocked(ports.save).mock.calls[0][1]).toMatch(new RegExp(String.raw`_receipt_\d{14}\.pdf$`))
      expect(vi.mocked(ports.save).mock.calls[0][0]).toBeInstanceOf(Blob)

      // A saved file offers a fresh start, and that dialog locks the page behind it, so it
      // is dismissed before anything else is read. Keeping the receipt changes nothing.
      await user.click(await screen.findByRole('button', { name: /keep this receipt/i }))
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())

      await waitFor(() => expect(button('Download PDF')).toBeEnabled())
      expect(toast.success).toHaveBeenCalledWith('PDF created')
      expect(screen.getAllByRole('status').some((node) => node.textContent === 'PDF created')).toBe(true)
      expect(screen.queryByRole('alert')).toBeNull()

      await user.click(button('Download image'))
      await waitFor(() => expect(ports.save).toHaveBeenCalledTimes(2))
      expect(vi.mocked(ports.save).mock.calls[1][1]).toMatch(new RegExp(String.raw`_receipt_\d{14}\.png$`))
      await waitFor(() => expect(toast.success).toHaveBeenLastCalledWith('Image created'))

      // A saved file offers a fresh start; that dialog locks the page behind it, so it is
      // dismissed before carrying on. Keeping the receipt changes nothing.
      await user.click(await screen.findByRole('button', { name: /keep this receipt/i }))
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())

      // Exporting changed nothing: the same step, the same document text (receipt number
      // included), and the stored draft still holds exactly the values that were entered.
      expect(heading()).toHaveTextContent('Review')
      expect(preview()).toBe(before)
      await waitFor(() => expect(read_stored_draft()?.values).toEqual(values))
    },
    whole_flow_timeout,
  )

  it(
    'shows the alert and a toast when the rasteriser fails, saves nothing, and Back and Edit still work',
    async () => {
      const ports: ExportPorts = {
        rasterise: vi.fn(async () => {
          throw new Error('canvas exploded')
        }),
        assemble_pdf: vi.fn(),
        save: vi.fn(),
      }
      const { user } = open_review(make_dependencies(ports))
      await walk_to_review(user)

      await user.click(button('Download image'))

      const message = 'The file could not be created. Your receipt is safe. Try again.'
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(toast.error).toHaveBeenCalledWith(message)
      expect(ports.save).not.toHaveBeenCalled()
      expect(button('Download PDF')).toBeEnabled()
      expect(button('Download image')).toBeEnabled()
      expect(screen.queryByRole('button', { name: /Preparing/ })).toBeNull()

      // Back goes to Payment with the data intact, and the Edit row reaches the other steps.
      await user.click(button('Back'))
      expect(heading()).toHaveTextContent('Payment')
      await user.click(button('Next'))
      expect(heading()).toHaveTextContent('Review')
      await user.click(button('Edit items'))
      expect(heading()).toHaveTextContent('Items')
      expect(document.querySelector<HTMLInputElement>('[name="items[0].name"]')?.value).toBe('Logo design')
      await waitFor(() => expect(read_stored_draft()?.values).toEqual(values))
    },
    whole_flow_timeout,
  )
})
