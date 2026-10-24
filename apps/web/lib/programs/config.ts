import { z } from 'zod'

/**
 * A program of a company instance: what a person tracks while they use the
 * company's product, and when they measure again. Doses and check-ins become
 * reminders when a person joins; labs are entered at the start and at the
 * follow-up. The before/after report (report.ts) compares the values.
 */

export const ITEM_KINDS = ['dose', 'check_in', 'lab'] as const
export const FREQUENCIES = ['daily', 'weekly'] as const
export const BETTER = ['higher', 'lower', 'neither'] as const

export type ItemKind = (typeof ITEM_KINDS)[number]
export type Frequency = (typeof FREQUENCIES)[number]
export type Better = (typeof BETTER)[number]

const variableId = z.string().min(1, 'Choose a variable from the list.').max(200)

export const programItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('dose'),
    variableId,
    frequency: z.enum(FREQUENCIES),
    defaultValue: z.number().positive('The usual dose must be more than 0.').max(1_000_000).nullable(),
  }),
  z.object({ kind: z.literal('check_in'), variableId, frequency: z.enum(FREQUENCIES), better: z.enum(BETTER) }),
  z.object({ kind: z.literal('lab'), variableId, better: z.enum(BETTER) }),
])

export type ProgramItemInput = z.infer<typeof programItemSchema>

export const programSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.')
  .min(3, 'Use at least 3 characters.')
  .max(60, 'Use at most 60 characters.')

const itemsSchema = z
  .string()
  .transform((value, context) => {
    try {
      return JSON.parse(value) as unknown
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'The list of things to track is not valid.' })
      return z.NEVER
    }
  })
  .pipe(
    z
      .array(programItemSchema)
      .min(1, 'Add at least one thing to track.')
      .max(20, 'Track at most 20 things.')
      .refine(
        (items) => new Set(items.map((item) => item.variableId)).size === items.length,
        'Each variable can appear only once.',
      )
      .refine(
        (items) => items.some((item) => item.kind !== 'dose'),
        'Add at least one check-in or lab, so the report has something to compare.',
      ),
  )

export const programInputSchema = z.object({
  name: z.string().trim().min(2, 'Enter the program name.').max(80),
  slug: programSlugSchema,
  summary: z.string().trim().max(300, 'Keep the summary under 300 characters.').transform((value) => value || null),
  followUpWeeks: z.coerce.number().int().min(2, 'Use 2 to 52 weeks.').max(52, 'Use 2 to 52 weeks.'),
  careTeamReview: z.boolean().default(true),
  items: itemsSchema,
})

export type ProgramInput = z.infer<typeof programInputSchema>

/** A variable that a program item can use, as the form lists it. */
export type VariableOption = { id: string; name: string; unit: string; category: string }

export type ProgramTemplate = {
  key: string
  label: string
  name: string
  slug: string
  summary: string
  followUpWeeks: number
  items: ProgramItemInput[]
}

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    key: 'glp-1',
    label: 'GLP-1 program',
    name: 'GLP-1 weight program',
    slug: 'glp-1',
    summary: 'Track your dose, weight, energy and side effects. Enter blood markers before you start and at week 12.',
    followUpWeeks: 12,
    items: [
      { kind: 'dose', variableId: 'semaglutide', frequency: 'weekly', defaultValue: 0.25 },
      { kind: 'check_in', variableId: 'weight', frequency: 'weekly', better: 'lower' },
      { kind: 'check_in', variableId: 'energy-level', frequency: 'daily', better: 'higher' },
      { kind: 'check_in', variableId: 'nausea', frequency: 'daily', better: 'lower' },
      { kind: 'lab', variableId: 'hba1c', better: 'lower' },
      { kind: 'lab', variableId: 'alanine-aminotransferase', better: 'lower' },
      { kind: 'lab', variableId: 'apolipoprotein-b', better: 'lower' },
      { kind: 'lab', variableId: 'ferritin', better: 'neither' },
    ],
  },
  {
    key: 'bpc-157',
    label: 'BPC-157 program',
    name: 'BPC-157 recovery program',
    slug: 'bpc-157',
    summary: 'Track your dose, pain and energy. Enter an inflammation marker before you start and at week 8.',
    followUpWeeks: 8,
    items: [
      { kind: 'dose', variableId: 'bpc-157', frequency: 'daily', defaultValue: 250 },
      { kind: 'check_in', variableId: 'pain', frequency: 'daily', better: 'lower' },
      { kind: 'check_in', variableId: 'energy-level', frequency: 'daily', better: 'higher' },
      { kind: 'lab', variableId: 'c-reactive-protein', better: 'lower' },
    ],
  },
  { key: 'blank', label: 'Blank', name: '', slug: '', summary: '', followUpWeeks: 12, items: [] },
]

/** A template with only the items whose variables exist in this database. */
export function usableTemplate(template: ProgramTemplate, variables: VariableOption[]): ProgramTemplate {
  const known = new Set(variables.map((variable) => variable.id))
  return { ...template, items: template.items.filter((item) => known.has(item.variableId)) }
}

/** The allowed values of rating-scale units. */
export const SCALE_RANGES: Record<string, [min: number, max: number]> = {
  'zero-to-ten-scale': [0, 10],
  'one-to-ten-scale': [1, 10],
  'one-to-five-scale': [1, 5],
}

/** The words at the two ends of a rating scale, by the better direction; none when neither end is better. */
export function scaleWords(better: Better | null, min: number): [low: string, high: string] | null {
  if (better === 'lower') return [min === 0 ? 'None' : 'Mildest', 'Worst']
  if (better === 'higher') return ['Very low', 'Very high']
  return null
}

export const KIND_LABELS: Record<ItemKind, string> = { dose: 'Dose', check_in: 'Check-in', lab: 'Lab' }
export const BETTER_LABELS: Record<Better, string> = { higher: 'Higher is better', lower: 'Lower is better', neither: 'Neither' }
