import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExportFailure } from '../model/export_errors'
import type { ExportPorts } from '../model/export_ports'
import type { ExportOutcome } from '../model/run_export'
import type { ExportDependencies } from '../model/use_receipt_export'
import { make_input } from '@/test/document_fixtures'

import { ReceiptExportPanel } from './receipt_export_panel'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const viewport_html = Object.values(
  import.meta.glob('/index.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
)[0]

type Deferred = { promise: Promise<ExportOutcome>; resolve: (outcome?: Partial<ExportOutcome>) => void; reject: (cause: unknown) => void }

function deferred(): Deferred {
  let resolve!: Deferred['resolve']
  let reject!: Deferred['reject']
  const promise = new Promise<ExportOutcome>((res, rej) => {
    resolve = (outcome) => res({ filename: 'receipta-REF-x.pdf', warnings: [], ...outcome })
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup(run: ExportDependencies['run'], load_ports?: ExportDependencies['load_ports']) {
  const ports: ExportPorts = { rasterise: vi.fn(), assemble_pdf: vi.fn(), save: vi.fn() }
  const dependencies: ExportDependencies = { load_ports: load_ports ?? vi.fn(async () => ports), run }
  const user = userEvent.setup()
  const values = make_input()
  const view = render(<ReceiptExportPanel values={values} dependencies={dependencies} />)
  return { user, dependencies, ...view }
}

const pdf = () => screen.getByRole('button', { name: /PDF/ })
const image = () => screen.getByRole('button', { name: /image/ })

beforeEach(() => {
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the buttons (criteria 56, 57)', () => {
  it('are two real buttons that do not submit the wizard form', () => {
    setup(vi.fn())
    expect(pdf()).toHaveTextContent('Download PDF')
    expect(image()).toHaveTextContent('Download image')
    for (const button of [pdf(), image()]) expect(button).toHaveAttribute('type', 'button')
    expect(pdf().className).toContain('min-h-11')
    expect(image().className).toContain('min-h-11')
  })

  it('stack full width below 640 and sit side by side from there', () => {
    setup(vi.fn())
    const row = pdf().parentElement as HTMLElement
    expect(row.className).toContain('flex-col')
    expect(row.className).toContain('sm:flex-row')
    expect(pdf().className).toContain('w-full')
    expect(pdf().className).toContain('sm:w-auto')
  })

  it('show the running label, aria-busy and keep focus; the other is disabled; a second click is ignored', async () => {
    const pending = deferred()
    const run = vi.fn(() => pending.promise)
    const { user } = setup(run)
    pdf().focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(pdf()).toHaveTextContent('Preparing PDF...'))
    expect(pdf()).toHaveAttribute('aria-busy', 'true')
    expect(pdf()).toHaveAttribute('aria-disabled', 'true')
    expect(document.activeElement).toBe(pdf())
    expect(image()).toBeDisabled()
    expect(image()).toHaveTextContent('Download image')

    await user.click(pdf())
    await user.click(image())
    expect(run).toHaveBeenCalledTimes(1)

    await act(async () => pending.resolve())
    await waitFor(() => expect(pdf()).toHaveTextContent('Download PDF'))
    expect(pdf()).not.toHaveAttribute('aria-busy')
    expect(image()).toBeEnabled()
  })

  it('label the image export Preparing image...', async () => {
    const pending = deferred()
    const { user } = setup(vi.fn(() => pending.promise))
    await user.click(image())
    await waitFor(() => expect(image()).toHaveTextContent('Preparing image...'))
    expect(pdf()).toBeDisabled()
    await act(async () => pending.resolve())
  })

  it('ignores a second click in the same tick', async () => {
    const pending = deferred()
    const run = vi.fn(() => pending.promise)
    setup(run)
    act(() => {
      pdf().click()
      pdf().click()
    })
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(run).toHaveBeenCalledTimes(1)
    await act(async () => pending.resolve())
  })
})

describe('success (criterion 58)', () => {
  it('shows a toast and the same text in a polite live region', async () => {
    const { user, dependencies } = setup(vi.fn(async () => ({ filename: 'a.pdf', warnings: [] })))
    await user.click(pdf())
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('PDF created'))
    expect(screen.getByRole('status')).toHaveTextContent('PDF created')
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(dependencies.run).toHaveBeenCalledWith('pdf', expect.objectContaining({ issuer: 'Mabini Print Shop' }), expect.anything(), undefined)
    await user.click(image())
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Image created'))
    expect(screen.getByRole('status')).toHaveTextContent('Image created')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('adds the logo that could not be loaded, to the toast and the live region alike', async () => {
    const { user } = setup(vi.fn(async () => ({ filename: 'a.png', warnings: ['The GCash logo could not be loaded.'] })))
    await user.click(image())
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Image created The GCash logo could not be loaded.'))
    expect(screen.getByRole('status')).toHaveTextContent('Image created The GCash logo could not be loaded.')
  })

  it('hands the export the view the preview shows (criterion 51)', async () => {
    const { user, dependencies } = setup(vi.fn(async () => ({ filename: 'a.pdf', warnings: [] })))
    await user.click(pdf())
    const view = vi.mocked(dependencies.run!).mock.calls[0][1]
    const preview = screen.getByRole('region', { name: 'Receipt preview' })
    expect(preview).toHaveTextContent(view.paid_line ?? 'missing')
    expect(preview).toHaveTextContent(view.receipt_no)
  })
})

describe('failure (criteria 62, 67)', () => {
  it('shows a persistent alert and a toast, and re-enables both buttons', async () => {
    const { user } = setup(vi.fn(async () => { throw new Error('boom') }))
    await user.click(pdf())
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The file could not be created. Your receipt is safe. Try again.')
    expect(toast.error).toHaveBeenCalledWith('The file could not be created. Your receipt is safe. Try again.')
    expect(pdf()).toBeEnabled()
    expect(image()).toBeEnabled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })

  it('names the cause: an unreadable photo, a canvas too large, a timeout', async () => {
    const causes: [unknown, RegExp][] = [
      [new ExportFailure({ kind: 'photo_unreadable', item: 3 }), /photo for item 3 could not be read/],
      [new ExportFailure({ kind: 'too_large' }), /too large to make as an image/],
      [new ExportFailure({ kind: 'timed_out' }), /took too long/],
    ]
    for (const [cause, message] of causes) {
      const { user, unmount } = setup(vi.fn(async () => { throw cause }))
      await user.click(image())
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      unmount()
    }
  })

  it('stays until the next attempt starts, does not clear on its own, then clears', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const pending = deferred()
    const run = vi.fn<NonNullable<ExportDependencies['run']>>()
    run.mockRejectedValueOnce(new Error('boom'))
    run.mockReturnValueOnce(pending.promise)
    const { user, rerender, dependencies } = setup(run)
    await user.click(pdf())
    await screen.findByRole('alert')
    await act(async () => { vi.advanceTimersByTime(60_000) })
    rerender(<ReceiptExportPanel values={make_input()} dependencies={dependencies} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(pdf())
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    await act(async () => pending.resolve())
    vi.useRealTimers()
  })

  it('reports a failed library load, and tries the load again on the next click', async () => {
    const load = vi.fn<ExportDependencies['load_ports']>()
    load.mockRejectedValueOnce(new Error('chunk failed'))
    load.mockResolvedValueOnce({ rasterise: vi.fn(), assemble_pdf: vi.fn(), save: vi.fn() })
    const run = vi.fn(async () => ({ filename: 'a.pdf', warnings: [] as string[] }))
    const { user } = setup(run, load)
    await user.click(pdf())
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(run).not.toHaveBeenCalled()
    await user.click(pdf())
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('PDF created'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('loads the libraries once, on the first click only, and not at render', async () => {
    const load = vi.fn(async () => ({ rasterise: vi.fn(), assemble_pdf: vi.fn(), save: vi.fn() }))
    const { user } = setup(vi.fn(async () => ({ filename: 'a.pdf', warnings: [] as string[] })), load)
    expect(load).not.toHaveBeenCalled()
    await user.click(pdf())
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1))
    await user.click(image())
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(2))
    expect(load).toHaveBeenCalledTimes(1)
  })
})

describe('the preview scale (criteria 54, 55)', () => {
  const widths = { value: 300 }
  let original_width: PropertyDescriptor | undefined
  let original_height: PropertyDescriptor | undefined

  beforeEach(() => {
    original_width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    original_height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => widths.value })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 1000 })
  })

  afterEach(() => {
    if (original_width) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', original_width)
    if (original_height) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original_height)
  })

  function frame() {
    return document.querySelector('.receipt-preview-frame') as HTMLElement
  }

  it('shrinks to fit under 600 and gives the frame the scaled height, with no pixel size inline', () => {
    widths.value = 300
    setup(vi.fn())
    expect(frame().style.getPropertyValue('--scale')).toBe('0.5')
    expect(frame().style.getPropertyValue('--doc-width')).toBe('600')
    expect(frame().style.getPropertyValue('--doc-height')).toBe('1000')
    expect(frame().style.width).toBe('')
    expect(frame().style.height).toBe('')
  })

  it.each([600, 700, 768, 1280])('is 100%% at a container of %d and never above', (width) => {
    widths.value = width
    setup(vi.fn())
    expect(frame().style.getPropertyValue('--scale')).toBe('1')
  })

  it('renders the same document the export captures, as one component', () => {
    widths.value = 700
    setup(vi.fn())
    const sheet = document.querySelector('.receipt-preview-sheet') as HTMLElement
    expect(sheet.querySelectorAll('.receipt-document')).toHaveLength(1)
  })
})

describe('the viewport (criterion 55)', () => {
  it('does not disable pinch zoom', () => {
    const meta = viewport_html.match(/<meta[^>]*name="viewport"[^>]*>/)?.[0] ?? ''
    expect(meta).toContain('initial-scale=1.0')
    expect(meta).not.toMatch(/user-scalable\s*=\s*(?:no|0)|maximum-scale/i)
  })
})
