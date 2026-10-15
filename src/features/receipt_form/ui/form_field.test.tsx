import { useForm } from '@tanstack/react-form'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AppInput } from '@/shared/ui/app_input'

import { FormField } from './form_field'

type HarnessProps = {
  hint?: string
  requirement?: 'required' | 'optional'
  count?: { current: number; max: number }
  /** The field reports this message once its value changes. */
  error?: string
}

function Harness({ hint, requirement = 'required', count, error }: HarnessProps) {
  const form = useForm({ defaultValues: { name: '' } })
  return (
    <form.Field
      name="name"
      validators={{ onChange: ({ value }) => (value !== '' ? error : undefined) }}
    >
      {(field) => (
        <FormField field={field} label="Full name" hint={hint} requirement={requirement} count={count}>
          {(control) => <AppInput {...control} />}
        </FormField>
      )}
    </form.Field>
  )
}

describe('FormField', () => {
  it('binds the label to the control by htmlFor and id', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Full name')).toBeInstanceOf(HTMLInputElement)
  })

  it('wires an error with aria-invalid and an aria-describedby that resolves to its text', async () => {
    render(<Harness error="Name is not allowed" />)
    await userEvent.type(screen.getByLabelText('Full name'), 'x')
    const input = screen.getByLabelText('Full name')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const described = input.getAttribute('aria-describedby')
    expect(described).toBeTruthy()
    expect(document.getElementById(described!)).toHaveTextContent('Name is not allowed')
  })

  it('has neither aria-invalid nor a dangling aria-describedby when valid and without a hint', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Full name')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('lists the hint and the error together, and both ids exist', async () => {
    render(<Harness hint="Up to 100 characters" error="Too long" />)
    await userEvent.type(screen.getByLabelText('Full name'), 'x')
    const ids = screen.getByLabelText('Full name').getAttribute('aria-describedby')!.split(' ')
    expect(ids).toHaveLength(2)
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
      'Up to 100 characters',
      'Too long',
    ])
  })

  it('points aria-describedby at the hint alone when there is no error', () => {
    render(<Harness hint="Up to 100 characters" />)
    const id = screen.getByLabelText('Full name').getAttribute('aria-describedby')!
    expect(document.getElementById(id)).toHaveTextContent('Up to 100 characters')
  })

  it('says Required or Optional as text, and marks a required control', () => {
    const { unmount } = render(<Harness requirement="required" />)
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-required', 'true')
    unmount()
    render(<Harness requirement="optional" />)
    expect(screen.getByText('Optional')).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).not.toHaveAttribute('aria-required')
  })

  it('shows a visible count that is not a live region', () => {
    render(<Harness count={{ current: 120, max: 300 }} />)
    const count = screen.getByText('120 / 300')
    expect(count.closest('[aria-live]')).toBeNull()
    expect(count).not.toHaveAttribute('role')
  })
})
