import { useMemo } from 'react'
import { LuTriangleAlert } from 'react-icons/lu'

import { build_receipt_view, type ReceiptInput } from '@/entities/receipt'

import { load_ports } from '../lib/load_ports'
import { useReceiptExport, type ExportDependencies } from '../model/use_receipt_export'
import { ExportButtons } from './export_buttons'
import { ReceiptPreview } from './receipt_preview'

const real_dependencies: ExportDependencies = { load_ports }

type ReceiptExportPanelProps = {
  values: ReceiptInput
  /** Replaces the dynamic import and the DOM steps, for tests. */
  dependencies?: ExportDependencies
}

/**
 * The preview of the receipt and the two downloads. The view is built once and handed to
 * both the preview and the export, so the file is made from exactly what is on screen.
 */
export function ReceiptExportPanel({ values, dependencies = real_dependencies }: ReceiptExportPanelProps) {
  const view = useMemo(() => build_receipt_view(values), [values])
  const { busy, error, announcement, start } = useReceiptExport(view, dependencies)

  return (
    <div className="flex flex-col gap-4">
      <ReceiptPreview view={view} />
      <ExportButtons busy={busy} on_start={start} />

      {error !== null && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <LuTriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Present from the start so the first change is announced. The toast says the same. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
