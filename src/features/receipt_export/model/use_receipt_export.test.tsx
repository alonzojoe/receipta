import { act, renderHook } from '@testing-library/react'
import toast from 'react-hot-toast'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { make_view } from '@/test/document_fixtures'

import { ExportFailure } from './export_errors'
import type { ExportPorts } from './export_ports'
import type { ExportOutcome } from './run_export'
import { useReceiptExport, type ExportDependencies } from './use_receipt_export'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const view = make_view()
const ports: ExportPorts = { rasterise: vi.fn(), assemble_pdf: vi.fn(), save: vi.fn() }
const outcome: ExportOutcome = { filename: 'receipta-REF-x.pdf', warnings: [] }
const never = () => new Promise<never>(() => undefined)

function setup(dependencies: Partial<ExportDependencies>) {
  return renderHook(() => useReceiptExport(view, { load_ports: async () => ports, ...dependencies }))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('a timed-out export keeps the guard until the abandoned work settles', () => {
  function timed_out(settled: Promise<void>) {
    return vi.fn().mockRejectedValueOnce(new ExportFailure({ kind: 'timed_out' }, settled)).mockResolvedValue(outcome)
  }

  it('ignores a second click while the first run still holds its canvas, then allows one', async () => {
    let settle!: () => void
    const run = timed_out(new Promise<void>((resolve) => (settle = resolve)))
    const { result } = setup({ run })

    act(() => result.current.start('pdf'))
    await act(() => vi.advanceTimersByTimeAsync(1))
    // The user has been told, but the old render is still running: still busy, clicks ignored.
    expect(toast.error).toHaveBeenCalledWith('Making the file took too long. Try again.')
    expect(result.current.busy).toBe('pdf')
    act(() => result.current.start('pdf'))
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(run).toHaveBeenCalledTimes(1)

    settle()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(result.current.busy).toBeNull()
    act(() => result.current.start('pdf'))
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('does not leave the button dead when the abandoned work never settles', async () => {
    const run = timed_out(never())
    const { result } = setup({ run, abandon_grace_ms: 10_000 })

    act(() => result.current.start('png'))
    await act(() => vi.advanceTimersByTimeAsync(9_999))
    expect(result.current.busy).toBe('png')
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(result.current.busy).toBeNull()
    act(() => result.current.start('png'))
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('releases at once for a failure that is not a timeout', async () => {
    const run = vi.fn().mockRejectedValue(new ExportFailure({ kind: 'blank' }))
    const { result } = setup({ run })
    act(() => result.current.start('png'))
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(result.current.busy).toBeNull()
  })
})

describe('loading the libraries is bounded', () => {
  const message = 'The export tools could not be loaded. Check your connection and try again.'

  it('fails with a specific message when the load stalls, and loads again on the next click', async () => {
    const load_ports = vi.fn<ExportDependencies['load_ports']>(never)
    const run = vi.fn().mockResolvedValue(outcome)
    const { result } = setup({ load_ports, run, load_timeout_ms: 15_000 })

    act(() => result.current.start('pdf'))
    await act(() => vi.advanceTimersByTimeAsync(14_999))
    expect(result.current.busy).toBe('pdf')
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(toast.error).toHaveBeenCalledWith(message)
    expect(result.current.busy).toBeNull()
    expect(run).not.toHaveBeenCalled()

    load_ports.mockResolvedValue(ports)
    act(() => result.current.start('pdf'))
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(load_ports).toHaveBeenCalledTimes(2)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('gives the same message when the chunk fails to load', async () => {
    const load_ports = vi.fn<ExportDependencies['load_ports']>().mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = setup({ load_ports, run: vi.fn() })
    act(() => result.current.start('pdf'))
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(toast.error).toHaveBeenCalledWith(message)
    expect(result.current.busy).toBeNull()
  })

  it('does not time a successful load against the export budget', async () => {
    const run = vi.fn().mockResolvedValue(outcome)
    const { result } = setup({ run, load_timeout_ms: 100 })
    act(() => result.current.start('pdf'))
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(run).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
  })
})
