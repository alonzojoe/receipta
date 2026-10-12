# Dark and Light Mode — Requirements

## Goal

Let someone choose how Receipta looks: follow their device, or force light, or force
dark. The choice sticks between visits.

The dark token set has existed since the palette was built but nothing could reach it.
This is the control.

## Decisions

Settled before implementation, recorded so they are not re-litigated.

| Decision | Choice |
| --- | --- |
| Default | **System.** Follows the device until the user says otherwise. |
| Options | System, Light, Dark |
| Persistence | `localStorage`, via `usehooks-ts` |
| Control | One icon-only button in the navbar, left of "Create receipt" |
| Menu | shadcn `dropdown-menu`, each row an icon plus a label, current choice ticked |
| Trigger icon | Reflects the active choice: sun, moon, or monitor |
| Footer | **Follows the theme.** The forced dark is removed. |
| Mock receipt | **Follows the theme**, like everything else. |

### Why the footer changes

It was forced dark so the page had an anchor. With a real toggle that becomes a bug: a
user picks Light, and part of the page ignores them. The control has to be believable,
so the footer follows the theme like everything else.

### Why the mock receipt follows it too

Author's call, against the initial recommendation. The argument for keeping it white
was that it previews a printed document, so it should show what the export contains.
The argument that won: the hero mock is marketing, not the product, and a page where
one card stubbornly stays white makes the toggle look broken.

This does **not** change the export decision. `tech-stack.md` still requires the real
receipt - the one Phase 1 builds and `html2canvas-pro` rasterises - to carry fixed
colours, because a theme token reaching the exported node means `oklch()` has to
resolve at export time. The hero mock is a separate, throwaway component and is not
the thing that gets exported.

A useful side effect: the mock stops being the only file in `src/` holding colour
literals.

## Behaviour

**System** resolves to the device's `prefers-color-scheme` and keeps following it. If
the user changes their OS theme while the tab is open, the page follows live, without a
reload.

**Light** and **Dark** pin the choice and ignore the device.

The choice survives a reload and a new tab on the same browser. It is per-device, like
every other piece of Receipta's state.

## No flash

The theme must be on the document before first paint. A React effect runs after the
first paint, so with no other work a dark-mode user sees a white flash on every page
load.

A small blocking script in `index.html` reads the stored choice, resolves System
against the media query, and sets the class on `<html>` before the app loads. It is
inlined, not imported, because an external file would not be guaranteed to run first.

It must not throw if `localStorage` is unavailable — some privacy modes make access to
it throw rather than return null — and a failure there must fall back to the system
preference rather than breaking the page.

## Accessibility

- The trigger has an accessible name that says what it does, not just "button"
- The menu is keyboard operable: open, arrow between items, select, Escape to close.
  This comes free with shadcn's dropdown-menu, which must not be broken by styling.
- The current choice is marked, not implied by colour alone
- Focus returns to the trigger when the menu closes
- The trigger's icon is decorative; the accessible name carries the meaning

## Constraints

- `usehooks-ts` for localStorage, as requested
- shadcn `dropdown-menu`. Per the project rule the generated file is renamed to
  `dropdown_menu.tsx` and its imports fixed.
- Icons from react-icons: `LuSun`, `LuMoon`, `LuMonitor`
- Colours stay in `index.css`. This feature adds no new ones; it only switches which
  existing set applies.
- Motion rules unchanged. The theme switch itself is **not** animated: a cross-fade of
  every colour on the page is expensive and draws attention to a change the user just
  asked for and already expects.

## Acceptance criteria

1. The navbar shows an icon-only theme button left of the CTA, on every breakpoint
2. Clicking it opens a menu with System, Light and Dark, each an icon plus a label
3. The active choice is ticked
4. The trigger icon matches the active choice
5. A fresh visitor gets their device theme with no stored value
6. Choosing Light or Dark applies immediately and survives a reload
7. On System, changing the OS theme updates the page live
8. No flash of the wrong theme on load, in either direction
9. `localStorage` being unavailable degrades to system preference, no crash
10. The footer follows the theme; the mock receipt does not
11. The menu is fully keyboard operable
12. `npm run build`, `npm run lint`, `npm test` all exit 0
