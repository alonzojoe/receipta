import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'
import { AppInput } from './app_input'
import { control_classes, focus_ring_classes } from './control_style'
import input_source from './app_input.tsx?raw'
import style_source from './control_style.ts?raw'
import textarea_source from './app_textarea.tsx?raw'

describe('AppInput', () => {
  it('forwards its ref to the real input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<AppInput ref={ref} aria-label="Name" />)
    expect(ref.current).toBe(screen.getByLabelText('Name'))
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('passes id, name, value, handlers, aria and inputMode through', async () => {
    const on_change = vi.fn()
    render(
      <AppInput
        id="price"
        name="price"
        value="12"
        onChange={on_change}
        inputMode="decimal"
        aria-invalid="true"
        aria-describedby="price-error"
      />,
    )
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('id', 'price')
    expect(input).toHaveAttribute('name', 'price')
    expect(input).toHaveValue('12')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'price-error')
    await userEvent.type(input, '3')
    expect(on_change).toHaveBeenCalled()
  })

  it('renders the adornment as aria-hidden text outside the value', () => {
    render(<AppInput aria-label="Price" adornment="₱" defaultValue="5" />)
    const sign = screen.getByText('₱')
    expect(sign).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByLabelText('Price')).toHaveValue('5')
  })

  it('gives every control_classes token to the element', () => {
    render(<AppInput aria-label="Name" />)
    const classes = screen.getByLabelText('Name').className.split(/\s+/)
    for (const token of control_classes.split(/\s+/)) expect(classes).toContain(token)
  })

  it('shares the focus ring with Button', () => {
    render(<Button>go</Button>)
    const classes = screen.getByRole('button').className
    for (const token of focus_ring_classes.split(/\s+/)) expect(classes).toContain(token)
  })

  it('contains no colour literal, in the component or the shared style', () => {
    const literal = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|\b(?:bg|text|border|ring)-(?:white|black)\b/i
    const sources = { 'app_input.tsx': input_source, 'app_textarea.tsx': textarea_source, 'control_style.ts': style_source }
    for (const [file, source] of Object.entries(sources)) expect(source, file).not.toMatch(literal)
  })
})
