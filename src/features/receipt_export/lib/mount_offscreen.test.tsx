import { afterEach, describe, expect, it } from 'vitest'

import { mount_offscreen } from './mount_offscreen'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('mount_offscreen', () => {
  it('renders the element and returns its node, in the document', () => {
    const { node, dispose } = mount_offscreen(<p id="x">hello</p>)
    expect(node.id).toBe('x')
    expect(document.body.contains(node)).toBe(true)
    dispose()
  })

  it('hides it from assistive technology and focus, and places it off-screen without a transform', () => {
    const { node, dispose } = mount_offscreen(<p>hello</p>)
    const container = node.parentElement as HTMLElement
    expect(container.getAttribute('aria-hidden')).toBe('true')
    expect(container.hasAttribute('inert')).toBe(true)
    expect(container.style.position).toBe('fixed')
    expect(container.style.left).toBe('-10000px')
    for (let element: HTMLElement | null = node; element; element = element.parentElement) {
      expect(element.style.transform, element.tagName).toBe('')
      expect(element.style.display).not.toBe('none')
      expect(element.style.visibility).not.toBe('hidden')
    }
    dispose()
  })

  it('removes the container on dispose, and disposing twice is harmless', () => {
    const { dispose } = mount_offscreen(<p>hello</p>)
    expect(document.querySelector('[data-receipt-export]')).not.toBeNull()
    dispose()
    dispose()
    expect(document.querySelector('[data-receipt-export]')).toBeNull()
  })

  it('cleans up and throws when nothing rendered', () => {
    expect(() => mount_offscreen(<></>)).toThrow()
    expect(document.querySelector('[data-receipt-export]')).toBeNull()
  })
})
