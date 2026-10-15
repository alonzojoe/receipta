import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { AppInput } from './app_input'
import { AppTextarea } from './app_textarea'
import { control_classes } from './control_style'

describe('AppTextarea', () => {
  it('forwards its ref to the real textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<AppTextarea ref={ref} aria-label="Notes" />)
    expect(ref.current).toBe(screen.getByLabelText('Notes'))
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('passes id, name, rows and aria through', () => {
    render(
      <AppTextarea id="notes" name="notes" rows={4} aria-invalid="true" aria-describedby="n" />,
    )
    const area = screen.getByRole('textbox')
    expect(area).toHaveAttribute('id', 'notes')
    expect(area).toHaveAttribute('name', 'notes')
    expect(area).toHaveAttribute('rows', '4')
    expect(area).toHaveAttribute('aria-invalid', 'true')
    expect(area).toHaveAttribute('aria-describedby', 'n')
  })

  it('receives the same control classes as AppInput, so a theme edit happens in one place', () => {
    render(
      <>
        <AppInput aria-label="One" />
        <AppTextarea aria-label="Two" />
      </>,
    )
    const input = screen.getByLabelText('One').className.split(/\s+/)
    const area = screen.getByLabelText('Two').className.split(/\s+/)
    for (const token of control_classes.split(/\s+/)) {
      expect(input, token).toContain(token)
      // min-h-11 is the one token the textarea deliberately overrides with a taller floor.
      if (token !== 'min-h-11') expect(area, token).toContain(token)
    }
  })

  it('sets no maxLength, so a paste is never silently truncated', () => {
    render(<AppTextarea aria-label="Notes" />)
    expect(screen.getByLabelText('Notes')).not.toHaveAttribute('maxlength')
  })
})
