import { hash, seededRandom } from '@/lib/seeded-random'
import { biomarkerReportSchema, type BiomarkerReport, type ClinicalValue, type Marker } from './schema'

/**
 * A made-up clinician report of a made-up patient and clinic, for the demo
 * and the tests: 68 proteins in 8 organ panels, with the clinic's laboratory
 * values, the dose, the reported effects and the text for the visit. The first
 * and last values are chosen by hand, and each protein's noise follows from
 * its chosen change in multiples of the noise ("vs noise"); fillTimepoints
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

/**
 * A marker with its first and last values and its change in multiples of the
 * noise; null values when the assay never quantified it.
 */
type MarkerSpec = Omit<Marker, 'values' | 'noise'> & { first: number | null; last: number | null; multiple: number }

const TIMEPOINTS = [
  { label: 'Baseline', week: 0 },
  { label: 'Week 4', week: 4 },
  { label: 'Week 8', week: 8 },
  { label: 'Week 12', week: 12 },
]
const WEEKS = TIMEPOINTS.map((timepoint) => timepoint.week)
const notMeasured = (first: number | null, last: number | null) => [first, null, null, last]

function marker(panelId: string, { first, last, multiple, ...spec }: MarkerSpec): Marker {
  // The noise that makes the change this many times the noise, to 4 significant digits as a data file gives it.
  const noise = first === null || last === null ? 1 : Number((Math.abs(last - first) / multiple).toPrecision(4))
  const values =
    first === null || last === null
      ? WEEKS.map(() => null)
      : fillTimepoints({ first, last, weeks: WEEKS, noise, seed: `example:${panelId}:${spec.id}` })
  return { ...spec, noise, values }
}

