import { z } from 'zod'
import { BETTER } from '@/lib/programs/config'

/**
 * The data file of a biomarker report: one person's blood markers at several
 * timepoints of a program, read against that person's own noise, with the
 * clinic's lab values and the report's text. The file holds measured values
 * and text only; rules.ts calculates every change, status and count, so the
 * numbers on a report cannot contradict each other.
 *
 * Demo reports use made-up values (example.ts). An instance shows them as a
 * product demo; they are never evidence, and no Outcome Label, ranking or
 * company total reads them.
 */

export const MAX_TIMEPOINTS = 8

const text = (max: number) => z.string().trim().min(1).max(max)
const optionalText = (max: number) => text(max).optional()

/** One value per timepoint. Null: no quantified value (below the lower limit, or not measured then). */
const valuesSchema = z.array(z.number().finite().nullable())

export const timepointSchema = z.object({
  label: text(40),
  /** Weeks since the start of the program. */
  week: z.number().min(0).max(520),
})

/** A blood marker, read against the person's own noise. */
export const markerSchema = z.object({
  /** A short identifier, such as the gene symbol ("CRP"). */
  id: text(40),
  name: text(120),
  note: optionalText(160),
  unit: text(20),
  values: valuesSchema,
  /** The person's expected variation without a real change (one standard deviation), in `unit`. */
  noise: z.number().positive(),
  /** The direction that the program intends. */
  intended: z.enum(['up', 'down']),
  /** The lowest value the assay quantifies, shown as "< limit" for a null value. */
  lowerLimit: z.number().positive().optional(),
})

/** Markers of one organ system or pathway. */
export const panelSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(40),
  name: text(60),
  /** What the panel shows. Left out, the upload writes it from the numbers (text.ts). */
  summary: optionalText(600),
  markers: z.array(markerSchema).min(1).max(60),
})

/** A value from the clinic's accredited laboratory, or a clinic measurement such as weight. */
export const clinicalValueSchema = z.object({
  name: text(60),
  unit: text(20),
  values: valuesSchema,
  /** The reference interval as text, for example "< 5.7" or "7–35". */
  reference: optionalText(40),
  better: z.enum(BETTER),
  /** The smallest change, in percent of the first value, that counts as a change. */
  meaningfulChange: z.number().positive().max(1000),
  lowerLimit: z.number().positive().optional(),
  note: optionalText(200),
})

/** A titled list of short paragraphs, for text that has no place of its own below. */
export const sectionSchema = z.object({
  title: text(80),
  items: z.array(text(800)).min(1).max(12),
})

/** A short paragraph that starts with a bold lead, such as "Lean mass." */
export const leadTextSchema = z.object({ lead: text(80), text: text(600) })

/** A note next to the clinical values: "review" for one worth a look, "info" for context. */
export const clinicalNoteSchema = z.object({ tone: z.enum(['review', 'info']), lead: text(80), text: text(400) })

/** The dose of the program's drug from a week on, until the next step. */
export const doseStepSchema = z.object({ week: z.number().min(0).max(520), amount: z.number().positive() })

/** An effect that the person reported, for a range of weeks. */
export const effectSchema = z.object({ weeks: text(20), text: text(200), severity: z.enum(['mild', 'notable', 'resolved']) })

/** A marker outside the report's panels, with its change only: an exploratory list. */
export const moverSchema = z.object({
  id: text(40),
  name: text(120),
  percentChange: z.number().finite(),
  noiseMultiple: z.number().nonnegative(),
  /** Timepoints with a quantified value, of `of`. */
  detected: z.number().int().min(0),
  of: z.number().int().positive(),
})

