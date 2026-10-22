import { STATUS_LABELS } from "@/lib/biomarker-report/format"
import type { ClinicalStatus } from "@/lib/biomarker-report/rules"

/** The report's colors of a status: teal for the intended direction, amber for review, stone otherwise (app/globals.css). */
export type Tone = "teal" | "amber" | "stone"

export function toneOf(status: ClinicalStatus): Tone {
  if (status === "intended") return "teal"
  if (status === "review") return "amber"
  return "stone"
}

// In this file so that Tailwind, which scans components/, generates the classes.
/** `topBorder` colors only the top edge, for a card with a colored top over its ruled sides. */
export const TONE_CLASSES: Record<Tone, { text: string; soft: string; solid: string; border: string; topBorder: string; stroke: string }> = {
  teal: {
    text: "text-[color:var(--report-teal)]",
    soft: "bg-[color:var(--report-teal-soft)]",
    solid: "bg-[color:var(--report-teal)]",
    border: "border-[color:var(--report-teal)]",
    topBorder: "border-t-[color:var(--report-teal)]",
    stroke: "var(--report-teal)",
  },
  amber: {
    text: "text-[color:var(--report-amber)]",
    soft: "bg-[color:var(--report-amber-soft)]",
    solid: "bg-[color:var(--report-amber)]",
    border: "border-[color:var(--report-amber)]",
    topBorder: "border-t-[color:var(--report-amber)]",
    stroke: "var(--report-amber)",
  },
  stone: {
    text: "text-[color:var(--report-stone)]",
    soft: "bg-[color:var(--report-stone-soft)]",
    solid: "bg-[color:var(--report-stone)]",
    border: "border-[color:var(--report-stone)]",
    topBorder: "border-t-[color:var(--report-stone)]",
    stroke: "var(--report-stone)",
  },
}

/** A status as a small pill in its tone. */
export function StatusBadge({ status, label = STATUS_LABELS[status] }: { status: ClinicalStatus; label?: string }) {
  const tone = TONE_CLASSES[toneOf(status)]
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-medium ${tone.soft} ${tone.text}`}>
      {label}
    </span>
  )
}
