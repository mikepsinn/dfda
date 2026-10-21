import { STATUS_LABELS } from "@/lib/biomarker-report/format"
import type { ClinicalStatus } from "@/lib/biomarker-report/rules"

// In this file so that Tailwind, which scans components/, generates the classes.
export const STATUS_CLASSES: Record<ClinicalStatus, string> = {
  intended: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  unchanged: "bg-muted text-foreground",
  review: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
  "below-limit": "bg-muted text-muted-foreground",
  changed: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
}

/** The colors of a panel index bar, by the panel's verdict. */
export const BAR_CLASSES = {
  intended: "bg-emerald-500",
  unchanged: "bg-muted-foreground/50",
  review: "bg-amber-500",
} as const

export function StatusBadge({ status }: { status: ClinicalStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
