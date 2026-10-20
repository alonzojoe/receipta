import { describe, expect, it } from 'vitest'

import index_html from '../../index.html?raw'
import netlify_toml from '../../netlify.toml?raw'

/**
 * The deploy config is not covered by any other test, and two of its values are the kind
 * that fail silently in production rather than loudly in a build:
 *
 * - a wrong script hash blocks the theme guard, and the only symptom is a white flash on
 *   every load for dark-mode users;
 * - a missing SPA redirect 404s every route but `/`, which is how a shared link arrives.
 *
 * Neither shows up locally, because `vite dev` serves no headers and rewrites every path.
 */

const inline_scripts = [...index_html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
  (match) => match[1],
)

const csp = netlify_toml.match(/Content-Security-Policy = "([^"]+)"/)?.[1] ?? ''

function directive(name: string) {
  return csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `))
}

describe('netlify.toml', () => {
  it('builds with the project build and publishes what vite emits', () => {
    expect(netlify_toml).toMatch(/command = "npm run build"/)
    expect(netlify_toml).toMatch(/publish = "dist"/)
  })

  /**
   * TanStack Router resolves paths in the browser. Without this every route but `/` is a
   * 404 on a hard refresh or a shared link.
   */
  it('serves index.html for every path, so a deep link does not 404', () => {
    expect(netlify_toml).toMatch(/from = "\/\*"/)
    expect(netlify_toml).toMatch(/to = "\/index\.html"/)
    expect(netlify_toml).toMatch(/status = 200/)
  })

  /**
   * The one that fails silently. Vite copies the inline script into dist unchanged, so the
   * hash of the source is the hash of what ships. Edit the theme guard without updating
   * the CSP and the browser blocks it: no error anyone sees, just the white flash the
   * script exists to prevent.
   */
  it('hashes the inline theme script into the CSP, so editing it cannot silently break it', async () => {
    expect(inline_scripts).toHaveLength(1)

    // Web Crypto rather than node:crypto: @types/node is not in tsconfig.app.json, so the
    // node import type-checks fine under vitest and fails `tsc -b` - which is the command
    // the deploy itself runs.
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(inline_scripts[0]))
    const digest = btoa(String.fromCharCode(...new Uint8Array(bytes)))
    const script_src = directive('script-src')

    expect(script_src, 'no script-src in the CSP').toBeDefined()
    expect(script_src, `the inline script changed; its hash is now sha256-${digest}`).toContain(
      `'sha256-${digest}'`,
    )
  })

  it('allows no third-party origin, which is what the Privacy Policy promises', () => {
    expect(directive('default-src')).toBe("default-src 'self'")
    expect(directive('connect-src')).toBe("connect-src 'self'")
    expect(directive('font-src')).toBe("font-src 'self'")
    // No scheme that could reach another host.
    expect(csp).not.toMatch(/https?:(?!\/\/)|\*/)
  })

  /** Item photos are data URLs and the PNG export produces a blob. Both must be allowed. */
  it('allows the image sources the export actually uses', () => {
    const img = directive('img-src') ?? ''
    expect(img).toContain('data:')
    expect(img).toContain('blob:')
  })

  it('refuses framing, sniffing and a referrer, and grants no device permission', () => {
    expect(netlify_toml).toMatch(/X-Frame-Options = "DENY"/)
    expect(netlify_toml).toMatch(/X-Content-Type-Options = "nosniff"/)
    expect(netlify_toml).toMatch(/Referrer-Policy = "no-referrer"/)
    expect(csp).toContain("frame-ancestors 'none'")

    const permissions = netlify_toml.match(/Permissions-Policy = "([^"]+)"/)?.[1] ?? ''
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
      expect(permissions, `${feature} is not denied`).toContain(`${feature}=()`)
    }
  })

  /**
   * Vite fingerprints `/assets`, so that content is immutable; `index.html` is not
   * fingerprinted, so caching it would leave people on an old deploy.
   */
  it('caches the fingerprinted assets forever and revalidates the entry point', () => {
    expect(netlify_toml).toMatch(/for = "\/assets\/\*"[\s\S]*?max-age=31536000, immutable/)
    expect(netlify_toml).toMatch(/for = "\/index\.html"[\s\S]*?max-age=0, must-revalidate/)
  })

  it('pins the Node version, so a Netlify default cannot change the build', () => {
    expect(netlify_toml).toMatch(/NODE_VERSION = "22"/)
  })
})
