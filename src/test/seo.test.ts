import { describe, expect, it } from 'vitest'

import index_html from '../../index.html?raw'
import robots_txt from '../../public/robots.txt?raw'
import sitemap_xml from '../../public/sitemap.xml?raw'
import { app_structured_data, canonical_url, head_for, page_meta } from '@/shared/config/page_meta'
import { site } from '@/shared/config/site'

const paths = Object.keys(page_meta)
const sitemap_locations = [...sitemap_xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

describe('per-route metadata', () => {
  /**
   * The defect this replaces: every route shipped `index.html`'s single title, so /create
   * and the three legal pages read identically in a search result, a browser tab and a
   * bookmark. A crawler shown five pages with one title has little reason to index more
   * than one of them.
   */
  it('gives every route a title and description that no other route shares', () => {
    const titles = paths.map((path) => page_meta[path].title)
    const descriptions = paths.map((path) => page_meta[path].description)

    expect(new Set(titles).size).toBe(paths.length)
    expect(new Set(descriptions).size).toBe(paths.length)
  })

  it.each(paths)('keeps %s within the lengths a search result actually shows', (path) => {
    const { title, description } = page_meta[path]

    // A result truncates a title near 60 characters and a description near 160.
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title).toContain(site.name)
    expect(description.length).toBeGreaterThanOrEqual(70)
    expect(description.length).toBeLessThanOrEqual(160)
  })

  it.each(paths)('canonicalises %s to one absolute address', (path) => {
    const url = canonical_url(path)

    expect(url.startsWith(site.url)).toBe(true)
    // No trailing slash anywhere, including the home page, so one page is not two URLs.
    expect(url.endsWith('/')).toBe(false)
  })

  /** A card that says something different from the page's own title is a mismatch nobody
   *  notices until a link is shared. */
  it.each(paths)('keeps %s open graph tags in step with its title and canonical', (path) => {
    const head = head_for(path)
    const by_property = Object.fromEntries(
      head.meta
        .filter((tag): tag is { property: string; content: string } => 'property' in tag)
        .map((tag) => [tag.property, tag.content]),
    )

    expect(by_property['og:title']).toBe(page_meta[path].title)
    expect(by_property['og:description']).toBe(page_meta[path].description)
    expect(by_property['og:url']).toBe(canonical_url(path))
    expect(head.links[0]).toEqual({ rel: 'canonical', href: canonical_url(path) })
  })
})

describe('structured data', () => {
  it('describes the app as free, with valid JSON', () => {
    const data = app_structured_data()

    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow()
    expect(data['@type']).toBe('WebApplication')
    expect(data.url).toBe(site.url)
    // "Free" is the most load-bearing claim on the page, and this is the field a search
    // engine reads it from.
    expect(data.offers.price).toBe('0')
  })
})

describe('robots.txt and sitemap.xml', () => {
  it('lets every crawler in and points at the sitemap', () => {
    expect(robots_txt).toMatch(/User-agent:\s*\*/)
    expect(robots_txt).toMatch(/Allow:\s*\//)
    expect(robots_txt).not.toMatch(/^Disallow:\s*\/$/m)
    expect(robots_txt).toContain(`${site.url}/sitemap.xml`)
  })

  /**
   * The guard that matters. Adding a route and forgetting the sitemap is silent: the page
   * works, nothing fails, and it simply never gets crawled. This makes that impossible to
   * merge.
   */
  it('lists every route the app has, and nothing it does not', () => {
    const expected = paths.map(canonical_url).sort()
    expect([...sitemap_locations].sort()).toEqual(expected)
  })

  it('is valid sitemap XML with a lastmod on every entry', () => {
    expect(sitemap_xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/)
    expect(sitemap_xml).toContain('http://www.sitemaps.org/schemas/sitemap/0.9')

    const entries = [...sitemap_xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    expect(entries).toHaveLength(paths.length)
    for (const [, entry] of entries) {
      expect(entry).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    }
  })
})

describe('the static shell', () => {
  /**
   * Most crawlers and every social-card scraper run no JavaScript, so this is what they
   * see. It must be true on its own, not a placeholder waiting for the router.
   */
  it('still carries a true title and description without JavaScript', () => {
    expect(index_html).toMatch(/<title>[^<]{10,}<\/title>/)
    expect(index_html).toMatch(/<meta\s+name="description"/)
    expect(index_html).toContain('Receipta')
  })
})
