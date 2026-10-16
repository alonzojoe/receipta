import type { ExportPorts } from '../model/export_ports'
import { download_blob } from './download_blob'
import { make_rasteriser, type Html2Canvas } from './html2canvas_adapter'
import { make_pdf_assembler, type JsPdfConstructor } from './jspdf_adapter'

/**
 * The ONLY file in the repository with an `import()` of html2canvas-pro or jspdf. Everything
 * else takes the loaded ports as an argument, which is what makes the orchestrator testable
 * with stubs and keeps both libraries out of the entry chunk: nobody on the home page, or
 * filling in step 1, pays for a canvas library. They load on the first export click.
 */
export async function load_ports(): Promise<ExportPorts> {
  const [html2canvas_module, jspdf_module] = await Promise.all([import('html2canvas-pro'), import('jspdf')])
  const html2canvas: Html2Canvas = html2canvas_module.default
  const JsPdf: JsPdfConstructor = jspdf_module.jsPDF
  return {
    rasterise: make_rasteriser(html2canvas),
    assemble_pdf: make_pdf_assembler(JsPdf),
    save: download_blob,
  }
}
