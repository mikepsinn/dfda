/**
 * The status colors of biomarker reports and program pages: teal for a change
 * in the better direction, amber for one to review, stone otherwise. They are
 * theme variables (`--tone-*` in app/globals.css), so they read on every site
 * theme, light or dark, and a printed report uses its paper colors.
 */
export type Tone = "teal" | "amber" | "stone"

// In this file so that Tailwind, which scans components/, generates the classes.
/** `topBorder` colors only the top edge, for a card with a colored top over its ruled sides. */
export const TONE_CLASSES: Record<Tone, { text: string; soft: string; solid: string; border: string; topBorder: string; stroke: string }> = {
  teal: {
    text: "text-[color:var(--tone-teal)]",
    soft: "bg-[color:var(--tone-teal-soft)]",
    solid: "bg-[color:var(--tone-teal)]",
    border: "border-[color:var(--tone-teal)]",
    topBorder: "border-t-[color:var(--tone-teal)]",
    stroke: "var(--tone-teal)",
  },
  amber: {
    text: "text-[color:var(--tone-amber)]",
    soft: "bg-[color:var(--tone-amber-soft)]",
    solid: "bg-[color:var(--tone-amber)]",
    border: "border-[color:var(--tone-amber)]",
    topBorder: "border-t-[color:var(--tone-amber)]",
    stroke: "var(--tone-amber)",
  },
  stone: {
    text: "text-[color:var(--tone-stone)]",
    soft: "bg-[color:var(--tone-stone-soft)]",
    solid: "bg-[color:var(--tone-stone)]",
    border: "border-[color:var(--tone-stone)]",
    topBorder: "border-t-[color:var(--tone-stone)]",
    stroke: "var(--tone-stone)",
  },
}

/** A status as a pill in its tone: the status color on its pale fill. `className` sets the size. */
export function TonePill({ tone, className, children }: { tone: Tone; className?: string; children: React.ReactNode }) {
  const classes = TONE_CLASSES[tone]
  return <span className={`inline-block whitespace-nowrap rounded-full font-medium ${classes.soft} ${classes.text} ${className ?? ""}`}>{children}</span>
}