const PANELS: { id: string; name: string; summary: string; markers: MarkerSpec[] }[] = [
  {
    id: 'metabolic',
    name: 'Metabolic & GLP-1 axis',
    summary:
      'Insulin demand fell, adipokines moved toward a leaner profile, and appetite hormones shifted in the direction expected on a GLP-1. This is the clearest response in the report and is concordant with the clinic HbA1c and fasting glucose.',
    markers: [
      { id: 'INS', name: 'Insulin', note: 'Fasting insulin; concordant with clinic value', unit: 'pg/mL', first: 640, last: 370, multiple: 3.0, intended: 'down' },
      { id: 'C-peptide', name: 'Connecting peptide (C-peptide)', unit: 'ng/mL', first: 2.9, last: 1.9, multiple: 2.9, intended: 'down' },
      { id: 'Pro-insulin', name: 'Pro-insulin', note: 'Pro-insulin:insulin ratio also fell', unit: 'pg/mL', first: 210, last: 125, multiple: 2.7, intended: 'down' },
      { id: 'LEP', name: 'Leptin', note: 'Tracks fat-mass loss', unit: 'ng/mL', first: 28.4, last: 17.1, multiple: 3.6, intended: 'down' },
      { id: 'ADIPOQ', name: 'Adiponectin', unit: 'µg/mL', first: 6.1, last: 7.9, multiple: 3.3, intended: 'up' },
      { id: 'FGF21', name: 'Fibroblast growth factor 21', unit: 'pg/mL', first: 312, last: 188, multiple: 2.2, intended: 'down' },
      { id: 'FABP4', name: 'Fatty acid-binding protein, adipocyte', note: 'Adipocyte-derived', unit: 'ng/mL', first: 27.8, last: 19.2, multiple: 2.6, intended: 'down' },
      { id: 'IGFBP1', name: 'Insulin-like growth factor-binding protein 1', note: 'Rises as insulin falls', unit: 'ng/mL', first: 12.1, last: 23.6, multiple: 5.9, intended: 'up' },
      { id: 'IGFBP2', name: 'Insulin-like growth factor-binding protein 2', unit: 'ng/mL', first: 181, last: 262, multiple: 3.4, intended: 'up' },
      { id: 'RBP4', name: 'Retinol-binding protein 4', unit: 'µg/mL', first: 31.6, last: 27.4, multiple: 1.3, intended: 'down' },
      { id: 'GHRL', name: 'Appetite-regulating hormone', note: 'Rises with weight loss; expected', unit: 'pg/mL', first: 618, last: 790, multiple: 1.9, intended: 'up' },
      { id: 'PYY', name: 'Peptide YY', unit: 'pg/mL', first: 96.0, last: 114, multiple: 1.1, intended: 'up' },
    ],
  },
  {
    id: 'inflammation',
    name: 'Inflammation',
    summary:
      "Acute-phase and adipose-linked inflammation fell. TNF, CCL2 and GDF15 did not move beyond this participant's own noise band; GDF15 is worth re-checking at the next window because it rises on several metabolic drugs.",
    markers: [
      { id: 'CRP', name: 'C-reactive protein', note: 'Concordant with clinic hs-CRP', unit: 'mg/L', first: 3.8, last: 1.9, multiple: 2.5, intended: 'down' },
      { id: 'SAA1', name: 'Serum amyloid A-1 protein', unit: 'µg/mL', first: 6.2, last: 3.1, multiple: 2.3, intended: 'down' },
      { id: 'IL6', name: 'Interleukin-6', unit: 'pg/mL', first: 3.1, last: 2.0, multiple: 1.9, intended: 'down' },
      { id: 'IL1RN', name: 'Interleukin-1 receptor antagonist protein', note: 'IL-1 receptor antagonist', unit: 'pg/mL', first: 420, last: 290, multiple: 2.2, intended: 'down' },
      { id: 'S100A9', name: 'Protein S100-A9', note: 'Calprotectin subunit', unit: 'ng/mL', first: 1120, last: 790, multiple: 1.8, intended: 'down' },
      { id: 'TNF', name: 'Tumor necrosis factor alpha', unit: 'pg/mL', first: 1.9, last: 1.8, multiple: 0.4, intended: 'down' },
      { id: 'CCL2', name: 'C-C motif chemokine 2', unit: 'pg/mL', first: 240, last: 226, multiple: 0.4, intended: 'down' },
      { id: 'IL18', name: 'Interleukin-18', unit: 'pg/mL', first: 241, last: 232, multiple: 0.3, intended: 'down' },
      { id: 'CXCL8', name: 'Interleukin-8', unit: 'pg/mL', first: 6.0, last: 5.7, multiple: 0.3, intended: 'down' },
      { id: 'GDF15', name: 'Growth/differentiation factor 15', note: 'Monitor; drug-associated rise is common', unit: 'pg/mL', first: 890, last: 985, multiple: 1.1, intended: 'down' },
    ],
  },
  {
    id: 'liver',
    name: 'Liver',
    summary:
      'Hepatocyte-derived markers moved toward lower liver fat and lower transaminase release, in step with the accredited ALT/AST. Fibrosis-associated markers did not change, which is the expected result over 12 weeks.',
    markers: [
      { id: 'GPT', name: 'Alanine aminotransferase 1', note: 'ALT protein; clinic ALT 38 → 27 U/L', unit: 'ng/mL', first: 1.9, last: 1.3, multiple: 2.4, intended: 'down' },
      { id: 'GOT1', name: 'Aspartate aminotransferase, cytoplasmic', note: 'AST protein', unit: 'ng/mL', first: 2.4, last: 1.9, multiple: 1.7, intended: 'down' },
      { id: 'FABP1', name: 'Fatty acid-binding protein, liver', note: 'Liver fatty-acid binding protein', unit: 'ng/mL', first: 18.2, last: 11.9, multiple: 2.3, intended: 'down' },
      { id: 'FGF19', name: 'Fibroblast growth factor 19', unit: 'pg/mL', first: 112, last: 151, multiple: 1.7, intended: 'up' },
      { id: 'HGF', name: 'Hepatocyte growth factor', unit: 'pg/mL', first: 620, last: 540, multiple: 0.9, intended: 'down' },
      { id: 'TIMP1', name: 'Metalloproteinase inhibitor 1', note: 'Fibrosis-associated', unit: 'ng/mL', first: 151, last: 143, multiple: 0.6, intended: 'down' },
      { id: 'SERPINA1', name: 'Alpha-1-antitrypsin', unit: 'mg/mL', first: 1.42, last: 1.39, multiple: 0.3, intended: 'down' },
      { id: 'AFP', name: 'Alpha-fetoprotein', unit: 'ng/mL', first: 2.1, last: 2.2, multiple: 0.5, intended: 'down' },
    ],
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular & endothelium',
    summary:
      'Endothelial activation markers fell; PCSK9 and natriuretic peptide drifted down but stayed inside the noise band. Cardiac troponin T is below quantification at every timepoint, which is normal in a healthy heart; it is not a negative result and is not a substitute for a clinical hs-cTnI.',
    markers: [
      { id: 'SELE', name: 'E-selectin', note: 'E-selectin', unit: 'ng/mL', first: 42.0, last: 31.0, multiple: 2.2, intended: 'down' },
      { id: 'VCAM1', name: 'Vascular cell adhesion protein 1', unit: 'ng/mL', first: 612, last: 538, multiple: 1.3, intended: 'down' },
      { id: 'ICAM1', name: 'Intercellular adhesion molecule 1', unit: 'ng/mL', first: 241, last: 206, multiple: 1.6, intended: 'down' },
      { id: 'MPO', name: 'Myeloperoxidase', unit: 'ng/mL', first: 61.0, last: 48.0, multiple: 1.3, intended: 'down' },
      { id: 'PCSK9', name: 'Proprotein convertase subtilisin/kexin type 9', note: 'Clinic LDL 131 → 112 mg/dL', unit: 'ng/mL', first: 281, last: 249, multiple: 1.1, intended: 'down' },
      { id: 'APOA1', name: 'Apolipoprotein A-I', unit: 'mg/mL', first: 1.31, last: 1.36, multiple: 0.6, intended: 'up' },
      { id: 'ANGPT2', name: 'Angiopoietin-2', unit: 'ng/mL', first: 2.1, last: 1.9, multiple: 0.7, intended: 'down' },
      { id: 'NPPB', name: 'Natriuretic peptides B', note: 'Total BNP-gene product, not NT-proBNP', unit: 'pg/mL', first: 28.0, last: 25.0, multiple: 0.7, intended: 'down' },
      { id: 'TNNT2', name: 'Troponin T, cardiac muscle', note: 'Below LLOQ at all four timepoints', unit: 'pg/mL', first: null, last: null, multiple: 1, intended: 'down' },
    ],
  },
  {
    id: 'kidney',
    name: 'Kidney',
    summary:
      "No kidney marker moved outside this participant's own noise band. On a GLP-1 with rapid weight loss, an unchanged kidney panel is the result you want to see; it is reported here as explicitly unchanged rather than omitted.",
    markers: [
      { id: 'CST3', name: 'Cystatin-C', note: 'Calibrant-relative; not IFCC-traceable', unit: 'mg/L', first: 0.86, last: 0.88, multiple: 0.3, intended: 'down' },
      { id: 'HAVCR1', name: 'Hepatitis A virus cellular receptor 1', note: 'KIM-1, tubular injury', unit: 'pg/mL', first: 95.0, last: 102, multiple: 0.5, intended: 'down' },
      { id: 'CLU', name: 'Clusterin', unit: 'µg/mL', first: 118, last: 121, multiple: 0.3, intended: 'down' },
      { id: 'SPP1', name: 'Osteopontin', note: 'Osteopontin', unit: 'ng/mL', first: 38.0, last: 34.0, multiple: 0.8, intended: 'down' },
      { id: 'TIMP2', name: 'Metalloproteinase inhibitor 2', unit: 'ng/mL', first: 84.0, last: 86.0, multiple: 0.3, intended: 'down' },
      { id: 'EGF', name: 'Pro-epidermal growth factor', unit: 'pg/mL', first: 410, last: 430, multiple: 0.4, intended: 'up' },
    ],
  },
  {
    id: 'muscle-bone',
    name: 'Muscle & bone',
    summary:
      'This is the panel to discuss. IGF-1 fell, follistatin-like 3 rose and two bone-turnover markers rose, a pattern consistent with reduced lean mass or reduced mechanical loading during rapid weight loss. The clinic grip-strength value also dropped. None of this is diagnostic; it is a reason to measure body composition before the next dose step.',
    markers: [
      { id: 'IGF1', name: 'Insulin-like growth factor 1', note: 'Clinic grip strength 26 → 24 kg', unit: 'ng/mL', first: 142, last: 118, multiple: 1.9, intended: 'up' },
      { id: 'IGFBP3', name: 'Insulin-like growth factor-binding protein 3', unit: 'µg/mL', first: 3.8, last: 3.4, multiple: 1.3, intended: 'up' },
      { id: 'FSTL3', name: 'Follistatin-related protein 3', note: 'Rises with catabolic signalling', unit: 'ng/mL', first: 9.8, last: 12.4, multiple: 2.4, intended: 'down' },
      { id: 'CKM', name: 'Creatine kinase M-type', note: 'Muscle-leak protein; also falls with less training', unit: 'ng/mL', first: 120, last: 96.0, multiple: 0.9, intended: 'up' },
      { id: 'MB', name: 'Myoglobin', unit: 'ng/mL', first: 32.0, last: 29.0, multiple: 0.5, intended: 'up' },
      { id: 'FABP3', name: 'Fatty acid-binding protein, heart', unit: 'ng/mL', first: 2.1, last: 2.0, multiple: 0.3, intended: 'down' },
      { id: 'GDF11', name: 'Growth/differentiation factor 11', unit: 'pg/mL', first: 168, last: 171, multiple: 0.1, intended: 'up' },
      { id: 'SOST', name: 'Sclerostin', note: 'Sclerostin; rises with unloading', unit: 'pg/mL', first: 380, last: 462, multiple: 1.8, intended: 'down' },
      { id: 'ACP5', name: 'Tartrate-resistant acid phosphatase type 5', note: 'TRAP5b, bone resorption', unit: 'ng/mL', first: 2.8, last: 3.4, multiple: 1.6, intended: 'down' },
      { id: 'TNFRSF11B', name: 'Tumor necrosis factor receptor superfamily member 11B', note: 'Osteoprotegerin', unit: 'pg/mL', first: 4200, last: 4380, multiple: 0.4, intended: 'up' },
      { id: 'PTH', name: 'Parathyroid hormone', unit: 'pg/mL', first: 42.0, last: 47.0, multiple: 0.7, intended: 'down' },
    ],
  },
  {
    id: 'gut',
    name: 'Gut barrier & mucosa',
    summary:
      'Intestinal fatty-acid binding protein rose during the weeks nausea was reported and had not fully settled by Week 12. Endotoxin-exposure markers drifted down but stayed inside the noise band. Worth re-checking after the dose has been stable for four weeks.',
    markers: [
      { id: 'FABP2', name: 'Fatty acid-binding protein, intestinal', note: 'I-FABP; enterocyte turnover', unit: 'ng/mL', first: 1.4, last: 1.9, multiple: 2.2, intended: 'down' },
      { id: 'LBP', name: 'Lipopolysaccharide-binding protein', unit: 'µg/mL', first: 8.2, last: 7.1, multiple: 1.2, intended: 'down' },
      { id: 'CD14', name: 'Monocyte differentiation antigen CD14', note: 'Soluble CD14', unit: 'µg/mL', first: 1.62, last: 1.51, multiple: 0.8, intended: 'down' },
      { id: 'REG3A', name: 'Regenerating islet-derived protein 3-alpha', note: 'Mucosal repair / antimicrobial', unit: 'ng/mL', first: 60.0, last: 72.0, multiple: 1.2, intended: 'down' },
      { id: 'REG1B', name: 'Lithostathine-1-beta', unit: 'ng/mL', first: 18.0, last: 21.0, multiple: 0.9, intended: 'up' },
      { id: 'TFF3', name: 'Trefoil factor 3', unit: 'ng/mL', first: 12.1, last: 12.9, multiple: 0.6, intended: 'down' },
      { id: 'REG4', name: 'Regenerating islet-derived protein 4', unit: 'ng/mL', first: 3.1, last: 3.0, multiple: 0.2, intended: 'down' },
    ],
  },
  {
    id: 'neuro',
    name: 'Brain & neuro',
    summary:
      "Neuro-injury markers were unchanged. Neurofilament light reads close to the assay's quantification limit in dried capillary blood, so small changes should not be interpreted; BDNF drifted up but stayed inside the noise band.",
    markers: [
      { id: 'NEFL', name: 'Neurofilament light polypeptide', note: 'Near LLOQ; interpret with caution', unit: 'pg/mL', first: 9.2, last: 9.0, multiple: 0.1, intended: 'down' },
      { id: 'GFAP', name: 'Glial fibrillary acidic protein', unit: 'pg/mL', first: 85.0, last: 82.0, multiple: 0.2, intended: 'down' },
      { id: 'BDNF', name: 'Neurotrophic factor BDNF precursor form', unit: 'ng/mL', first: 22.1, last: 25.4, multiple: 1.2, intended: 'up' },
      { id: 'GRN', name: 'Progranulin', note: 'Progranulin', unit: 'ng/mL', first: 41.0, last: 40.0, multiple: 0.3, intended: 'down' },
      { id: 'APOE', name: 'Apolipoprotein E', unit: 'µg/mL', first: 38.0, last: 39.0, multiple: 0.3, intended: 'up' },
    ],
  },
]

