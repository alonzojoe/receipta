import type { ReactElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

export type Mounted = {
  /** The element React rendered: the node to measure and to capture. */
  node: HTMLElement
  /** Unmounts and removes the container. Safe to call twice. */
  dispose: () => void
}

/**
 * Renders `element` into a temporary container the user can neither see nor reach, and
 * hands back the unscaled node. It is never the scaled preview: a rasteriser handles CSS
 * `transform` badly, and a transformed node reports scaled geometry to anything measuring it.
 *
 * `position: fixed; left: -10000px; top: 0` is the placement the task 1 spike chose: the
 * raster is pixel-identical to an in-flow node, it is repeatable, and it cannot flash a
 * white box in the viewport. `aria-hidden` and `inert` keep it out of the accessibility tree
 * and out of focus order. Not `display: none` or `visibility: hidden`: a rasteriser skips
 * what is not rendered.
 *
 * `flushSync` so the markup exists when this returns; the caller measures it next.
 */
export function mount_offscreen(element: ReactElement, host: HTMLElement = document.body): Mounted {
  const container = document.createElement('div')
  container.setAttribute('aria-hidden', 'true')
  container.setAttribute('inert', '')
  container.setAttribute('data-receipt-export', '')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.pointerEvents = 'none'
  host.appendChild(container)

  const root = createRoot(container)
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    root.unmount()
    container.remove()
  }

  flushSync(() => root.render(element))
  const node = container.firstElementChild
  if (!(node instanceof HTMLElement)) {
    dispose()
    throw new Error('The receipt did not render.')
  }
  return { node, dispose }
}
