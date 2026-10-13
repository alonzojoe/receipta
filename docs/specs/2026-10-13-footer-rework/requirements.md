# Footer Rework — Requirements

## Goal

Rework the footer so the legal links sit in a row along the bottom bar, where the
GitHub link currently is, and replace the "Built by" credit with the product name
linking to its repository.

## Why

The footer currently carries the legal links twice as much weight as they need. They
occupy a stacked column with its own "Legal" heading, which reads as a navigation
section on a site that has three legal pages and one real route. Moving them into the
bottom bar puts them where people look for them on almost every site, and frees the
upper block.

"Built by alonzojoe" also personalises a product footer. The name of the thing belongs
there, not the name of the person who made it.

## Current layout

```
┌──────────────────────────────────────────────────────┐
│  [logo] Receipta                       Legal         │
│  Turn a GCash, Maya, MariBank…         Privacy Policy│
│                                        Terms & Cond. │
│                                        Cookie Policy │
├──────────────────────────────────────────────────────┤
│  © 2026 Receipta. All rights reserved.  ⌨ Built by … │
└──────────────────────────────────────────────────────┘
```

## Target layout

```
┌──────────────────────────────────────────────────────┐
│  [logo] Receipta                                     │
│  Turn a GCash, Maya, MariBank…                       │
├──────────────────────────────────────────────────────┤
│  ⌨ Receipta    Privacy · Terms & Conditions · Cookie │
│  © 2026 Receipta. All rights reserved.               │
└──────────────────────────────────────────────────────┘
```

On a wide screen the bottom bar is one row: the repository link on the left, the legal
links as a row on the right. The copyright line sits with the repository link.

## Decisions

| Decision | Choice |
| --- | --- |
| Legal links | Moved into the bottom bar, laid out as a row |
| Legal heading | Removed. A row of three links does not need a section heading. |
| GitHub credit | `Built by alonzojoe` becomes `Receipta`, still carrying the GitHub mark and still linking to the repository |
| Link target | `https://github.com/alonzojoe/receipta`, the repository, not the profile |
| Upper block | Keeps the logo and the product description; its right side becomes empty |
| Separators | A dot between legal links on wide screens, so the row reads as a list rather than three loose words |

### Why the repository, not the profile

The current link points at `github.com/alonzojoe`, a personal profile. With the label
becoming the product name, the destination has to match it. `legal_contact_url` in
`shared/config/legal.ts` already points at the repository and is what the legal pages
use for contact, so the two converge on one URL.

## Behaviour

- The legal links continue to navigate through the router, not full page loads
- The repository link stays external: new tab, `rel="noopener noreferrer"`
- The footer continues to follow the app theme, as decided in the theme work. It is not
  pinned dark.

## Responsive

- **Wide**: one row, repository link left, legal row right
- **Narrow**: the bar stacks. The legal links wrap rather than overflowing, and the dot
  separators are dropped when they wrap, because a dangling separator at the end of a
  wrapped line looks like a mistake.
- No horizontal scroll at 320px

## Accessibility

- The legal links stay inside a `nav` with an accessible name, even without the visible
  heading
- Separators are decorative and must be hidden from assistive technology, so a screen
  reader does not read "Privacy Policy dot Terms"
- The repository link's accessible name must say where it goes. "Receipta" alone, as a
  link, is ambiguous out of context.
- Focus order follows reading order

## Out of scope

- The upper block's content. The logo and description stay as they are.
- The legal pages themselves.
- Any change to `footer_links` membership. The same three pages are linked.

## Acceptance criteria

1. The legal links render as a row in the bottom bar, not a stacked column
2. The "Legal" heading is gone
3. The GitHub link reads `Receipta` and points at the repository, not the profile
4. No "Built by" text remains anywhere
5. Separators are present on wide screens and hidden from assistive technology
6. The legal links still navigate via the router
7. The repository link opens in a new tab with `rel="noopener noreferrer"`
8. No horizontal scroll at 320, 375, 768, 1024
9. Light and dark both legible
10. `npm run build`, `npm run lint`, `npm test` all exit 0