const CLINICAL_VALUES: ClinicalValue[] = [
  { name: 'Weight', unit: 'kg', values: [91.4, 88.9, 86.1, 83.7], better: 'lower', meaningfulChange: 3 },
  { name: 'BMI', unit: 'kg/m²', values: notMeasured(33.1, 30.3), better: 'lower', meaningfulChange: 3 },
  { name: 'HbA1c', unit: '%', values: notMeasured(6.1, 5.6), reference: '< 5.7', better: 'lower', meaningfulChange: 5 },
  { name: 'Fasting glucose', unit: 'mg/dL', values: notMeasured(108, 94.0), reference: '70–99', better: 'lower', meaningfulChange: 5 },
  { name: 'Fasting insulin', unit: 'µIU/mL', values: notMeasured(17.8, 10.2), reference: '2.6–24.9', better: 'lower', meaningfulChange: 15 },
  { name: 'ALT', unit: 'U/L', values: notMeasured(38.0, 27.0), reference: '7–35', better: 'lower', meaningfulChange: 15 },
  { name: 'AST', unit: 'U/L', values: notMeasured(31.0, 26.0), reference: '8–33', better: 'lower', meaningfulChange: 15 },
  { name: 'Lipase', unit: 'U/L', values: notMeasured(31.0, 36.0), reference: '13–60', better: 'lower', meaningfulChange: 15 },
  { name: 'Creatinine', unit: 'mg/dL', values: notMeasured(0.82, 0.84), reference: '0.57–1.00', better: 'neither', meaningfulChange: 10 },
  { name: 'eGFR (CKD-EPI 2021)', unit: 'mL/min/1.73m²', values: notMeasured(88.0, 86.0), reference: '> 60', better: 'higher', meaningfulChange: 10 },
  { name: 'LDL-C', unit: 'mg/dL', values: notMeasured(131, 112), reference: '< 100', better: 'lower', meaningfulChange: 10 },
  { name: 'ApoB', unit: 'mg/dL', values: notMeasured(104, 89.0), reference: '< 90', better: 'lower', meaningfulChange: 10 },
  { name: 'Triglycerides', unit: 'mg/dL', values: notMeasured(168, 121), reference: '< 150', better: 'lower', meaningfulChange: 15 },
  { name: 'hs-CRP', unit: 'mg/L', values: notMeasured(3.6, 1.8), reference: '< 1.0 low risk', better: 'lower', meaningfulChange: 30 },
  { name: 'hs-cTnI', unit: 'ng/L', values: notMeasured(null, null), reference: '< 16', better: 'lower', meaningfulChange: 20, lowerLimit: 3 },
  { name: 'NT-proBNP', unit: 'pg/mL', values: notMeasured(42.0, 38.0), reference: '< 125', better: 'lower', meaningfulChange: 20 },
  { name: 'Grip strength (dominant)', unit: 'kg', values: notMeasured(26.0, 24.0), reference: '≥ 20 (F)', better: 'higher', meaningfulChange: 5 },
]

