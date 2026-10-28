import { site } from './site'

export type PageMeta = {
  /** Ends with `Receipta`, under 60 characters so a search result does not truncate it. */
  title: string
  /** 70 to 160 characters: shorter says nothing, longer is cut. */
  description: string
}

/**
 * One entry per route. Every route had the same title before this, so `/create` and the
 * three legal pages were indistinguishable in a search result, in a browser tab and in a
 * bookmark - and a crawler shown five pages with one title has little reason to index more
 * than one of them.
 *
 * The distinguishing word comes FIRST, because a browser tab shows about twenty characters
 * and a phone shows fewer. The home page is the one place the tagline earns its space.
 *
 * Kept here rather than in each route file so `page_meta.test.ts` can check the whole set
 * at once: lengths, uniqueness, and that every route has one.
 */
export const page_meta: Record<string, PageMeta> = {
  '/': {
    title: 'Receipta — Send receipts, not screenshots',
    description:
      'Turn a GCash, Maya, or bank transfer into a clean receipt you can send in seconds. Free, no signup, and nothing leaves your device.',
  },
  '/create': {
    title: 'Create a receipt · Receipta',
    description:
      'Fill in who paid, what for, and how. Add photos of the items, then download the receipt as a PDF or an image. Free and no signup.',
  },
  '/privacy': {
    title: 'Privacy Policy · Receipta',
    description:
      'What Receipta stores and what it never sees. Your receipt stays in your browser, and nothing is sent to a server, because there is no server.',
  },
  '/terms': {
    title: 'Terms & Conditions · Receipta',
    description:
      'The terms for using Receipta, including the one that matters: a Receipta receipt is a proof of payment, not a BIR Official Receipt.',
  },
  '/cookies': {
    title: 'Cookie Policy · Receipta',
    description:
      'Receipta sets no cookies and runs no analytics. What it does keep in your browser, why, and how to clear it.',
  },
}

/** `https://receipta-app.netlify.app/create`, and the bare origin for the home page. */
export function canonical_url(path: string) {
  return path === '/' ? site.url : `${site.url}${path}`
}

/**
 * The head for one route: title, description, and the Open Graph pair kept in step with
 * them. A page whose card says something different from its title is the kind of mismatch
 * nobody notices until a link is shared.
 */
export function head_for(path: string) {
  const meta = page_meta[path]
  const url = canonical_url(path)

  return {
    meta: [
      { title: meta.title },
      { name: 'description', content: meta.description },
      { property: 'og:title', content: meta.title },
      { property: 'og:description', content: meta.description },
      { property: 'og:url', content: url },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}

/**
 * One `WebApplication` block, for the home page only. It describes the app, and the app has
 * one home - repeating it per route is how a site ends up claiming to be five separate
 * applications.
 *
 * `offers` at zero is not decoration: "free" is the single most load-bearing claim on the
 * page, and this is the field a search engine reads it from.
 */
export function app_structured_data() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: site.name,
    url: site.url,
    description: page_meta['/'].description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'PHP' },
  }
}
