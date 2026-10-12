import { useEffect, useRef, useState } from 'react'

/**
 * Reports whether the page has scrolled past a sentinel placed at the very top.
 *
 * Deliberately not a scroll listener: that fires on every frame of every scroll and
 * does work the page does not need. A one-pixel sentinel and an IntersectionObserver
 * fire twice in total - once when it leaves the viewport, once when it comes back.
 *
 * Render the sentinel as the first element on the page, above the sticky header.
 *
 * The file is snake_case per the project rule; the hook itself is camelCase because
 * React's rules-of-hooks lint only recognises `use` followed by an uppercase letter.
 * Same class of constraint as components having to be PascalCase for JSX.
 */
export function useScrolledPast() {
  const sentinel_ref = useRef<HTMLDivElement>(null)
  const [scrolled, set_scrolled] = useState(false)

  useEffect(() => {
    const node = sentinel_ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => {
      set_scrolled(!entry.isIntersecting)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { sentinel_ref, scrolled }
}
