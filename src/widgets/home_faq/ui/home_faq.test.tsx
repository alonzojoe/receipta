import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { questions } from '../model/questions'
import { HomeFaq } from './home_faq'

const buttons = () => screen.getAllByRole('button')
const expanded = () => buttons().filter((b) => b.getAttribute('aria-expanded') === 'true')

describe('HomeFaq', () => {
  it('renders the six questions in source order', () => {
    render(<HomeFaq />)
    expect(buttons().map((b) => b.textContent)).toEqual(questions.map((q) => q.question))
  })

  it('puts every question in a button inside a heading', () => {
    render(<HomeFaq />)
    for (const { question } of questions) {
      const button = screen.getByRole('button', { name: question })
      expect(button.closest('h3')).not.toBeNull()
    }
  })

  it('opens the first item on load and no other', () => {
    render(<HomeFaq />)
    const states = buttons().map((b) => b.getAttribute('aria-expanded'))
    expect(states).toEqual(['true', 'false', 'false', 'false', 'false', 'false'])
    expect(screen.getByText(questions[0].answer)).toBeInTheDocument()
  })

  it('closes the open item when another opens', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    await user.click(buttons()[3])
    expect(buttons()[3]).toHaveAttribute('aria-expanded', 'true')
    expect(buttons()[0]).toHaveAttribute('aria-expanded', 'false')
    expect(expanded()).toHaveLength(1)
  })

  it('lets the open item be closed', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    await user.click(buttons()[0])
    expect(expanded()).toHaveLength(0)
  })

  it('wires aria-controls and aria-labelledby both ways', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    for (const index of [0, 2]) {
      if (index !== 0) await user.click(buttons()[index])
      const button = buttons()[index]
      const region = document.getElementById(button.getAttribute('aria-controls') ?? '')
      expect(region).not.toBeNull()
      expect(region).toHaveAttribute('role', 'region')
      expect(region).toHaveAttribute('aria-labelledby', button.id)
    }
  })

  it('does not expose closed answers', () => {
    render(<HomeFaq />)
    for (const { question, answer } of questions.slice(1)) {
      expect(screen.queryByText(answer)).toBeNull()
      expect(screen.queryByRole('region', { name: question })).toBeNull()
    }
  })

  it('toggles with Enter and Space and keeps focus on the button', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    const button = buttons()[1]
    button.focus()
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(document.activeElement).toBe(button)
    await user.keyboard(' ')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(button)
  })

  it('keeps focus on the button after a click', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    const button = buttons()[2]
    await user.click(button)
    expect(document.activeElement).toBe(button)
  })

  it('moves focus with arrows, Home and End, wrapping at the end', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    buttons()[0].focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(buttons()[1])
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(buttons()[0])
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(buttons()[5])
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(buttons()[0])
    await user.keyboard('{End}{Home}')
    expect(document.activeElement).toBe(buttons()[0])
  })

  it('adds no tab stop inside an open panel', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    buttons()[0].focus()
    await user.tab()
    expect(document.activeElement).toBe(buttons()[1])
  })

  it('hides every icon from assistive technology', () => {
    render(<HomeFaq />)
    for (const button of buttons()) {
      expect(button.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('keeps the BIR answer plain', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    await user.click(screen.getByRole('button', { name: 'Is this a BIR official receipt?' }))
    expect(screen.getByText(/not a tax document/)).toBeInTheDocument()
  })
})
