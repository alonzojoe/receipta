/** The slice of a 2D canvas context that painting needs. A fake stands in for it in tests. */
export type PaintContext = {
  createImageData: (width: number, height: number) => ImageData
  putImageData: (data: ImageData, x: number, y: number) => void
  drawImage: (source: CanvasImageSource, x: number, y: number, w: number, h: number) => void
}

/**
 * Lays down an opaque white backing, then draws the image over it, so a transparent PNG
 * flattens to white instead of the black a JPEG makes of alpha 0.
 *
 * The white is made by filling every channel, alpha included, with 255. That keeps a
 * colour literal out of the source: colours live in `index.css`, and this is image data,
 * not a theme colour, so it must not follow the app theme either.
 */
export function paint_on_white(
  context: PaintContext,
  source: CanvasImageSource,
  width: number,
  height: number,
) {
  const backing = context.createImageData(width, height)
  backing.data.fill(255)
  context.putImageData(backing, 0, 0)
  context.drawImage(source, 0, 0, width, height)
}
