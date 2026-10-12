# Dark and Light Mode — Implementation Plan

Branch `feature/implement-dark-light-mode`, cut from `develop` after PR #4 merged. PR
title is the branch name.

Grouped commits, not one per task:

| Commit | Covers |
| --- | --- |
| `chore: add usehooks-ts and shadcn dropdown menu` | tasks 1-2 |
| `feat: add theme switching with system, light, and dark` | tasks 3-5 |
| `feat: let the footer follow the selected theme` | task 6 |
| `docs: record dark and light mode validation` | task 7 |

## Structure

```
src/
  shared/
    config/theme.ts            the Theme type, storage key, option list
    lib/use_theme.ts           useTheme: resolve, apply, persist
    ui/dropdown_menu.tsx       shadcn, renamed per the project rule
  features/
    theme_switcher/
      ui/theme_switcher.tsx    the trigger and its menu
      index.ts
```

`features/` is the right layer: this is a user-facing capability with its own state,
not a dumb primitive and not a page section. The header imports it, which respects the
FSD direction, since `widgets` may import `features`.

## Task 1 — Dependencies

`npm install usehooks-ts`.

## Task 2 — Dropdown primitive

`npx shadcn@latest add dropdown-menu`. The CLI will write `dropdown-menu.tsx` and will
import `cn` from the `cn` package, which this project removed. Both need fixing, as on
every previous `add`:

1. Rename to `dropdown_menu.tsx`
2. Repoint the `cn` import to `@/shared/lib/utils`
3. Check for `transition-all` and replace with named properties
4. Add any new `*Variants` export to the ESLint `allowExportNames` list

**Verify:** `grep -rn "from \"cn\"" src/` returns nothing, and `cn` is not back in
`package.json`.

## Task 3 — Theme config and hook

`shared/config/theme.ts` holds the `Theme` union (`'system' | 'light' | 'dark'`), the
storage key, and the option list with its icons and labels, so the menu renders from
data rather than three copies of the same markup.

`shared/lib/use_theme.ts` exports `useTheme`, returning the stored choice, the resolved
theme, and a setter. It:

- reads and writes `localStorage` through `useLocalStorage` from `usehooks-ts`
- resolves `system` against `prefers-color-scheme`
- subscribes to the media query so System follows the OS live, and unsubscribes on
  unmount
- toggles the `dark` class on `<html>` in an effect

The hook is camelCase, the file is snake_case: `react-hooks/rules-of-hooks` only
recognises `use` plus an uppercase letter.

**Verify:** tests for each of the three choices, for the system-change subscription,
and for a stored value winning over the device.

## Task 4 — No-flash script

An inline, blocking script in `index.html`, before the app loads. It reads the stored
choice, resolves System, and sets the class on `<html>`.

Wrapped in try/catch: `localStorage` access throws outright in some privacy modes
rather than returning null, and the page must still render.

The storage key is duplicated here as a literal, because the script cannot import from
the bundle. That duplication is a real cost and is called out in a comment on both
sides so the two cannot drift silently.

**Verify:** load with a dark preference and confirm `<html>` already carries the class
before React mounts.

## Task 5 — The switcher

`features/theme_switcher` renders a `ghost` icon button whose icon reflects the active
choice, opening a shadcn dropdown with the three options, each an icon plus a label,
the current one ticked.

The trigger gets an explicit accessible name. The icon is `aria-hidden`.

The header places it immediately left of the CTA, visible at every breakpoint — unlike
the nav anchors, which collapse on mobile. A user on a phone is the most likely person
to want dark mode.

**Verify:** tests for the trigger's name, the three options, the tick following the
selection, and the icon changing with the choice.

## Task 6 — Footer follows the theme

Remove the forced `dark` class and the explicit background from `site_footer`, so it
uses the ordinary tokens. Keep a subtle separation from the page above it, through a
border and a muted surface rather than a hardcoded dark one.

**Verify:** a test asserts the footer no longer carries the `dark` class.

## Task 7 — Verify and record

Work through `validation.md`. Check both themes in a browser, check System tracks a
live OS change, confirm no flash, and re-run the responsive probe and compliance greps.

## Risks

**The no-flash script duplicates the storage key.** Unavoidable without a build step to
inject it. Mitigated by a comment on both sides; a test asserts the literal in
`index.html` matches the constant.

**The theme switch is not animated, deliberately.** Cross-fading every colour on the
page is expensive and draws attention to a change the user explicitly asked for. If it
later looks abrupt, the fix is a short background-colour transition on `body` only, not
a global one.

**`prefers-color-scheme` cannot be faked in jsdom.** The media query is stubbed in
tests, so the System path is verified against a stub rather than a real OS change. The
live behaviour needs a browser check, and that is listed as such rather than claimed.