export const biomarkerReportSchema = z
  .object({
    version: z.literal(1),
    title: text(160),
    subtitle: optionalText(400),
    reportDate: z.string().date(),
    person: z.object({
      name: text(60),
      code: optionalText(30),
      age: z.number().int().min(0).max(130).optional(),
      sex: optionalText(20),
    }),
    program: z.object({ name: text(80), indication: optionalText(160) }),
    clinician: z.object({ name: text(80), organization: optionalText(120), location: optionalText(80) }).optional(),
    collection: optionalText(200),
    platform: optionalText(200),
    /** The report's kind and edition, above the title: "Proteomic response report · Clinician edition". */
    edition: optionalText(80),
    /** What the report calls its markers. */
    markerNoun: z.enum(['marker', 'protein']).default('marker'),
    /** How many markers the platform measured, of which the panels show a curated part. */
    assayCount: z.number().int().positive().max(100_000).optional(),
    /** At the foot of the first page: what the values are, and are not, for. */
    disclaimer: optionalText(600),
    /** In the middle of every page footer, such as "Research Use Only". */
    footerNote: optionalText(120),
    timepoints: z.array(timepointSchema).min(2).max(MAX_TIMEPOINTS),
    /** A marker counts as changed when its change is at least this many times its noise. */
    threshold: z.number().positive().max(10).default(1.5),
    clinicalValues: z.array(clinicalValueSchema).max(40).default([]),
    /** Above the clinical values: where they come from. */
    clinicalIntro: optionalText(400),
    clinicalNotes: z.array(clinicalNoteSchema).max(6).default([]),
    dose: z.object({ unit: text(20), steps: z.array(doseStepSchema).min(1).max(12), note: optionalText(200) }).optional(),
    effects: z.array(effectSchema).max(12).default([]),
    /**
     * The text of the cards on the summary page: why the panels in each group moved or not, and when to measure next.
     * The upload writes a card's text that the file leaves out from the numbers (text.ts).
     */
    glance: z
      .object({ intended: optionalText(300), unchanged: optionalText(300), review: optionalText(300), nextWindow: leadTextSchema.optional() })
      .optional(),
    panels: z.array(panelSchema).min(1).max(20),
    /** Under every panel table, after the general note: how the values were measured. */
    panelNote: optionalText(600),
    /** The page for the visit: what to discuss, when to measure next, the person's likely questions and the report's limits. */
    visit: z
      .object({
        discussion: z.array(leadTextSchema).max(8).default([]),
        nextWindow: z.object({ lead: text(80), text: text(300), detail: optionalText(400) }).optional(),
        questions: z.array(text(300)).max(8).default([]),
        limits: z.array(leadTextSchema).max(6).default([]),
        companion: leadTextSchema.optional(),
      })
      .optional(),
    /** How the report was produced: platform, specimen, batching, noise and so on. */
    methods: z.array(z.object({ term: text(40), text: text(800) })).max(12).default([]),
    movers: z.object({ intro: text(400), items: z.array(moverSchema).min(1).max(40), note: optionalText(400) }).optional(),
    sections: z.array(sectionSchema).max(12).default([]),
  })
  .superRefine((report, context) => {
    const issue = (path: (string | number)[], message: string) => context.addIssue({ code: z.ZodIssueCode.custom, path, message })
    const count = report.timepoints.length

    report.timepoints.forEach((timepoint, index) => {
      if (index > 0 && timepoint.week <= report.timepoints[index - 1].week) {
        issue(['timepoints', index, 'week'], 'Timepoints must be in order, each later than the one before.')
      }
    })
    report.dose?.steps.forEach((step, index, steps) => {
      if (index > 0 && step.week <= steps[index - 1].week) issue(['dose', 'steps', index, 'week'], 'Dose steps must be in order of week.')
    })
    report.movers?.items.forEach((mover, index) => {
      if (mover.detected > mover.of) issue(['movers', 'items', index, 'detected'], 'A marker cannot be detected at more timepoints than there are.')
    })
    report.clinicalValues.forEach((value, index) => {
      if (value.values.length !== count) issue(['clinicalValues', index, 'values'], `Give ${count} values, one per timepoint.`)
    })
    const panelIds = new Set<string>()
    report.panels.forEach((panel, panelIndex) => {
      if (panelIds.has(panel.id)) issue(['panels', panelIndex, 'id'], 'Each panel needs its own id.')
      panelIds.add(panel.id)
      const markerIds = new Set<string>()
      panel.markers.forEach((marker, markerIndex) => {
        const path = ['panels', panelIndex, 'markers', markerIndex]
        if (markerIds.has(marker.id)) issue([...path, 'id'], 'Each marker in a panel needs its own id.')
        markerIds.add(marker.id)
        if (marker.values.length !== count) issue([...path, 'values'], `Give ${count} values, one per timepoint.`)
      })
    })
  })

export type BiomarkerReport = z.infer<typeof biomarkerReportSchema>
export type BiomarkerReportInput = z.input<typeof biomarkerReportSchema>
export type Marker = z.infer<typeof markerSchema>
export type Panel = z.infer<typeof panelSchema>
export type ClinicalValue = z.infer<typeof clinicalValueSchema>
export type LeadText = z.infer<typeof leadTextSchema>
