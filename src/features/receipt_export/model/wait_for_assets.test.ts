import { describe, expect, it, vi } from 'vitest'

import { wait_for_assets, type AssetSources } from './wait_for_assets'

function deferred() {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function node_with(...images: Record<string, string>[]) {
  const root = document.createElement('div')
  for (const attributes of images) {
    const image = document.createElement('img')
    for (const [name, value] of Object.entries(attributes)) image.setAttribute(name, value)
    root.appendChild(image)
  }
  return root
}

function sources(overrides: Partial<AssetSources> = {}): AssetSources {
  return {
    load_font: vi.fn(() => Promise.resolve()),
    fonts_ready: vi.fn(() => Promise.resolve()),
    decode: vi.fn(() => Promise.resolve()),
    ...overrides,
  }
}

describe('wait_for_assets', () => {
  it('loads every weight with the peso sign in the sample, then waits for fonts to be ready', async () => {
    const stub = sources()
    await wait_for_assets(node_with(), stub)
    const loads = vi.mocked(stub.load_font).mock.calls
    expect(loads.map(([font]) => font)).toEqual([
      '400 15px "Geist Variable"',
      '500 15px "Geist Variable"',
      '600 15px "Geist Variable"',
    ])
    for (const [, text] of loads) expect(text).toContain('₱')
    expect(stub.fonts_ready).toHaveBeenCalledTimes(1)
  })

  it('does not resolve until a deferred font load does', async () => {
    const font = deferred()
    const done = vi.fn()
    void wait_for_assets(node_with(), sources({ load_font: () => font.promise })).then(done)
    await Promise.resolve()
    await Promise.resolve()
    expect(done).not.toHaveBeenCalled()
    font.resolve()
    await vi.waitFor(() => expect(done).toHaveBeenCalled())
  })

  it('does not resolve until a deferred image decode does', async () => {
    const decode = deferred()
    const done = vi.fn()
    void wait_for_assets(node_with({ 'data-item': '1' }), sources({ decode: () => decode.promise })).then(done)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(done).not.toHaveBeenCalled()
    decode.resolve()
    await vi.waitFor(() => expect(done).toHaveBeenCalledWith([]))
  })

  it('reports a failed photo by item number, and a failed logo by kind', async () => {
    const root = node_with(
      { 'data-item': '2' },
      { 'data-item': '3' },
      { 'data-logo': 'payment' },
      { 'data-logo': 'receipta' },
      { 'data-logo': 'receipta' },
    )
    const failures = await wait_for_assets(root, sources({ decode: () => Promise.reject(new Error('broken')) }))
    expect(failures).toEqual([
      { kind: 'photo', item: 2 },
      { kind: 'photo', item: 3 },
      { kind: 'payment_logo' },
      { kind: 'receipta_logo' },
    ])
  })

  it('proceeds when a font fails to load', async () => {
    const failures = await wait_for_assets(
      node_with(),
      sources({ load_font: () => Promise.reject(new Error('offline')), fonts_ready: () => Promise.reject(new Error('x')) }),
    )
    expect(failures).toEqual([])
  })

  it('treats an environment with no decode() as nothing to wait for', async () => {
    const root = node_with({ 'data-item': '1' })
    expect(await wait_for_assets(root)).toEqual([])
  })
})
