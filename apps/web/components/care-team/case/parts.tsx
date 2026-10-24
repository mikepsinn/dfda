/** The case page's small parts: its cards, labels and the serif of a printed report. */

/** The serif of the biomarker report (app/layout.tsx), for names and large numbers. */
export const SERIF = "[font-family:var(--font-report-serif),Georgia,serif] font-medium tracking-tight"

/** A short label above a heading. */
export function Eyebrow({ children, className = "text-primary" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${className}`}>{children}</p>
}

export function CaseCard({ children, className = "", ...rest }: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) {
  return (
    <section className={`surface-raised rounded-3xl border bg-card p-5 sm:p-6 ${className}`} {...rest}>
      {children}
    </section>
  )
}

/** Week 0 is "Day 0"; later weeks are "Wk 4", earlier ones "Wk −1". */
export function weekLabel(week: number): string {
  if (week === 0) return "Day 0"
  return `Wk ${week < 0 ? `−${-week}` : week}`
}

/** A change in percent with its sign: "+12%", "−50%". */
export function formatPercent(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 0) return "0%"
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)}%`
}
