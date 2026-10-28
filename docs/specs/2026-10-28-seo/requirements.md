# SEO

## Goal

The author: *"improve the overall SEO of the app."*

## What is actually wrong

Three real defects, found by reading what ships rather than by running a checklist:

1. **Every route has the same title and description.** `index.html` sets them once and
   nothing changes them, so `/create`, `/privacy`, `/terms` and `/cookies` are all
   *"Receipta — Send receipts, not screenshots"* in a search result, in a browser tab, and
   in a bookmark. A search engine shown five pages with one title has no reason to index
   more than one of them, and a user with five tabs open cannot tell them apart.
2. **No canonical URL and no `og:url`.** The same page is reachable at `receipta-app.netlify.app`
   and `www.…`, with or without a trailing slash, and nothing says which is the real one.
3. **No `robots.txt` and no `sitemap.xml`.** Nothing tells a crawler the site is open or
   what is in it.

Things that are already right and need no work: the description is specific rather than
generic, Open Graph and Twitter cards exist, icons and a manifest are in place, headings
are ordered, every image has alt text or is explicitly decorative, and the CSP and Netlify
headers are set.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Per-route metadata | TanStack Router's `head` on each route plus `<HeadContent />` | It is the router's own mechanism, it already ships in the installed version, and it keeps each route's title beside the route rather than in a lookup table someone forgets to update. |
| Titles | `<page> · Receipta` rather than the full tagline on every page | A tab shows the first 20 or so characters, so the distinguishing word has to come first. The home page keeps the tagline, because that is the one place it is doing work. |
| `/create` indexing | **Indexed**, with its own title and description | It is the product. Someone searching "free receipt maker Philippines" should land on it. |
| The legal pages | Indexed, not hidden | They are short, honest, and are the pages that answer "does this upload my data" - which is the question that decides whether someone uses this. |
| Canonical | On every route, built from `site.url` | One source of truth for the address; the receipt footer already uses it. |
| Structured data | One `WebApplication` JSON-LD block, on the home page only | It describes the app, and the app has one home. Repeating it on every route is how a site ends up claiming to be five applications. |
| `robots.txt` and `sitemap.xml` | Static files in `public/`, with the five routes | No generator: five routes, written once, and a test that fails when a route is added without being listed. |
| Prerendering | **Not done** | The real ceiling on this app's SEO is that it is a client-rendered SPA. Netlify can prerender, and that is a bigger change with its own verification; it is recorded in Deferred rather than half-done here. |

## Acceptance criteria

1. Each of the five routes sets its own `<title>` and `<meta name="description">`, and no
   two routes share either.
2. Every title ends with `Receipta`, and every one is under 60 characters so a search
   result does not truncate it.
3. Every description is between 70 and 160 characters.
4. Each route emits a `<link rel="canonical">` whose href is `site.url` plus that route's
   path, with no trailing slash except on the home page.
5. `og:url` matches the canonical on every route, and `og:title` and `og:description` match
   that route's title and description.
6. The home page emits one `application/ld+json` block, valid JSON, of type
   `WebApplication`, naming the app, its URL and that it is free.
7. No other route emits structured data.
8. `public/robots.txt` allows everything and names the sitemap.
9. `public/sitemap.xml` lists exactly the five routes, each as an absolute URL under
   `site.url`.
10. **A test fails when a route exists that the sitemap does not list**, so adding a route
    without listing it cannot pass review.
11. `index.html` keeps a title and description, so a crawler that runs no JavaScript still
    sees something true rather than an empty shell.
12. `npm run build`, `npm run lint` and `npm test` exit 0.

## Verification

Everything above is verified by tests over the rendered head and the static files.

**What cannot be verified here:** that a crawler actually executes the JavaScript and sees
the per-route metadata. This is a client-rendered SPA — Google renders JS, most other
crawlers and every social-card scraper do not, so a link to `/create` shared on Facebook or
Viber will show the `index.html` card rather than the route's own. That is a real limit,
not a detail, and prerendering is the fix. It is named in Deferred.

## Deferred

- **Prerendering or static generation**, which is the actual ceiling here. Netlify supports
  it; it needs its own verification against real crawler behaviour.
- Per-route Open Graph images.
- `hreflang`, if the app is ever translated.
