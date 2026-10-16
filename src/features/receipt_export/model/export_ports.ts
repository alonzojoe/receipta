/**
 * The seam between the pipeline and the two libraries. Everything on this side is ordinary
 * TypeScript that jsdom can test with stubs; everything behind it (`lib/`) is a few lines
 * that touch a canvas or a third-party package, and holds no decision: no ratio, no blank
 * test, no filename, no error text.
 */

/** A finished raster. A stub is five lines, which is why every failure test can use one. */
export type RenderedCanvas = {
  width: number
  height: number
  /** `null` is what a canvas over the platform's limit gives. */
  to_blob: () => Promise<Blob | null>
  /** RGBA bytes of `rows` rows from `top`. Read in strips so a huge canvas is never copied whole. */
  read_strip: (top: number, rows: number) => Uint8ClampedArray
  /** Frees the pixels. Safe to call twice. */
  release: () => void
}

export type RasteriseOptions = {
  /** Always explicit: the library's default is the device's pixel ratio. */
  ratio: number
  background: string
  /** The node's size in CSS px. */
  width: number
  height: number
}

/** One page of a PDF, as PNG bytes. */
export type PageImage = { png: Uint8Array }

export type ExportPorts = {
  rasterise: (node: HTMLElement, options: RasteriseOptions) => Promise<RenderedCanvas>
  assemble_pdf: (pages: readonly PageImage[], options: { title: string }) => Promise<Blob>
  save: (blob: Blob, filename: string) => void
}
