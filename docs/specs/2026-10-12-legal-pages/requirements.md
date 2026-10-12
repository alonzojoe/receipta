# Legal Pages — Requirements

## Goal

Three real pages behind the footer links that currently go nowhere: Privacy Policy,
Terms & Conditions, and Cookie Policy.

The footer has shipped with `#` placeholders since the home page landed. A link that
goes nowhere is worse than no link, and a privacy-first product that cannot say what it
does with your data undercuts its own main claim.

## Not legal advice

These are plain-language documents written to describe accurately what the application
actually does. They are not drafted or reviewed by a lawyer. Before Receipta is used
commercially, or if it ever starts collecting anything, they should be reviewed by
someone qualified. This is stated here rather than buried, and a short version of it is
**not** put on the pages themselves, where it would undermine them.

## What the product actually does

Audited rather than assumed, because the documents are only worth anything if they are
true.

| Question | Finding |
| --- | --- |
| Server or backend | None. The app is static files. |
| Accounts | None. |
| Cookies | **None.** Nothing writes `document.cookie`. |
| Local storage | One key: `receipta-theme`, holding `system`, `light` or `dark`. |
| Session storage, IndexedDB | Not used. |
| Analytics or tracking | None. No tag manager, no pixel, no error reporter. |
| Third-party network requests | None. Geist is self-hosted through `@fontsource`, so not even a font CDN is contacted. |
| Receipt data | Never leaves the browser. Phase 1 onwards it is held in memory while the page is open. |

This makes the Cookie Policy unusual: the honest version says we do not use cookies at
all, and then explains what we use instead. Claiming cookie usage we do not have would
be both false and worse for the reader.

## Pages

Three routes: `/privacy`, `/terms`, `/cookies`.

Each carries a title, a visible "last updated" date, the body, and a way back. They
share one layout so they cannot drift apart typographically.

### Privacy Policy

- A one-sentence summary at the top: nothing is collected, nothing is transmitted
- What is stored on the device, named key by key, with its purpose
- What is explicitly not done: no accounts, no analytics, no tracking, no selling, no
  third-party requests
- Receipt contents: entered, rendered and exported entirely in the browser
- How to remove everything: clearing site data, which is the whole mechanism
- Children's privacy
- How changes to the policy are signalled
- How to get in touch
- Philippine context: the Data Privacy Act of 2012 governs the processing of personal
  information. Receipta operates no server and processes nothing externally, so the
  user remains in sole control of anything they enter.

### Terms & Conditions

- Acceptance by use
- What the service is
- **What it is not: a BIR official receipt.** Stated prominently, not in a footnote. An
  official receipt carries registration, numbering and retention requirements this tool
  does not meet.
- The user's responsibilities: accuracy of what they enter, lawful use, their own
  record-keeping obligations
- Ownership: the user's content is theirs; Receipta claims nothing
- Availability: provided as is, no uptime promise, may change or stop
- No warranty, and a limitation of liability
- Governing law: the Philippines
- Contact

### Cookie Policy

- Opens by stating plainly that Receipta sets no cookies
- Explains what local storage is and how it differs from a cookie, in particular that
  it is never transmitted with requests
- A table of every stored key, its purpose, its values and how long it lasts
- States there are no third-party or advertising cookies, and no consent banner,
  because there is nothing to consent to
- How to clear it

## Content constraints

- Plain English. No "heretofore", no clauses that need a second reading.
- Every factual claim must match the audit table above. If the app changes, these
  change.
- No invented company name, address or registration number. The contact route is the
  project's GitHub.
- No claim of compliance with any specific regulation, which would be a legal assertion
  rather than a description.

## Linking

The footer's two placeholder links become real, and Cookie Policy joins them. The three
are grouped as a legal cluster so the footer does not read as a flat list.

## Technical requirements

- Routes added to the existing code-based router
- One shared layout so the three cannot diverge
- Readable measure: prose constrained in width rather than running the full page
- Each page has a single `h1`, with heading levels that do not skip
- Site header and footer appear on each page, so they are navigable
- The last-updated date lives in one place, not repeated in three files
- Light and dark both legible
- Responsive from 320px with no horizontal scroll

## Acceptance criteria

1. `/privacy`, `/terms` and `/cookies` all render with header and footer
2. The footer links to all three, with no `#` placeholders left anywhere
3. Each page has exactly one `h1` and a visible last-updated date
4. Every factual claim matches the audit: no cookies, one storage key, no analytics,
   no third-party requests
5. The BIR disclaimer appears in the Terms as its own prominent section
6. The Cookie Policy states plainly that no cookies are used
7. No invented legal entity, address or registration number
8. No horizontal scroll at 320, 375, 768, 1024
9. Light and dark both legible
10. `npm run build`, `npm run lint`, `npm test` all exit 0
