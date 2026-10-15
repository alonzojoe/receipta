import type { ImageCodec } from './image_pipeline'
import { paint_on_white } from './paint_on_white'

/*
 * The browser adapter. It has NO unit test, on purpose: jsdom has no canvas, no
 * `createImageBitmap` and decodes no images, so a test here would assert against a stub
 * and prove nothing about a real browser. Decoding, EXIF orientation, white flattening
 * and real encoded size are checked in a real browser (task 6 of the receipt form plan,
 * and again through the UI in task 17). Do not add an empty-shell test.
 *
 * Deliberately thin: no EXIF parser, no library.
 */

function blob_to_data_url(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function canvas_to_jpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // A browser that cannot encode JPEG falls back to PNG. That would be far over the
        // limit and the wrong type, so it is a failure, not a result.
        if (blob && blob.type === 'image/jpeg') resolve(blob)
        else reject(new Error('The browser could not encode a JPEG'))
      },
      'image/jpeg',
      quality,
    )
  })
}

export const canvas_codec: ImageCodec<ImageBitmap> = {
  async decode(file) {
    // Asked for explicitly rather than relying on the default: evergreen browsers apply
    // the EXIF orientation, so a portrait phone photo is not drawn on its side.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return { width: bitmap.width, height: bitmap.height, handle: bitmap }
  },

  async encode(bitmap, width, height, quality) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    try {
      const context = canvas.getContext('2d')
      if (!context) throw new Error('No 2D canvas context')
      context.imageSmoothingQuality = 'high'
      paint_on_white(context, bitmap, width, height)
      const blob = await canvas_to_jpeg(canvas, quality)
      return { data_url: await blob_to_data_url(blob), bytes: blob.size }
    } finally {
      // Safari holds canvas memory until the size is reset.
      canvas.width = 0
      canvas.height = 0
    }
  },

  release(bitmap) {
    bitmap.close()
  },
}
