/**
 * Every numeric limit from the receipt form spec, in one place. Money is held in
 * integers: price in centavos, quantity in thousandths.
 */

/** 999,999.99 pesos, in centavos. Also the ceiling for a discount. */
export const price_max_centavos = 99_999_999

/** 9,999.999 units, in thousandths. */
export const quantity_max_thousandths = 9_999_999

export const price_decimals = 2
export const quantity_decimals = 3

/** Thousandths of a unit in one unit; the divisor when a quantity meets a price. */
export const thousandths_per_unit = 1000

export const name_max_length = 100
export const other_method_max_length = 50
export const reference_max_length = 40
export const notes_max_length = 300
export const notes_max_lines = 5

export const items_min = 1
export const items_max = 50

/** At most this many photos on one receipt. */
export const images_max = 10

/** A source file larger than this is refused before it is decoded. 10 MB. */
export const image_source_max_bytes = 10 * 1024 * 1024

/**
 * A source image with more pixels than this is refused before it is decoded.
 * The byte cap does not bound this, because a tiny PNG or JPEG can declare enormous
 * dimensions, and decoding allocates width x height x 4 bytes (256 MB at the limit).
 *
 * 64 MP, not 50. A phone sold as "50 MP" does not emit 50,000,000 pixels: 8160x6120 is
 * 49.9 MP, but 8160x6144 is 50.13 MP and 8192x6144 is 50.33 MP. A 50 MP limit sits on a
 * cliff and refuses real photos from the cameras it was chosen to admit. 64 MP clears
 * every 48 and 50 MP frame with room to spare, bounds a decode at about 256 MB, and
 * still refuses the 108 and 200 MP modes with a message that says why.
 */
export const image_max_pixels = 64_000_000

/**
 * 120 KB is taken as 120 x 1024 bytes of the encoded JPEG blob, not of the base64
 * string. Base64 adds a third, so the worst case stored per image is about 160 KB.
 */
export const image_max_bytes = 120 * 1024

/** Longest edge, in pixels, of a stored image. */
export const image_max_edge = 800

/** Last-resort longest edge once the quality ladder has run out at 800. */
export const image_fallback_edge = 600

/** JPEG qualities tried at each edge, best first. */
export const image_qualities: readonly number[] = [0.8, 0.7, 0.6, 0.5]

/** The serialised draft may not exceed this many characters. */
export const draft_max_chars = 2_000_000

/**
 * Longest data URL a stored image can have: base64 is 4 characters per 3 bytes, plus the
 * `data:image/jpeg;base64,` prefix. Used by the draft shape guard, not the pipeline.
 */
export const image_data_url_max_chars = Math.ceil(image_max_bytes / 3) * 4 + 32

/** The longest text a draft may hold in any one typed field. Far above every real limit. */
export const draft_text_max_chars = 10_000
