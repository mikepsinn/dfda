import { exampleMarker, notMeasuredBetween, type MarkerSpec } from './example-parts'
import { biomarkerReportSchema, type BiomarkerReport, type ClinicalValue } from './schema'

/**
 * The made-up clinician report of the BPC-157 template (lib/programs/config.ts):
 * a made-up patient recovering from a tendon strain, 44 proteins in 7 panels at
 * three timepoints over 8 weeks, with the clinic's laboratory values, the dose,
 * the reported effects and the text for the visit. Written like the semaglutide
 * report (example.ts): first and last values by hand, and each protein's change
 * in multiples of its noise. BPC-157 has few human studies, so the report gives
 * the expected directions as the program's aims, not as known effects.
 */

const TIMEPOINTS = [
  { label: 'Baseline', week: 0 },
  { label: 'Week 4', week: 4 },
  { label: 'Week 8', week: 8 },
]
const WEEKS = TIMEPOINTS.map((timepoint) => timepoint.week)
const notMeasured = (first: number | null, last: number | null) => notMeasuredBetween(first, last, WEEKS.length)

const PANELS: { id: string; name: string; summary: string; markers: MarkerSpec[] }[] = [
  {
    id: 'inflammation',
    name: 'Inflammation',
    summary:
      "Acute-phase markers fell, in step with the clinic hs-CRP and the pain log. IL-6 and TNF did not move beyond this participant's own noise band. CRP also falls after a strain without treatment, so this panel cannot show what the peptide itself did.",
    markers: [
      { id: 'CRP', name: 'C-reactive protein', note: 'Concordant with clinic hs-CRP', unit: 'mg/L', first: 2.6, last: 1.1, multiple: 2.8, intended: 'down' },
      { id: 'SAA1', name: 'Serum amyloid A-1 protein', unit: 'µg/mL', first: 5.1, last: 3.2, multiple: 2.1, intended: 'down' },
      { id: 'IL1RN', name: 'Interleukin-1 receptor antagonist protein', note: 'IL-1 receptor antagonist', unit: 'pg/mL', first: 380, last: 300, multiple: 1.8, intended: 'down' },
      { id: 'IL6', name: 'Interleukin-6', unit: 'pg/mL', first: 2.8, last: 2.4, multiple: 0.9, intended: 'down' },
      { id: 'TNF', name: 'Tumor necrosis factor alpha', unit: 'pg/mL', first: 1.7, last: 1.6, multiple: 0.3, intended: 'down' },
      { id: 'CCL2', name: 'C-C motif chemokine 2', unit: 'pg/mL', first: 232, last: 228, multiple: 0.2, intended: 'down' },
      { id: 'CXCL8', name: 'Interleukin-8', unit: 'pg/mL', first: 5.6, last: 5.4, multiple: 0.2, intended: 'down' },
      { id: 'IL10', name: 'Interleukin-10', note: 'Anti-inflammatory', unit: 'pg/mL', first: 2.2, last: 2.4, multiple: 0.5, intended: 'up' },
      { id: 'GDF15', name: 'Growth/differentiation factor 15', unit: 'pg/mL', first: 610, last: 640, multiple: 0.6, intended: 'down' },
    ],
  },
  {
    id: 'repair',
    name: 'Tissue repair & blood vessels',
    summary:
      'Growth factors that take part in healing moved up, VEGF-A most clearly. These are the changes the program aims for. In people they have not been shown to come from BPC-157: the expected directions come from animal studies.',
    markers: [
      { id: 'VEGFA', name: 'Vascular endothelial growth factor A', note: 'Angiogenesis', unit: 'pg/mL', first: 92.0, last: 131, multiple: 2.6, intended: 'up' },
      { id: 'FGF2', name: 'Fibroblast growth factor 2', unit: 'pg/mL', first: 4.1, last: 5.0, multiple: 1.8, intended: 'up' },
      { id: 'ANGPT1', name: 'Angiopoietin-1', unit: 'ng/mL', first: 21.0, last: 24.5, multiple: 1.7, intended: 'up' },
      { id: 'EGF', name: 'Pro-epidermal growth factor', unit: 'pg/mL', first: 380, last: 440, multiple: 1.2, intended: 'up' },
      { id: 'HGF', name: 'Hepatocyte growth factor', unit: 'pg/mL', first: 610, last: 650, multiple: 0.7, intended: 'up' },
      { id: 'TGFB1', name: 'Transforming growth factor beta-1 proprotein', unit: 'ng/mL', first: 18.2, last: 19.1, multiple: 0.6, intended: 'up' },
      { id: 'PDGFB', name: 'Platelet-derived growth factor subunit B', unit: 'ng/mL', first: 1.9, last: 2.0, multiple: 0.3, intended: 'up' },
      { id: 'ANGPT2', name: 'Angiopoietin-2', unit: 'ng/mL', first: 2.0, last: 2.1, multiple: 0.3, intended: 'down' },
    ],
  },
  {
    id: 'matrix',
    name: 'Tendon, cartilage & matrix',
    summary:
      'This is the panel to discuss. MMP-3 and COMP fell from their levels after the injury, which fits a calmer tendon. MMP-9 rose after the Week 5 flare and had not settled by Week 8: the tendon may still be remodelling, a reason to keep the running load steady.',
    markers: [
      { id: 'MMP3', name: 'Stromelysin-1', note: 'MMP-3; raised in tendinopathy', unit: 'ng/mL', first: 18.4, last: 12.6, multiple: 2.4, intended: 'down' },
      { id: 'COMP', name: 'Cartilage oligomeric matrix protein', note: 'Tendon and cartilage matrix turnover', unit: 'µg/mL', first: 1.42, last: 1.08, multiple: 2.0, intended: 'down' },
      { id: 'MMP9', name: 'Matrix metalloproteinase-9', note: 'Rose after the Week 5 flare', unit: 'ng/mL', first: 41.0, last: 56.0, multiple: 1.9, intended: 'down' },
      { id: 'MMP1', name: 'Interstitial collagenase', unit: 'ng/mL', first: 6.1, last: 5.6, multiple: 0.8, intended: 'down' },
      { id: 'TIMP1', name: 'Metalloproteinase inhibitor 1', unit: 'ng/mL', first: 148, last: 152, multiple: 0.4, intended: 'up' },
      { id: 'POSTN', name: 'Periostin', unit: 'ng/mL', first: 1.9, last: 1.8, multiple: 0.3, intended: 'down' },
      { id: 'TNC', name: 'Tenascin', note: 'Tenascin-C', unit: 'ng/mL', first: 34.0, last: 32.0, multiple: 0.4, intended: 'down' },
      { id: 'PRG4', name: 'Proteoglycan 4', note: 'Lubricin', unit: 'µg/mL', first: 0.31, last: 0.33, multiple: 0.4, intended: 'up' },
    ],
  },
  {
    id: 'muscle',
    name: 'Muscle & growth signals',
    summary:
      'No muscle marker left the noise band: the muscle-leak proteins, IGF-1, follistatin and myostatin did not change.',
    markers: [
      { id: 'CKM', name: 'Creatine kinase M-type', unit: 'ng/mL', first: 140, last: 128, multiple: 0.6, intended: 'down' },
      { id: 'MB', name: 'Myoglobin', unit: 'ng/mL', first: 34.0, last: 31.0, multiple: 0.5, intended: 'down' },
      { id: 'IGF1', name: 'Insulin-like growth factor 1', unit: 'ng/mL', first: 168, last: 176, multiple: 0.8, intended: 'up' },
      { id: 'IGFBP3', name: 'Insulin-like growth factor-binding protein 3', unit: 'µg/mL', first: 3.9, last: 4.0, multiple: 0.3, intended: 'up' },
      { id: 'MSTN', name: 'Growth/differentiation factor 8', note: 'Myostatin', unit: 'ng/mL', first: 4.4, last: 4.2, multiple: 0.4, intended: 'down' },
      { id: 'FST', name: 'Follistatin', unit: 'ng/mL', first: 1.31, last: 1.36, multiple: 0.4, intended: 'up' },
    ],
  },
  {
    id: 'gut',
    name: 'Gut barrier & mucosa',
    summary:
      'BPC-157 was first described as a peptide of the stomach, so the gut panel is reported in full. Nothing moved beyond the noise band.',
    markers: [
      { id: 'FABP2', name: 'Fatty acid-binding protein, intestinal', note: 'I-FABP; enterocyte turnover', unit: 'ng/mL', first: 1.3, last: 1.2, multiple: 0.6, intended: 'down' },
      { id: 'LBP', name: 'Lipopolysaccharide-binding protein', unit: 'µg/mL', first: 7.6, last: 7.4, multiple: 0.4, intended: 'down' },
      { id: 'CD14', name: 'Monocyte differentiation antigen CD14', note: 'Soluble CD14', unit: 'µg/mL', first: 1.55, last: 1.52, multiple: 0.2, intended: 'down' },
      { id: 'TFF3', name: 'Trefoil factor 3', note: 'Mucosal repair', unit: 'ng/mL', first: 11.8, last: 12.4, multiple: 0.6, intended: 'up' },
      { id: 'REG3A', name: 'Regenerating islet-derived protein 3-alpha', unit: 'ng/mL', first: 58.0, last: 55.0, multiple: 0.4, intended: 'down' },
    ],
  },
  {
    id: 'endothelium',
    name: 'Endothelium',
    summary: 'Endothelial activation markers drifted down but stayed inside the noise band.',
    markers: [
      { id: 'SELE', name: 'E-selectin', unit: 'ng/mL', first: 38.0, last: 33.0, multiple: 1.3, intended: 'down' },
      { id: 'ICAM1', name: 'Intercellular adhesion molecule 1', unit: 'ng/mL', first: 228, last: 214, multiple: 0.9, intended: 'down' },
      { id: 'VCAM1', name: 'Vascular cell adhesion protein 1', unit: 'ng/mL', first: 590, last: 571, multiple: 0.5, intended: 'down' },
      { id: 'VWF', name: 'von Willebrand factor', unit: 'µg/mL', first: 11.2, last: 10.9, multiple: 0.3, intended: 'down' },
    ],
  },
  {
    id: 'safety',
    name: 'Liver & kidney',
    summary:
      "No liver or kidney protein moved, in step with the clinic ALT, AST and creatinine. For a peptide that is not licensed, an unchanged safety panel is the result you want to see; it is reported as a result, not omitted.",
    markers: [
      { id: 'GPT', name: 'Alanine aminotransferase 1', note: 'ALT protein', unit: 'ng/mL', first: 1.4, last: 1.38, multiple: 0.2, intended: 'down' },
      { id: 'GOT1', name: 'Aspartate aminotransferase, cytoplasmic', note: 'AST protein', unit: 'ng/mL', first: 2.2, last: 2.1, multiple: 0.3, intended: 'down' },
      { id: 'CST3', name: 'Cystatin-C', note: 'Calibrant-relative; not IFCC-traceable', unit: 'mg/L', first: 0.84, last: 0.85, multiple: 0.2, intended: 'down' },
      { id: 'HAVCR1', name: 'Hepatitis A virus cellular receptor 1', note: 'KIM-1, tubular injury', unit: 'pg/mL', first: 88.0, last: 91.0, multiple: 0.3, intended: 'down' },
    ],
  },
]

