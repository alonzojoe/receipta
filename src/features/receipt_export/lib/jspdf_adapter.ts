import { page_height, page_width } from '@/entities/receipt'

import type { ExportPorts } from '../model/export_ports'

/*
 * No test, on purpose, for the same reason as html2canvas_adapter.ts: jsdom cannot make a
 * PDF worth asserting on. The page size, margins and page count are read from a real file in
 * the browser pass (plan tasks 8 and 12).
 */

/** The slice of jsPDF this file uses, so no static import of the package exists. */
export type JsPdfInstance = {
  setProperties: (properties: { title: string }) => unknown
  addPage: () => unknown
  addImage: (
    data: Uint8Array,
    format: 'PNG',
    x: number,
    y: number,
    width: number,
    height: number,
    alias: string | undefined,
    compression: 'FAST',
  ) => unknown
  output: (type: 'blob') => Blob
}

export type JsPdfConstructor = new (options: {
  unit: 'mm'
  format: 'a4'
  orientation: 'portrait'
  compress: boolean
}) => JsPdfInstance

/** A4 portrait. */
const a4_width_mm = 210
/**
 * 600 px of document are 210 mm, and the same scale applies vertically, so a 849 px page is
 * 297.15 mm: the image is drawn at exactly 210 mm / 600 px, never stretched to the sheet. The
 * extra 0.15 mm falls inside the 40 px (14 mm) bottom margin, which is white.
 */
const image_height_mm = (a4_width_mm * page_height) / page_width

/** Each page image is drawn full-bleed; the 14 mm margin is part of the image. */
export function make_pdf_assembler(JsPdf: JsPdfConstructor): ExportPorts['assemble_pdf'] {
  return async (pages, { title }) => {
    const pdf = new JsPdf({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
    // The title only. No author, and no party name.
    pdf.setProperties({ title })
    pages.forEach((page, index) => {
      if (index > 0) pdf.addPage()
      pdf.addImage(page.png, 'PNG', 0, 0, a4_width_mm, image_height_mm, undefined, 'FAST')
    })
    return pdf.output('blob')
  }
}
