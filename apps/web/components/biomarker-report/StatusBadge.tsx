import { TonePill, type Tone } from "@/components/status-tone"
import { STATUS_LABELS } from "@/lib/biomarker-report/format"
import type { ClinicalStatus } from "@/lib/biomarker-report/rules"

/** The tone of a status (components/status-tone.tsx): teal for improved, amber for review, stone otherwise. */
export function toneOf(status: ClinicalStatus): Tone {
  if (status === "intended") return "teal"
  if (status === "review") return "amber"
  return "stone"
}

/** A status as a small pill in its tone. */
export function StatusBadge({ status, label = STATUS_LABELS[status] }: { status: ClinicalStatus; label?: string }) {
  return (
    <TonePill tone={toneOf(status)} className="px-1.5 py-px text-[10px]">
      {label}
    </TonePill>
  )
}