const CLINICAL_VALUES: ClinicalValue[] = [
  { name: 'Knee pain with stairs', unit: '0–10', values: [6.0, 3.5, 2.5], better: 'lower', meaningfulChange: 30, note: 'Weekly average of the pain log' },
  { name: 'VISA-P score', unit: '0–100', values: notMeasured(52.0, 74.0), reference: '100 = no symptoms', better: 'higher', meaningfulChange: 15 },
  { name: 'hs-CRP', unit: 'mg/L', values: notMeasured(2.4, 1.0), reference: '< 1.0 low risk', better: 'lower', meaningfulChange: 30 },
  { name: 'ESR', unit: 'mm/h', values: notMeasured(14.0, 9.0), reference: '0–15', better: 'lower', meaningfulChange: 20 },
  { name: 'Creatine kinase', unit: 'U/L', values: notMeasured(182, 165), reference: '39–308', better: 'neither', meaningfulChange: 20 },
  { name: 'ALT', unit: 'U/L', values: notMeasured(24.0, 23.0), reference: '7–55', better: 'lower', meaningfulChange: 15 },
  { name: 'AST', unit: 'U/L', values: notMeasured(22.0, 21.0), reference: '8–48', better: 'lower', meaningfulChange: 15 },
  { name: 'Creatinine', unit: 'mg/dL', values: notMeasured(0.98, 0.97), reference: '0.74–1.35', better: 'neither', meaningfulChange: 10 },
  { name: 'eGFR (CKD-EPI 2021)', unit: 'mL/min/1.73m²', values: notMeasured(96.0, 97.0), reference: '> 60', better: 'higher', meaningfulChange: 10 },
]

