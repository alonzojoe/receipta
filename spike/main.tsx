import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'

import '@/index.css'
import { ReceiptExportPanel } from '@/features/receipt_export'
import { load_ports } from '@/features/receipt_export/lib/load_ports'
import type { ExportPorts, RenderedCanvas } from '@/features/receipt_export/model/export_ports'
import type { ReceiptInput } from '@/entities/receipt'

type Mode = 'real' | 'transparent' | 'white' | 'null_blob'
type Setup = { fixture: string; dark: boolean; max_pixels?: number; mode: Mode }

declare global {
  interface Window {
    __saved: { filename: string; size: number; type: string; text?: string }[]
    __pages: { kind: string; bytes: number[] }[]
    __rasterise: { ratio: number; width: number; height: number; background: string; canvas_w: number; canvas_h: number }[]
    __setup: (setup: Setup) => Promise<void>
    __ready: boolean
  }
}
window.__saved = []
window.__pages = []
window.__rasterise = []

let seed = 12345
function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
function photo(index: number) {
  seed = 12345 + Math.floor(index)
  const portrait = index % 2 === 0
  const w = portrait ? 600 : 800
  const h = portrait ? 800 : 600
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, `hsl(${(index * 37) % 360} 70% 50%)`)
  grad.addColorStop(1, `hsl(${(index * 37 + 120) % 360} 70% 30%)`)
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  // noise so the JPEG is a realistic size, and an off-centre marker to show the crop
  for (let i = 0; i < 3000; i += 1) {
    g.fillStyle = `rgba(${rnd() * 255},${rnd() * 255},${rnd() * 255},0.5)`
    g.fillRect(rnd() * w, rnd() * h, 6, 6)
  }
  g.fillStyle = 'white'
  g.font = 'bold 90px sans-serif'
  g.fillText(portrait ? 'P' + index : 'L' + index, 20, 100)
  g.strokeStyle = 'black'
  g.lineWidth = 8
  g.strokeRect(4, 4, w - 8, h - 8)
  return c.toDataURL('image/jpeg', 0.8)
}

const base: ReceiptInput = {
  receipt_no: 'REF-20261016-154212',
  receipt_date: '2026-10-16',
  issuer_name: 'Mabini Print Shop',
  recipient_name: 'Juan Dela Cruz',
  items: [
    { name: 'Printing', quantity: '2', price: '150', image: null },
    { name: 'Lamination', quantity: '1.5', price: '19.99', image: null },
  ],
  discount: '',
  payment_method: 'gcash',
  other_method: '',
  reference_no: '9876543210',
  notes: 'Thank you',
}

const long100 = 'Extra-large laminated tarpaulin banner with grommets and reinforced hems for outdoor display, 3x6 ft'

function fixture(name: string): ReceiptInput {
  switch (name) {
    case 'common':
      return base
    case 'discount':
      return { ...base, discount: '50' }
    case 'cash':
      return { ...base, payment_method: 'cash', reference_no: '' }
    case 'items50': {
      return { ...base, items: Array.from({ length: 50 }, (_, i) => ({ name: `Item number ${i + 1}`, quantity: String((i % 4) + 1), price: String(100 + i * 3.5), image: null })) }
    }
    case 'items50photos10': {
      return {
        ...base,
        items: Array.from({ length: 50 }, (_, i) => ({
          name: `Item number ${i + 1}`,
          quantity: String((i % 4) + 1),
          price: String(100 + i * 3.5),
          image: i % 5 === 0 ? photo(i / 5) : null,
        })),
      }
    }
    case 'long':
      return {
        ...base,
        issuer_name: 'I'.repeat(10) + ' ' + 'Ñandú Trading and General Merchandise Corporation of the Philippines Incorporated Branch 7'.slice(0, 89),
        recipient_name: 'R'.repeat(5) + ' ' + 'Maria Clara de los Santos y Dela Cruz-Villanueva the Third of Quezon City Metro Manila'.slice(0, 94),
        items: [
          { name: long100, quantity: '2', price: '150', image: photo(1) },
          { name: long100.replace('Extra', 'Ultra'), quantity: '1', price: '999999.99', image: null },
          { name: 'short', quantity: '9999.999', price: '999999.99', image: photo(2) },
        ],
        notes: 'Line one of the note\nLine two of the note\nLine three of the note\nLine four of the note\nLine five of the note',
        discount: '10',
      }
    case 'unicode':
      return { ...base, issuer_name: 'Ñandú 山田商店 🍜 Panaderya', recipient_name: 'José Ñ. 李小龍', notes: '<script>alert(1)</script>\nñ 日本語' }
    case 'five_discount':
      return {
        ...base,
        discount: '20',
        items: Array.from({ length: 5 }, (_, i) => ({ name: `Item ${i + 1}`, quantity: '1', price: '100', image: null })),
      }
    case 'five':
      return {
        ...base,
        items: Array.from({ length: 5 }, (_, i) => ({ name: `Item ${i + 1}`, quantity: '1', price: '100', image: null })),
      }
    case 'one_item_worst':
      return { ...base, discount: '10', items: [{ name: long100, quantity: '1', price: '100', image: null }], notes: 'n\nn\nn\nn\nn' }
    default:
      throw new Error('unknown fixture ' + name)
  }
}

function wrap_canvas(canvas: HTMLCanvasElement): RenderedCanvas {
  return {
    width: canvas.width,
    height: canvas.height,
    to_blob: () => new Promise((resolve) => canvas.toBlob(resolve, 'image/png')),
    read_strip: (top, rows) => canvas.getContext('2d')!.getImageData(0, top, canvas.width, rows).data,
    release: () => {
      canvas.width = 0
      canvas.height = 0
    },
  }
}

let root: ReturnType<typeof createRoot> | null = null
const host = document.getElementById('root')!
createRoot(document.body.appendChild(document.createElement('div'))).render(<Toaster />)

window.__setup = async ({ fixture: name, dark, max_pixels, mode }) => {
  document.documentElement.classList.toggle('dark', dark)
  const real = await load_ports()
  const ports: ExportPorts = {
    rasterise: async (node, options) => {
      const canvas = await real.rasterise(node, options)
      window.__rasterise.push({ ...options, canvas_w: canvas.width, canvas_h: canvas.height })
      if (mode === 'real') return canvas
      // Replace the finished raster with a bad one of the same size, built like the adapter's.
      const bad = document.createElement('canvas')
      bad.width = canvas.width
      bad.height = canvas.height
      if (mode === 'white') {
        const g = bad.getContext('2d')!
        g.fillStyle = 'white'
        g.fillRect(0, 0, bad.width, bad.height)
      }
      const rendered = wrap_canvas(bad)
      if (mode === 'null_blob') rendered.to_blob = async () => null
      return rendered
    },
    assemble_pdf: async (pages, options) => {
      pages.forEach((p, i) => window.__pages.push({ kind: `page${i + 1}`, bytes: Array.from(p.png) }))
      return real.assemble_pdf(pages, options)
    },
    save: (blob, filename) => {
      window.__saved.push({ filename, size: blob.size, type: blob.type })
      real.save(blob, filename)
    },
  }
  root?.unmount()
  root = createRoot(host)
  root.render(
    <main style={{ padding: 16, maxWidth: 800 }}>
      <ReceiptExportPanel
        values={fixture(name)}
        dependencies={{ load_ports: async () => ports, env: max_pixels === undefined ? undefined : { max_pixels } }}
      />
    </main>,
  )
}
window.__ready = true