export const EXAMPLE_REPORT: BiomarkerReport = biomarkerReportSchema.parse({
  version: 1,
  edition: 'Proteomic Response Report · Clinician edition',
  title: "How this patient's biology responded to 12 weeks of semaglutide.",
  subtitle:
    "1,063 plasma proteins measured at four timepoints on one plate, read against the patient's own baseline noise, and anchored to accredited clinical chemistry.",
  reportDate: '2026-06-12',
  person: { name: 'M.K.', code: 'R-0417', age: 52, sex: 'F' },
  program: { name: 'GLP-1 initiation (semaglutide)', indication: 'Weight management, prediabetes (HbA1c 6.1%)' },
  clinician: { name: 'Dr. A. Rivera', organization: 'Meridian Longevity Clinic', location: 'Austin TX' },
  collection: 'Home capillary dried blood (Tasso-M20), 4 wafers returned together',
  platform: 'nELISA Omni 1000 v2.1 (absolute pg/mL)',
  markerNoun: 'protein',
  assayCount: 1063,
  disclaimer:
    'Research Use Only. Proteomic results are not a diagnosis; accredited clinical chemistry values are the only results on which clinical action should be taken.',
  footerNote: 'Research Use Only',
  timepoints: TIMEPOINTS,
  threshold: 1.5,
  glance: {
    intended:
      'Metabolic, inflammatory, hepatic and endothelial markers moved together and agree with the clinic HbA1c, ALT, lipids and hs-CRP.',
    unchanged: "No kidney or neuro marker left the patient's own noise band. Reported as a result, not an omission.",
    review:
      'A muscle/bone pattern consistent with lean-mass loss, and a gut-epithelial marker that rose during the nausea weeks. Neither is diagnostic.',
    nextWindow: {
      lead: 'Week 16–18',
      text: ', after 4+ weeks at a stable dose. Re-check muscle/bone and gut panels; consider DXA before the next dose step.',
    },
  },
  clinicalIntro:
    'Venous draws in clinic at Baseline and Week 12, run by a CLIA-accredited laboratory. These are the values on which clinical decisions should rest. The proteomic panels that follow are read against them.',
  clinicalValues: CLINICAL_VALUES,
  clinicalNotes: [
    {
      tone: 'review',
      lead: 'Lipase',
      text: 'rose within the reference interval (31 → 36 U/L). No abdominal pain reported. Noted because pancreatitis is the threshold alarm on this drug class; no action implied.',
    },
    {
      tone: 'info',
      lead: 'hs-cTnI and NT-proBNP',
      text: 'are reported from the accredited lab, not from the proteomic panel. Affinity proteomics does not deliver clinical-grade troponin quantification.',
    },
  ],
  dose: {
    unit: 'mg',
    steps: [
      { week: 0, amount: 0.25 },
      { week: 4, amount: 0.5 },
      { week: 8, amount: 1.0 },
    ],
    note: 'Weekly subcutaneous. Adherence 12/12 injections logged.',
  },
  effects: [
    { weeks: 'Wk 1–2', text: 'Mild nausea after injection day', severity: 'mild' },
    { weeks: 'Wk 3–6', text: 'Nausea most days; two episodes of vomiting (wk 5, dose step)', severity: 'notable' },
    { weeks: 'Wk 7–9', text: 'Constipation; resolved with fibre + fluids', severity: 'mild' },
    { weeks: 'Wk 10–12', text: 'No GI symptoms reported; early satiety only', severity: 'resolved' },
  ],
  panels: PANELS.map((panel) => ({ ...panel, markers: panel.markers.map((spec) => marker(panel.id, spec)) })),
  panelNote:
    'The noise is the technical replicates on the same plate plus cohort within-person variance. Concentrations are calibrant-relative absolute values from dried capillary blood and are not interchangeable with venous clinical assays of the same analyte.',
  visit: {
    discussion: [
      {
        lead: 'Lean mass.',
        text: 'IGF-1 down 17%, FSTL3 up 27%, sclerostin and TRAP5b up, grip strength 26 → 24 kg, 7.7 kg lost in 12 weeks. Consider DXA (or BIA if DXA is unavailable) before stepping to 1.7 mg; protein intake ≥ 1.2 g/kg and resistance training 2–3×/week.',
      },
      {
        lead: 'Gut epithelium.',
        text: 'I-FABP rose during the nausea weeks and had not returned to baseline by Week 12. Re-check once the dose has been stable for four weeks. If GI symptoms return at the next step, this is the marker to watch.',
      },
      {
        lead: 'Metabolic response is strong.',
        text: 'Fasting insulin, C-peptide, leptin, FGF21 and FABP4 all fell; adiponectin and IGFBP-1 rose. HbA1c is now below the prediabetes threshold.',
      },
      { lead: 'GDF15', text: 'drifted up but stayed inside the noise band. Common on metabolic drugs; no action, re-measure.' },
    ],
    nextWindow: {
      lead: 'Week 16–18',
      text: '· one home wafer, after ≥ 4 weeks at a stable dose.',
      detail:
        "The next wafer will be run with this patient's reserved baseline aliquot on the same plate, so the comparison stays within one calibrator lot.",
    },
    questions: [
      '"Is my liver better?" — ALT and liver-fat proteins fell; fibrosis markers were unchanged, which is expected at 12 weeks.',
      '"Am I losing muscle?" — The pattern is consistent with it; a scan answers it.',
      '"Is my heart OK?" — Endothelial markers improved; troponin and NT-proBNP from the clinic lab are normal.',
    ],
    limits: [
      {
        lead: 'It does not diagnose.',
        text: 'Proteomic values are Research Use Only. Any result that would change management should be confirmed with an accredited clinical test.',
      },
      {
        lead: 'It does not report a biological age.',
        text: 'No published proteomic clock is valid on this platform without re-calibration, so none is shown. Organ response indices are within-patient, sign-and-magnitude readouts.',
      },
      {
        lead: 'It does not compare patients.',
        text: "Every flag is relative to this patient's own baseline and noise. Population reference intervals are shown only for the accredited clinical values.",
      },
    ],
    companion: {
      lead: 'Companion.',
      text: 'The patient can ask the companion about any line in this report in plain language. The companion explains and prepares questions; it does not change doses. Anything requiring a medical decision is routed back to the ordering clinician.',
    },
  },
  methods: [
    {
      term: 'Platform',
      text: 'nELISA, Omni 1000 panel v2.1 · 1,063 assays · absolute quantification against recombinant standard curves (16-point, 4PL) run on a calibration plate the same day.',
    },
    {
      term: 'Specimen',
      text: 'Capillary whole blood, Tasso-M20 volumetric tips (20 µL), air-dried and stored at room temperature; four wafers returned together at Week 12. Eluted per vendor SOP (150 µL buffer per tip, 1 h, protease inhibitor).',
    },
    {
      term: 'Batching',
      text: 'All four timepoints for this patient on one plate, same bead lot, same calibrator lot, same run. One aliquot per timepoint held in reserve at −80 °C.',
    },
    {
      term: 'Noise band',
      text: "Per-protein within-person SD estimated from on-plate technical replicates and cohort baseline variance (\"borrowed noise\"). A change is reported when it exceeds 1.5× that SD; the direction is then compared to the program's intended direction.",
    },
    {
      term: 'Detectability',
      text: "Of 1,063 assays, 781 were above LLOQ in all four of this patient's samples and are eligible for reporting; 92 were quantifiable in some timepoints only; 190 were below LLOQ throughout (predominantly intracellular proteins, expected in dried capillary blood).",
    },
    {
      term: 'Sample QC',
      text: 'All four wafers passed: haemolysis index low (4 / 4), dwell time 1–84 days recorded, reference wafer co-shipped and within tolerance.',
    },
    { term: 'Regulatory', text: 'Research Use Only. Not CLIA-returnable. Clinical anchors from an accredited laboratory.' },
  ],
  movers: {
    intro:
      "Of the proteins not shown on the organ pages, these moved most relative to the patient's own noise. Exploratory; included so nothing large is hidden by panel curation. Detect = timepoints above LLOQ.",
    items: [
      { id: 'CSF3', name: 'Granulocyte colony-stimulating factor', percentChange: 42, noiseMultiple: 4.9, detected: 3, of: 4 },
      { id: 'GPR158', name: 'Metabotropic glycine receptor', percentChange: 47, noiseMultiple: 4.7, detected: 3, of: 4 },
      { id: 'GPX1', name: 'Glutathione peroxidase 1', percentChange: -47, noiseMultiple: 4.7, detected: 4, of: 4 },
      { id: 'RGMA', name: 'Repulsive guidance molecule A', percentChange: -47, noiseMultiple: 4.1, detected: 3, of: 4 },
      { id: 'HSPA8', name: 'Heat shock cognate 71 kDa protein', percentChange: -46, noiseMultiple: 3.8, detected: 4, of: 4 },
      { id: 'SULT2A1', name: 'Sulfotransferase 2A1', percentChange: -47, noiseMultiple: 3.7, detected: 3, of: 4 },
      { id: 'DLK1', name: 'Protein delta homolog 1', percentChange: 39, noiseMultiple: 3.6, detected: 4, of: 4 },
      { id: 'SOD1', name: 'Superoxide dismutase [Cu-Zn]', percentChange: -29, noiseMultiple: 3.2, detected: 4, of: 4 },
      { id: 'IL6R', name: 'Interleukin-6 receptor subunit alpha', percentChange: -25, noiseMultiple: 2.9, detected: 4, of: 4 },
      { id: 'AOC1', name: 'Diamine oxidase', percentChange: 27, noiseMultiple: 2.6, detected: 3, of: 4 },
      { id: 'TNFRSF25', name: 'Tumor necrosis factor receptor superfamily member 25', percentChange: -44, noiseMultiple: 2.6, detected: 3, of: 4 },
      { id: 'GZMA', name: 'Granzyme A', percentChange: -41, noiseMultiple: 2.3, detected: 4, of: 4 },
      { id: 'CEACAM19', name: 'Cell adhesion molecule CEACAM19', percentChange: -30, noiseMultiple: 2.1, detected: 4, of: 4 },
      { id: 'DBH', name: 'Dopamine beta-hydroxylase', percentChange: 37, noiseMultiple: 2.1, detected: 4, of: 4 },
      { id: 'SDC3', name: 'Syndecan-3', percentChange: 30, noiseMultiple: 2.0, detected: 3, of: 4 },
      { id: 'FAS', name: 'Tumor necrosis factor receptor superfamily member 6', percentChange: 28, noiseMultiple: 2.0, detected: 4, of: 4 },
      { id: 'CLEC5A', name: 'C-type lectin domain family 5 member A', percentChange: -32, noiseMultiple: 1.9, detected: 4, of: 4 },
      { id: 'SELP', name: 'P-selectin', percentChange: 22, noiseMultiple: 1.9, detected: 3, of: 4 },
      { id: 'IL7', name: 'Interleukin-7', percentChange: -26, noiseMultiple: 1.8, detected: 4, of: 4 },
      { id: 'FCGR3A', name: 'Low affinity immunoglobulin gamma Fc region receptor III-A', percentChange: 34, noiseMultiple: 1.8, detected: 4, of: 4 },
    ],
    note: 'Within-person CV, LLOQ and detectability come from the per-target validation table of the platform. Gene symbols are Omni 1000 v2.1 assay identifiers.',
  },
})

/**
 * The example report for a program, when there is one: the semaglutide
 * report for a program whose dose is semaglutide (the GLP-1 template).
 */
export function exampleReportFor(program: { items: { kind: string; variableId: string }[] }): BiomarkerReport | null {
  return program.items.some((item) => item.kind === 'dose' && item.variableId === 'semaglutide') ? EXAMPLE_REPORT : null
}
