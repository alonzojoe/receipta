import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SiteFooter } from './site_footer'

describe('SiteFooter', () => {
  it('follows the app theme instead of forcing its own', () => {
    const { container } = render(<SiteFooter />)
    const footer = container.querySelector('footer')

    // It was previously pinned dark in both themes, which made the theme switch look
    // broken in light mode.
    expect(footer).not.toHaveClass('dark')
  })

  it('still credits the author with a safe external link', () => {
    const { container } = render(<SiteFooter />)
    const link = container.querySelector('a[target="_blank"]')

    expect(link).toHaveAttribute('href', 'https://github.com/alonzojoe')
    expect(link?.getAttribute('rel')).toContain('noopener')
  })
})
