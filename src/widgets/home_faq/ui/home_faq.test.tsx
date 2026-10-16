import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { default_open_id, questions } from '../model/questions'
import { HomeFaq } from './home_faq'

const buttons = () => screen.getAllByRole('button')
// The panel a trigger labels. Closed panels stay mounted but hidden, so look through
// the hidden filter and match on aria-labelledby rather than on aria-controls (a closed
// trigger carries none).
const panel_for = (button: HTMLElement) => {
  const panel = screen
    .getAllByRole('region', { hidden: true })
    .find((r) => r.getAttribute('aria-labelledby') === button.id)
  if (!panel) throw new Error(`no panel labelled by ${button.id}`)
  return panel
}
const expanded = () => buttons().filter((b) => b.getAttribute('aria-expanded') === 'true')

describe('HomeFaq', () => {
  // Pinned literals, deliberately not derived from `questions`: comparing the data to itself
  // passes whatever the data says. An edit here should be a conscious edit to this list too.
  it('renders the six questions in source order', () => {
    render(<HomeFaq />)
    expect(questions).toHaveLength(6)
    expect(buttons().map((b) => b.textContent)).toEqual([
      'Is it really free?',
      'Is this a BIR official receipt?',
      'Where is my data stored?',
      'Do I need an account?',
      'Can I use it for my small business?',
      'What if I get paid in cash?',
    ])
  })

  it('gives every question a unique id', () => {
    const ids = questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('default_open_id names a real question, and that row is the one open on load', () => {
    const match = questions.find((q) => q.id === default_open_id)
    expect(match).toBeDefined()
    render(<HomeFaq />)
    const open = expanded()
    expect(open).toHaveLength(1)
    expect(open[0]).toHaveTextContent(match?.question ?? 'no match')
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
      const button = screen.getByRole('button', { name: question })
      const panel = panel_for(button)
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(answer)).toBeNull()
      // Mounted but hidden and empty: nothing for a screen reader to land on.
      expect(panel).toHaveAttribute('hidden')
      expect(panel).toBeEmptyDOMElement()
      expect(panel).not.toBeVisible()
    }
    // Only the open row is a region in the accessibility tree.
    expect(screen.getAllByRole('region')).toHaveLength(1)
  })

  /**
   * Both halves wait on the condition rather than asserting it one tick after the click.
   * Radix moves a panel's content and its `hidden` attribute across separate commits, and
   * this accordion is single-open, so one click tears down the previously open item while
   * building this one. Asserting immediately caught the panel mounted-but-still-hidden
   * roughly once in ten runs under CPU load - a real race in the test, not in the
   * component. `waitFor` polls, so it is as fast as before when the machine is idle.
   */
  it('removes an answer from the accessibility tree again once it is closed', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    const { question, answer } = questions[2]
    const button = screen.getByRole('button', { name: question })

    await user.click(button)
    await waitFor(() => {
      expect(screen.getByText(answer)).toBeVisible()
      expect(screen.getByRole('region', { name: question })).toBeInTheDocument()
    })

    await user.click(button)
    // Outside the poll: the trigger's own state flips in the same commit as the click, so
    // waiting on it would only delay a genuine failure by the full timeout.
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => {
      expect(screen.queryByText(answer)).toBeNull()
      expect(screen.queryByRole('region', { name: question })).toBeNull()
      const panel = panel_for(button)
      expect(panel).toHaveAttribute('hidden')
      expect(panel).toBeEmptyDOMElement()
    })
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

  /**
   * `findByText`, not `getByText`: this clicks an item while the first one is open, so it
   * is the same teardown-and-build case as the test above and had the same latent race.
   * It had not been seen to fail, which is the only reason it looked fine.
   */
  it('keeps the BIR answer plain', async () => {
    const user = userEvent.setup()
    render(<HomeFaq />)
    await user.click(screen.getByRole('button', { name: 'Is this a BIR official receipt?' }))
    expect(await screen.findByText(/not a tax document/)).toBeInTheDocument()
    // Pinned in full: this is the one answer with legal weight, and the data file is
    // the only other place it lives.
    expect(
      await screen.findByText(
        'No, and it should not be used as one. An official receipt has registration, numbering, and retention requirements that this tool does not meet. Receipta produces a proof-of-payment document you can send a customer, not a tax document.',
      ),
    ).toBeInTheDocument()
  })
})
