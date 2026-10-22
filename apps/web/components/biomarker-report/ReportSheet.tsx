/** What every page of a report repeats: the brand, the report's name, the patient and the page count. */
export type SheetFrame = {
  brandName?: string
  reportName: string
  footerNote?: string
  total: number
}

/**
 * One page of a report, as on the printed report: an A4 sheet with a running
 * header (brand, section, patient) and footer (report, note, page number). In
 * print each sheet is one page. On screen the sheets are sections of one page
 * of the site, each headed by its section name; the brand, the patient and the
 * page numbers are for paper only (app/globals.css).
 * `label` names the sheet for assistive technology when it has no heading of
 * its own to name it. The cover (`footer={false}`) has no running footer. A
 * sheet whose heading is its section name (`sectionInPrintOnly`) shows the
 * running header in print only, so that the screen does not repeat the name.
 */
export function ReportSheet({
  frame,
  number,
  section,
  personLine,
  id,
  labelledBy,
  label,
  footer = true,
  sectionInPrintOnly = false,
  children,
}: {
  frame: SheetFrame
  number: number
  section?: string
  personLine?: string
  id?: string
  labelledBy?: string
  label?: string
  footer?: boolean
  sectionInPrintOnly?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className="report-sheet mx-auto flex w-full max-w-[52rem] scroll-mt-24 flex-col py-8 text-[13.5px] leading-relaxed md:py-12"
    >
      {section && (
        <div
          className={`mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[12px] report-muted ${sectionInPrintOnly ? "report-print-only" : ""}`}
        >
          <p className="flex items-baseline gap-3">
            {frame.brandName && (
              <span className="report-print-only report-serif text-[17px] text-[color:var(--report-ink)]">{frame.brandName}</span>
            )}
            <span>{section}</span>
          </p>
          {personLine && <p className="report-print-only">{personLine}</p>}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-5">{children}</div>
      {footer && (
        <div className="report-print-only report-rule mt-10 grid gap-x-4 gap-y-1 border-t pt-3 text-[10.5px] report-muted sm:grid-cols-[auto_auto_auto] sm:justify-between">
          <span>{[frame.brandName, frame.reportName].filter(Boolean).join(" ")}</span>
          {frame.footerNote && <span className="sm:text-center">{frame.footerNote}</span>}
          <span className="whitespace-nowrap">
            Page {number} of {frame.total}
          </span>
        </div>
      )}
    </section>
  )
}
