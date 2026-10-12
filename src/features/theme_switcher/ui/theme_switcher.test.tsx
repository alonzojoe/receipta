import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { theme_storage_key } from '@/shared/config/theme'

import { ThemeSwitcher } from './theme_switcher'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

async function open_menu() {
  const user = userEvent.setup()
  render(<ThemeSwitcher />)
  await user.click(screen.getByRole('button'))
  return user
}

describe('ThemeSwitcher', () => {
  it('names the trigger so it is not just an unlabelled button', () => {
    render(<ThemeSwitcher />)

    expect(
      screen.getByRole('button', { name: /change theme/i }),
    ).toBeInTheDocument()
  })

  it('offers light, dark and system', async () => {
    await open_menu()

    for (const label of ['Light', 'Dark', 'System']) {
      expect(await screen.findByRole('menuitem', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('marks the active choice', async () => {
    await open_menu()

    const system = await screen.findByRole('menuitem', { name: /System/ })
    expect(system).toHaveAttribute('aria-current', 'true')
  })

  it('applies and persists a choice', async () => {
    const user = await open_menu()

    await user.click(await screen.findByRole('menuitem', { name: /Dark/ }))

    await waitFor(() =>
      expect(document.documentElement).toHaveClass('dark'),
    )
    await waitFor(() =>
      expect(localStorage.getItem(theme_storage_key)).toBe(JSON.stringify('dark')),
    )
  })

  it('updates the trigger label to the active choice', async () => {
    const user = await open_menu()

    await user.click(await screen.findByRole('menuitem', { name: /Light/ }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Theme: Light/i })).toBeInTheDocument(),
    )
  })
})
