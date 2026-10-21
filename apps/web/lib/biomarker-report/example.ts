import { hash, seededRandom } from '@/lib/seeded-random'
import { biomarkerReportSchema, type BiomarkerReport, type ClinicalValue, type Marker } from './schema'

/**
 * A made-up biomarker report of a made-up clinic, for the demo and the tests.
 * The first and last values and the noise are chosen by hand; fillTimepoints
 * makes the values in between. The example covers every marker status and
 * every panel verdict of rules.ts.
 */

/** The share of a marker's noise by which a value between the first and the last timepoint may wobble. */
const WOBBLE = 0.3

function decimalsOf(value: number) {
  return (String(value).split('.')[1] ?? '').length
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Values for every timepoint from the first and the last one: most of the
 * change comes early (as with a drug that acts within weeks), plus a small
 * wobble within the noise. The same seed always gives the same values, rounded
 * to as many decimals as the first and last values have.
 */
export function fillTimepoints(options: { first: number; last: number; weeks: number[]; noise: number; seed: string }): number[] {
  const { first, last, weeks, noise } = options
  const random = seededRandom(hash(options.seed))
  const decimals = Math.max(decimalsOf(first), decimalsOf(last))
  const span = weeks[weeks.length - 1] - weeks[0]
  return weeks.map((week, index) => {
    if (index === 0) return first
    if (index === weeks.length - 1) return last
    const share = 1 - (1 - (week - weeks[0]) / span) ** 2
    const wobble = (random() * 2 - 1) * WOBBLE * noise
    return round(first + (last - first) * share + wobble, decimals)
  })
}

/** A marker with its first and last values; null for both when the assay never quantified it. */
type MarkerSpec = Omit<Marker, 'values'> & { first: number | null; last: number | null }

const TIMEPOINTS = [
  { label: 'Baseline', week: 0 },
  { label: 'Week 4', week: 4 },
  { label: 'Week 8', week: 8 },
  { label: 'Week 12', week: 12 },
]
const WEEKS = TIMEPOINTS.map((timepoint) => timepoint.week)
const notMeasured = (first: number | null, last: number | null) => [first, null, null, last]

function marker(panelId: string, { first, last, ...spec }: MarkerSpec): Marker {
  const values =
    first === null || last === null
      ? WEEKS.map(() => null)
      : fillTimepoints({ first, last, weeks: WEEKS, noise: spec.noise, seed: `example:${panelId}:${spec.id}` })
  return { ...spec, values }
}

const PANELS: { id: string; name: string; summary: string; markers: MarkerSpec[] }[] = [
  {
    id: 'metabolic',
    name: 'Metabolic & GLP-1 axis',
    summary:
      'Insulin demand fell and the adipokines moved toward a leaner profile. This is the clearest response in the report, and it agrees with the clinic HbA1c.',
    markers: [
      { id: 'INS', name: 'Insulin', note: 'Fasting insulin', unit: 'pg/mL', first: 580, last: 350, noise: 70, intended: 'down' },
      { id: 'LEP', name: 'Leptin', note: 'Tracks fat mass', unit: 'ng/mL', first: 24.6, last: 15.8, noise: 2.6, intended: 'down' },
      { id: 'ADIPOQ', name: 'Adiponectin', unit: 'µg/mL', first: 6.8, last: 8.4, noise: 0.55, intended: 'up' },
      { id: 'FGF21', name: 'Fibroblast growth factor 21', unit: 'pg/mL', first: 290, last: 196, noise: 45, intended: 'down' },
      { id: 'PYY', name: 'Peptide YY', unit: 'pg/mL', first: 92, last: 104, noise: 15, intended: 'up' },
    ],
  },
  {
    id: 'inflammation',
    name: 'Inflammation',
    summary: 'Acute-phase inflammation fell. TNF and GDF15 stayed inside the noise band; GDF15 is worth a new look at the next measurement.',
    markers: [
      { id: 'CRP', name: 'C-reactive protein', note: 'Agrees with the clinic hs-CRP', unit: 'mg/L', first: 3.2, last: 1.7, noise: 0.7, intended: 'down' },
      { id: 'IL6', name: 'Interleukin-6', unit: 'pg/mL', first: 2.8, last: 2.1, noise: 0.4, intended: 'down' },
      { id: 'TNF', name: 'Tumor necrosis factor', unit: 'pg/mL', first: 1.8, last: 1.7, noise: 0.25, intended: 'down' },
      { id: 'GDF15', name: 'Growth/differentiation factor 15', note: 'Often rises on metabolic drugs', unit: 'pg/mL', first: 760, last: 830, noise: 90, intended: 'down' },
    ],
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular & endothelium',
    summary: 'Endothelial activation markers fell. Cardiac troponin T is below the assay limit at every timepoint, which is normal for a healthy heart.',
    markers: [
      { id: 'SELE', name: 'E-selectin', unit: 'ng/mL', first: 39, last: 30, noise: 4, intended: 'down' },
      { id: 'ICAM1', name: 'Intercellular adhesion molecule 1', unit: 'ng/mL', first: 232, last: 205, noise: 17, intended: 'down' },
      { id: 'PCSK9', name: 'Proprotein convertase subtilisin/kexin type 9', unit: 'ng/mL', first: 270, last: 248, noise: 28, intended: 'down' },
      { id: 'TNNT2', name: 'Troponin T, cardiac muscle', unit: 'pg/mL', first: null, last: null, noise: 1, intended: 'down', lowerLimit: 3 },
    ],
  },
  {
    id: 'kidney',
    name: 'Kidney',
    summary: 'No kidney marker moved outside the noise band. With fast weight loss, an unchanged kidney panel is the result to hope for.',
    markers: [
      { id: 'CST3', name: 'Cystatin C', unit: 'mg/L', first: 0.84, last: 0.86, noise: 0.06, intended: 'down' },
      { id: 'HAVCR1', name: 'Kidney injury molecule 1', unit: 'pg/mL', first: 88, last: 93, noise: 14, intended: 'down' },
      { id: 'EGF', name: 'Pro-epidermal growth factor', unit: 'pg/mL', first: 395, last: 410, noise: 50, intended: 'up' },
    ],
  },
  {
    id: 'muscle-bone',
    name: 'Muscle & bone',
    summary:
      'IGF-1 fell and follistatin-like 3 rose, a pattern that agrees with loss of lean mass during fast weight loss. Grip strength also fell. Measure body composition before the next dose step.',
    markers: [
      { id: 'IGF1', name: 'Insulin-like growth factor 1', unit: 'ng/mL', first: 151, last: 126, noise: 12, intended: 'up' },
      { id: 'FSTL3', name: 'Follistatin-related protein 3', note: 'Rises with catabolic signalling', unit: 'ng/mL', first: 9.2, last: 11.6, noise: 1, intended: 'down' },
      { id: 'CKM', name: 'Creatine kinase M-type', unit: 'ng/mL', first: 115, last: 98, noise: 20, intended: 'up' },
      { id: 'SOST', name: 'Sclerostin', note: 'Rises with less mechanical loading', unit: 'pg/mL', first: 360, last: 405, noise: 40, intended: 'down' },
    ],
  },
]

const CLINICAL_VALUES: ClinicalValue[] = [
  {
    name: 'Weight',
    unit: 'kg',
    values: fillTimepoints({ first: 104.2, last: 95.1, weeks: WEEKS, noise: 0.6, seed: 'example:clinical:weight' }),
    better: 'lower',
    meaningfulChange: 3,
  },
  { name: 'HbA1c', unit: '%', values: notMeasured(6.0, 5.5), reference: '< 5.7', better: 'lower', meaningfulChange: 5 },
  { name: 'ALT', unit: 'U/L', values: notMeasured(41, 29), reference: '7–55', better: 'lower', meaningfulChange: 20 },
  { name: 'LDL-C', unit: 'mg/dL', values: notMeasured(138, 119), reference: '< 100', better: 'lower', meaningfulChange: 10 },
  { name: 'hs-CRP', unit: 'mg/L', values: notMeasured(3.0, 1.6), reference: '< 1.0', better: 'lower', meaningfulChange: 30 },
  {
    name: 'Lipase',
    unit: 'U/L',
    values: notMeasured(29, 35),
    reference: '13–60',
    better: 'lower',
    meaningfulChange: 15,
    note: 'Rose within the reference interval. No abdominal pain reported.',
  },
  { name: 'Creatinine', unit: 'mg/dL', values: notMeasured(0.96, 0.98), reference: '0.74–1.35', better: 'neither', meaningfulChange: 10 },
  { name: 'hs-cTnI', unit: 'ng/L', values: notMeasured(null, null), reference: '< 20', better: 'lower', meaningfulChange: 20, lowerLimit: 3 },
  { name: 'Grip strength', unit: 'kg', values: notMeasured(44, 41), reference: '≥ 27', better: 'higher', meaningfulChange: 5 },
]

export const EXAMPLE_REPORT: BiomarkerReport = biomarkerReportSchema.parse({
  version: 1,
  title: "How this patient's biology responded to 12 weeks of semaglutide",
  subtitle: "Blood markers at four timepoints, read against the patient's own noise and next to the clinic's laboratory values.",
  reportDate: '2026-09-30',
  person: { name: 'R. L.', code: 'EX-0102', age: 47, sex: 'M' },
  program: { name: 'GLP-1 start (semaglutide)', indication: 'Weight management, prediabetes' },
  clinician: { name: 'Dr. S. Okafor', organization: 'Example Clinic', location: 'Denver, CO' },
  collection: 'Capillary blood at home, one sample per timepoint',
  platform: 'Multiplex immunoassay panel, all samples on one plate',
  timepoints: TIMEPOINTS,
  threshold: 1.5,
  clinicalValues: CLINICAL_VALUES,
  panels: PANELS.map((panel) => ({ ...panel, markers: panel.markers.map((spec) => marker(panel.id, spec)) })),
  sections: [
    {
      title: 'Discussion points',
      items: [
        'Lean mass. IGF-1 fell and FSTL3 rose while weight fell, and grip strength dropped. Consider a body composition scan before the next dose step, protein of at least 1.2 g/kg a day and resistance training 2–3 times a week.',
        'The metabolic response is strong. Insulin, leptin and FGF21 fell and adiponectin rose. HbA1c is now below the prediabetes threshold.',
        'Lipase rose within its reference interval. No action is implied; it is noted because pancreatitis is the alarm threshold for this drug class.',
      ],
    },
    { title: 'Next measurement', items: ['Week 16–18, after at least 4 weeks at a stable dose. Re-check the muscle and bone markers.'] },
    {
      title: 'What this report does not do',
      items: [
        'It does not diagnose. Act only on results that an accredited clinical test confirms.',
        'It does not report a biological age.',
        "It does not compare people. Every status compares this patient with their own baseline and noise.",
      ],
    },
    {
      title: 'Methods',
      items: [
        "Noise: each marker's within-person standard deviation, from technical replicates on the plate and the patient's earlier measurements.",
        'A marker counts as changed when its change is at least 1.5 times its noise; its direction is then compared with the direction the program intends.',
      ],
    },
  ],
})