export const BPC_157_EXAMPLE_REPORT: BiomarkerReport = biomarkerReportSchema.parse({
  version: 1,
  edition: 'Proteomic Response Report · Clinician edition',
  title: "How this patient's biology responded to 8 weeks of BPC-157.",
  subtitle:
    "Plasma proteins measured at three timepoints on one plate, read against the patient's own baseline noise, and anchored to accredited clinical chemistry and the patient's own pain log.",
  reportDate: '2026-05-29',
  person: { name: 'J.T.', code: 'R-0592', age: 41, sex: 'M' },
  program: { name: 'Tendon recovery (BPC-157)', indication: 'Patellar tendinopathy, right knee; pain with running and stairs' },
  clinician: { name: 'Dr. A. Rivera', organization: 'Meridian Longevity Clinic', location: 'Austin TX' },
  collection: 'Home capillary dried blood, 3 samples returned together',
  platform: 'Multiplex proteomics panel v2.1 (pg/mL)',
  markerNoun: 'protein',
  disclaimer:
    'Research Use Only. Proteomic results are not a diagnosis; accredited clinical chemistry values are the only results on which clinical action should be taken.',
  footerNote: 'Research Use Only',
  timepoints: TIMEPOINTS,
  threshold: 1.5,
  glance: {
    intended:
      'Acute-phase inflammation fell and repair growth factors rose, in step with the clinic hs-CRP, the VISA-P score and the pain log.',
    unchanged: "No gut, liver, kidney or endothelial marker left the patient's own noise band. Reported as a result, not an omission.",
    review: 'MMP-9, a matrix enzyme, rose after the Week 5 flare and had not settled by Week 8.',
    nextWindow: {
      lead: 'Week 12',
      text: ', four weeks after the last dose. Re-check the matrix panel, and whether the gains hold without the peptide.',
    },
  },
  clinicalIntro:
    'Venous draws in clinic at Baseline and Week 8, run by a CLIA-accredited laboratory, with the VISA-P questionnaire and the weekly average of the pain log. These are the values on which clinical decisions should rest. The proteomic panels that follow are read against them.',
  clinicalValues: CLINICAL_VALUES,
  clinicalNotes: [
    {
      tone: 'info',
      lead: 'BPC-157',
      text: 'is not approved for use in people, and human studies are few and small. The expected directions in this report are the program’s aims, mostly from animal studies.',
    },
    {
      tone: 'review',
      lead: 'Week 5 flare',
      text: 'after a 14 km run: pain 6/10 for three days. Creatine kinase was normal at Week 8.',
    },
  ],
  dose: {
    unit: 'µg',
    steps: [{ week: 0, amount: 250 }],
    note: 'Daily subcutaneous. Adherence 53/56 doses logged.',
  },
  effects: [
    { weeks: 'Wk 1–2', text: 'Mild redness at the injection site', severity: 'mild' },
    { weeks: 'Wk 2–4', text: 'Knee pain eased on most days; stairs easier', severity: 'resolved' },
    { weeks: 'Wk 5–6', text: 'Pain flare for three days after a 14 km run', severity: 'notable' },
    { weeks: 'Wk 6–8', text: 'No side effects reported; mild pain with stairs only', severity: 'resolved' },
  ],
  panels: PANELS.map((panel) => ({ ...panel, markers: panel.markers.map((spec) => exampleMarker(panel.id, spec, WEEKS)) })),
  panelNote:
    'The noise is the technical replicates on the same plate plus cohort within-person variance. Concentrations are calibrant-relative values from dried capillary blood and are not interchangeable with venous clinical assays of the same analyte.',
  visit: {
    discussion: [
      {
        lead: 'Load, not only the peptide.',
        text: 'Pain and VISA-P improved in step with the loading program. The proteins cannot separate the effect of BPC-157 from rest and rehab; say so when the patient asks what worked.',
      },
      {
        lead: 'MMP-9.',
        text: 'Rose after the Week 5 flare and is still above baseline. Hold increases in running volume until the next sample.',
      },
      {
        lead: 'Inflammation settled.',
        text: 'hs-CRP 2.4 → 1.0 mg/L and the acute-phase proteins fell; IL-6 and TNF were unchanged.',
      },
    ],
    nextWindow: {
      lead: 'Week 12',
      text: '· one home sample, four weeks after the last dose.',
      detail:
        "The next sample will be run with this patient's reserved baseline aliquot on the same plate, so the comparison stays within one calibrator lot.",
    },
    questions: [
      '"Did the peptide heal my tendon?" — Your tendon markers and scores improved; the report cannot tell how much came from BPC-157 and how much from rest and rehab.',
      '"Is it safe to keep taking it?" — Liver and kidney values did not change. BPC-157 is not approved, and long-term human safety data are lacking.',
      '"Can I run again?" — Yes, with a slow build-up; MMP-9 suggests the tendon is still remodelling.',
    ],
    limits: [
      {
        lead: 'It does not diagnose.',
        text: 'Proteomic values are Research Use Only. Any result that would change management should be confirmed with an accredited clinical test.',
      },
      {
        lead: 'It does not show cause.',
        text: 'A change after the start does not prove that the peptide caused it; tendons also heal with rest and loading.',
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
      text: 'Multiplex proteomics panel v2.1 · about 1,000 assays · quantification against recombinant standard curves (16-point, 4PL) run on a calibration plate the same day.',
    },
    {
      term: 'Specimen',
      text: "Capillary whole blood, volumetric tips (20 µL), air-dried and stored at room temperature; three samples returned together at Week 8. Eluted per the panel's protocol (150 µL buffer per tip, 1 h, protease inhibitor).",
    },
    {
      term: 'Batching',
      text: 'All three timepoints for this patient on one plate, same bead lot, same calibrator lot, same run. One aliquot per timepoint held in reserve at −80 °C.',
    },
    {
      term: 'Noise band',
      text: "Per-protein within-person SD estimated from on-plate technical replicates and cohort baseline variance (\"borrowed noise\"). A change is reported when it exceeds 1.5× that SD; the direction is then compared to the program's intended direction.",
    },
    {
      term: 'Sample QC',
      text: 'All three samples passed: haemolysis index low (3 / 3), dwell time 1–56 days recorded, reference sample co-shipped and within tolerance.',
    },
    { term: 'Regulatory', text: 'Research Use Only. Not CLIA-returnable. Clinical anchors from an accredited laboratory.' },
  ],
  movers: {
    intro:
      "Of the proteins not shown on the panel pages, these moved most relative to the patient's own noise. Exploratory; included so nothing large is hidden by panel curation. Detect = timepoints above LLOQ.",
    items: [
      { id: 'THBS1', name: 'Thrombospondin-1', percentChange: 34, noiseMultiple: 3.1, detected: 3, of: 3 },
      { id: 'SPARC', name: 'SPARC', percentChange: 21, noiseMultiple: 2.6, detected: 3, of: 3 },
      { id: 'LUM', name: 'Lumican', percentChange: -18, noiseMultiple: 2.2, detected: 3, of: 3 },
      { id: 'CHI3L1', name: 'Chitinase-3-like protein 1', percentChange: -26, noiseMultiple: 2.1, detected: 3, of: 3 },
      { id: 'MMP2', name: '72 kDa type IV collagenase', percentChange: 14, noiseMultiple: 1.9, detected: 3, of: 3 },
      { id: 'IL1B', name: 'Interleukin-1 beta', percentChange: -31, noiseMultiple: 1.8, detected: 2, of: 3 },
    ],
    note: 'Within-person CV, LLOQ and detectability come from the per-target validation table of the platform. Gene symbols are the assay identifiers of the panel.',
  },
})
