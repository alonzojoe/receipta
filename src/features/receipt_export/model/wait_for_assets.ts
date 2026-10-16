/** What did not load. The caller decides which of these block the export. */
export type AssetFailure =
  /** An item photo, 1-based as the user counts items. */
  | { kind: 'photo'; item: number }
  | { kind: 'payment_logo' }
  | { kind: 'receipta_logo' }

export type AssetSources = {
  /** `document.fonts.load`, then `ready`. */
  load_font: (font: string, text: string) => Promise<unknown>
  fonts_ready: () => Promise<unknown>
  decode: (image: HTMLImageElement) => Promise<void>
}

/**
 * The weights the document uses. `₱` is in Geist's latin-ext file, which the browser only
 * fetches when a character in range is on the page, and a node mounted off-screen can let
 * `document.fonts.ready` resolve with that face still unloaded (the task 1 spike measured
 * it). So each weight is loaded explicitly with the peso sign in the sample.
 */
const weights = [400, 500, 600] as const
const sample = '₱0123456789 AaBbCc Receipt'

export function default_sources(): AssetSources {
  return {
    load_font: async (font, text) => document.fonts?.load(font, text),
    fonts_ready: async () => document.fonts?.ready,
    // An environment with no decode() (jsdom) has nothing to wait for.
    decode: (image) => (typeof image.decode === 'function' ? image.decode() : Promise.resolve()),
  }
}

function classify(image: HTMLImageElement): AssetFailure | undefined {
  const item = image.getAttribute('data-item')
  if (item !== null) return { kind: 'photo', item: Number(item) }
  const logo = image.getAttribute('data-logo')
  if (logo === 'payment') return { kind: 'payment_logo' }
  if (logo === 'receipta') return { kind: 'receipta_logo' }
  return undefined
}

/**
 * Waits for the fonts and for every image in the node to decode, then reports which images
 * failed. A capture that starts before an image decodes is the usual cause of an export
 * missing a photo, and a late font changes wrapping, which changes every measured height, so
 * nothing is measured or captured until this resolves.
 *
 * A font that fails to load is not an error: the CSS stack falls back and the content is
 * right. An image failure is reported, not thrown, because only the caller knows that a
 * photo blocks the export and a logo does not.
 */
export async function wait_for_assets(
  node: ParentNode,
  sources: AssetSources = default_sources(),
): Promise<AssetFailure[]> {
  await Promise.allSettled(weights.map(async (weight) => sources.load_font(`${weight} 15px "Geist Variable"`, sample)))
  await Promise.allSettled([(async () => sources.fonts_ready())()])

  const images = [...node.querySelectorAll('img')]
  const results = await Promise.allSettled(images.map(async (image) => sources.decode(image)))

  const failures: AssetFailure[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') return
    const failure = classify(images[index])
    if (failure && !failures.some((known) => JSON.stringify(known) === JSON.stringify(failure))) failures.push(failure)
  })
  return failures
}
