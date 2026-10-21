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
  summary: text(600),
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

/** A titled list of short paragraphs: discussion points, the next measurement, limits, methods. */
export const sectionSchema = z.object({
  title: text(80),
  items: z.array(text(800)).min(1).max(12),
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
    timepoints: z.array(timepointSchema).min(2).max(MAX_TIMEPOINTS),
    /** A marker counts as changed when its change is at least this many times its noise. */
    threshold: z.number().positive().max(10).default(1.5),
    clinicalValues: z.array(clinicalValueSchema).max(40).default([]),
    panels: z.array(panelSchema).min(1).max(20),
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
