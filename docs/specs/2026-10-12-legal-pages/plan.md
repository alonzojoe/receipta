# Legal Pages — Implementation Plan

Branch `feature/legal-pages`, cut from `develop` after PR #5 merged. PR title is the
branch name.

| Commit | Covers |
| --- | --- |
| `docs: add legal pages spec` | the spec |
| `feat: add privacy, terms, and cookie policy pages` | tasks 1-4 |
| `feat: link the legal pages from the footer` | task 5 |
| `docs: record legal pages validation` | task 6 |

## Structure

```
src/
  shared/config/legal.ts          last-updated date, contact, the storage inventory
  widgets/legal_document/         shared shell: title, date, prose width, back link
  pages/legal/
    ui/privacy_page.tsx
    ui/terms_page.tsx
    ui/cookie_page.tsx
    index.ts
  app/routes/
    privacy_route.tsx
    terms_route.tsx
    cookies_route.tsx
```

The three pages live in one `legal` slice rather than three, because they share a
layout, a last-updated date and a voice, and will always be edited together.

## Task 1 — Config

`shared/config/legal.ts` holds the last-updated date in one place, the contact URL, and
**the storage inventory as data**: each key, what it holds, why, and how long it lasts.

The Cookie Policy renders its table from that inventory rather than restating it in
prose. If a future feature adds a storage key, the page is wrong until the inventory is
updated, which is the point: the document is generated from the fact, not kept in sync
by hand.

## Task 2 — Shared layout

`widgets/legal_document` takes a title, the last-updated date and children. It owns the
prose width, the vertical rhythm, the heading styles and the back link, so the three
pages cannot drift apart.

Prose is constrained with `max-w-prose` rather than a fixed width, per the project's
fluid-sizing rule.

## Task 3 — The three pages

Written as semantic markup, not a markdown blob: real `h2`, real lists, real tables.
That keeps heading order checkable and the content accessible.

Every claim traces to the audit in `requirements.md`.

**Privacy** leads with the summary, because most readers will not get past the first
paragraph and the first paragraph happens to be the whole story.

**Terms** gives the BIR disclaimer its own section with its own heading, so it cannot be
skimmed past. Receipta producing something that looks like an official receipt but is
not is the one way this tool could actually hurt someone.

**Cookies** opens by saying there are none, then explains local storage and renders the
inventory table.

## Task 4 — Routes

Three routes added to the existing code-based tree. Each page composes the site header
and footer so a reader is never stranded.

## Task 5 — Footer

Replace the two `#` placeholders and add the third link. Group them under a heading so
the footer reads as sections rather than a flat list.

**Verify:** a test asserts no `href="#"` remains anywhere in the footer.

## Task 6 — Verify and record

Work through `validation.md`: heading order, no placeholder links, claims matching the
audit, responsive, both themes, and the full command gates.

## Risks

**The documents can go stale.** They describe the app as it is on the date written. The
first feature that stores anything new makes the Privacy and Cookie pages wrong. The
inventory being data rather than prose reduces that, and a test asserting the theme key
appears in the inventory catches the most likely drift, but nothing stops someone
adding a key and not updating the file.

**They are not lawyer-reviewed.** Accurate, plain, and honest about what the app does,
which is the most that can be claimed. Recorded in the spec rather than on the pages.
