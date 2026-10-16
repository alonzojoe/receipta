import type { ExportPorts, RenderedCanvas } from '../model/export_ports'

/*
 * No test, on purpose: jsdom has no canvas, so a test here would assert a mock of a mock.
 * The real thing is proven in a browser (receipt-export plan, tasks 8 and 12). Nobody
 * should add an empty-shell test later: put the decision in model/, where it is testable.
 *
 * This file makes no decision. The ratio, the background, the blank check and the error
 * text all arrive from, or are made by, the orchestrator.
 */

/** The slice of html2canvas-pro this file uses, so no static import of the package exists. */
export type Html2Canvas = (
  element: HTMLElement,
  options: {
    scale: number
    backgroundColor: string
    width: number
    height: number
    windowWidth: number
    windowHeight: number
    logging: boolean
  },
) => Promise<HTMLCanvasElement>

function wrap(canvas: HTMLCanvasElement): RenderedCanvas {
  return {
    width: canvas.width,
    height: canvas.height,
    to_blob: () => new Promise((resolve) => canvas.toBlob(resolve, 'image/png')),
    read_strip: (top, rows) => {
      const context = canvas.getContext('2d')
      if (!context) throw new Error('The canvas has no 2d context.')
      return context.getImageData(0, top, canvas.width, rows).data
    },
    release: () => {
      canvas.width = 0
      canvas.height = 0
    },
  }
}

/**
 * `scale` is always set: left to itself the library uses the device's pixel ratio, and a
 * phone at 3x would make a 1800 px image where the plan says 1200. `useCORS` and
 * `allowTaint` are left unset: every image is a data URL or same-origin, and a tainted
 * canvas could not be exported anyway.
 */
export function make_rasteriser(html2canvas: Html2Canvas): ExportPorts['rasterise'] {
  return async (node, { ratio, background, width, height }) => {
    const canvas = await html2canvas(node, {
      scale: ratio,
      backgroundColor: background,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      logging: false,
    })
    return wrap(canvas)
  }
}
