import { useCallback, useState } from 'react'

export type ElementSize = { width: number; height: number }

/**
 * The layout size of an element, kept current. It reads `offsetWidth` and `offsetHeight`,
 * which ignore CSS transforms: the preview scales its document with a transform, and
 * `getBoundingClientRect` would report the scaled size back.
 *
 * Measured in the ref callback, which runs in the commit before paint, so the first frame is
 * already at the right scale and nothing flashes at full size. Without a ResizeObserver
 * (jsdom) the size stays whatever the first read gave.
 */
export function useElementSize() {
  const [size, set_size] = useState<ElementSize>({ width: 0, height: 0 })

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return
    const read = () => {
      const next = { width: node.offsetWidth, height: node.offsetHeight }
      set_size((previous) => (previous.width === next.width && previous.height === next.height ? previous : next))
    }
    read()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(read)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}
