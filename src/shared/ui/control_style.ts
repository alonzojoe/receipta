/*
 * The one definition of how a form control looks. `AppInput` and `AppTextarea` both read
 * `control_classes` (through the generated `Input` and `Textarea`), and `Button` reads the
 * two focus and invalid strings, so keyboard focus looks the same everywhere and a theme
 * change is an edit to this file. Constants only, so it can sit beside the components
 * without breaking `react-refresh/only-export-components`.
 *
 * Tokens from `index.css` and nothing else: no colour literal belongs here.
 */

/** Copied byte for byte from Button. `Button` interpolates it, so the two cannot drift. */
export const focus_ring_classes =
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/** Copied byte for byte from Button. */
export const invalid_classes =
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'

/**
 * Surface, outline, text and states of a text control.
 *
 * - `border-control-border`: 3:1 against the page in both themes (`--border` is not).
 * - `text-base`: 16px at every width, so iOS Safari does not zoom on focus.
 * - `scroll-mt-28`: a focused control scrolls into view clear of the sticky header.
 * - `min-h-11`: 44px touch target. A minimum, so a wrapped value can still grow.
 * - Transition names its properties and is short; colour and shadow do not trigger layout.
 */
export const control_classes = [
  'w-full min-w-0 min-h-11 scroll-mt-28 rounded-lg border border-control-border bg-background px-3 py-2',
  'text-base text-foreground placeholder:text-muted-foreground',
  'transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'dark:bg-input/30',
  focus_ring_classes,
  invalid_classes,
].join(' ')
