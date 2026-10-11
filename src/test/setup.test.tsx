import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

// Proves the jsdom environment, React rendering, and jest-dom matchers are wired up.
describe('test environment', () => {
  it('renders a component and exposes jest-dom matchers', () => {
    render(<p>receipt total</p>)

    expect(screen.getByText('receipt total')).toBeInTheDocument()
  })
})
