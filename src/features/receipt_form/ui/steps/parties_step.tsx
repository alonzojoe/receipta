import type { ReceiptFormApi } from '../../model/use_receipt_form'
import { PartySection } from '../party_section'

type PartiesStepProps = { form: ReceiptFormApi }

export function PartiesStep({ form }: PartiesStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <PartySection form={form} party="issuer" />
      <PartySection form={form} party="recipient" />
    </div>
  )
}
