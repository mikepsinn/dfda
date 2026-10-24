import type { Program } from '@/lib/programs/data'

/**
 * What published studies report about how a class of drugs moves a blood
 * marker: the "expected" line of the care team's case page and the sources
 * behind it. Only checked entries (each title and finding read from the
 * paper's abstract); a marker without one has no verified reference, and the
 * page says so instead of inventing an expectation. Trial averages describe
 * groups of people, not one person.
 */

export type DrugClass = 'glp-1'

/** down or up: studies agree on a direction. mixed: they disagree. none: no change is established. */
export type Expectation = 'down' | 'up' | 'mixed' | 'none'

export type EvidenceSource = {
  /** The kind of study, such as "Randomized trials". */
  kind: string
  /** First author, year, short name and journal. */
  citation: string
  population: string
  reported: string
  limits: string
  url: string
}

export type Evidence = { expectation: Expectation; summary: string; sources: EvidenceSource[] }

/** The drug of a program's dose item, by its name. */
const DRUG_CLASSES: { drugClass: DrugClass; pattern: RegExp }[] = [
  { drugClass: 'glp-1', pattern: /semaglutide|tirzepatide|liraglutide|dulaglutide|exenatide/i },
]

export function drugClassOf(program: Pick<Program, 'items'>): DrugClass | null {
  const doses = program.items.filter((item) => item.kind === 'dose').map((item) => item.name)
  return DRUG_CLASSES.find(({ pattern }) => doses.some((name) => pattern.test(name)))?.drugClass ?? null
}

const VERMA_2022: EvidenceSource = {
  kind: 'Randomized trials',
  citation: 'Verma et al. 2022, STEP 1–3, eClinicalMedicine',
  population: 'Adults with overweight or obesity (STEP 2: with type 2 diabetes), on semaglutide 2.4 mg',
  reported: 'High-sensitivity CRP fell 44%, 39% and 48% more than with placebo at week 68.',
  limits: 'Group averages from a clinical CRP test, not a protein panel value.',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9713290/',
}

const PLUTZKY_2026: EvidenceSource = {
  kind: 'Randomized trial',
  citation: 'Plutzky et al. 2026, SELECT, Circulation',
  population: '17,604 adults with cardiovascular disease and overweight or obesity, without diabetes, on semaglutide',
  reported: 'High-sensitivity CRP fell 37.8% at week 104. The fall was evident by weeks 4 and 8, before most of the weight loss.',
  limits: 'Group averages from a clinical CRP test, not a protein panel value.',
  url: 'https://pubmed.ncbi.nlm.nih.gov/42610271/',
}

const WILSON_2022 = {
  kind: 'Randomized trial, post hoc analysis',
  citation: 'Wilson et al. 2022, Diabetes, Obesity and Metabolism',
  population: 'Adults with type 2 diabetes on tirzepatide, dulaglutide or placebo for 26 weeks',
  limits: 'Tirzepatide acts on GIP as well as GLP-1 receptors; an exploratory analysis.',
  url: 'https://pubmed.ncbi.nlm.nih.gov/34542221/',
}

const GLP1_EVIDENCE: Record<string, Evidence> = {
  CRP: {
    expectation: 'down',
    summary: 'GLP-1 drugs lower C-reactive protein, in trials from week 4 to 8 on.',
    sources: [VERMA_2022, PLUTZKY_2026],
  },
  IL6: {
    expectation: 'mixed',
    summary: 'Studies of GLP-1 drugs disagree on interleukin-6.',
    sources: [
      { ...WILSON_2022, reported: 'Interleukin-6 did not change significantly in any group.' },
      {
        kind: 'Randomized trial',
        citation: 'Funderburg et al. 2025, Open Forum Infectious Diseases',
        population: '108 adults with HIV and lipohypertrophy, without diabetes, on semaglutide 1.0 mg or placebo for 32 weeks',
        reported: 'Semaglutide lowered interleukin-6 from baseline.',
        limits: 'A small trial in a specific group of people.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40160348/',
      },
    ],
  },
  GDF15: {
    expectation: 'none',
    summary: 'No change in GDF-15 is established on GLP-1 drugs.',
    sources: [
      {
        kind: 'Clinical studies',
        citation: 'Valenzuela-Vallejo et al. 2022, Metabolism',
        population: 'Adults with obesity who lost weight on liraglutide or lorcaserin',
        reported: 'GDF-15 levels did not change.',
        limits: 'Liraglutide, not semaglutide.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35700837/',
      },
      {
        kind: 'Clinical study',
        citation: 'Hoekx et al. 2024, Experimental Physiology',
        population: 'South Asian and Europid adults with type 2 diabetes who lost weight on liraglutide',
        reported: 'GDF-15 did not change.',
        limits: 'Liraglutide, not semaglutide.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38965822/',
      },
      { ...WILSON_2022, reported: 'Tirzepatide lowered GDF-15 from baseline, but not compared with placebo.' },
    ],
  },
}

const EVIDENCE: Record<DrugClass, Record<string, Evidence>> = { 'glp-1': GLP1_EVIDENCE }

/** The evidence for a marker (by its identifier, such as "IL-6" or "IL6") on a class of drugs; null when there is none. */
export function evidenceFor(drugClass: DrugClass | null, markerId: string): Evidence | null {
  if (!drugClass) return null
  return EVIDENCE[drugClass][markerId.toUpperCase().replace(/[^A-Z0-9]/g, '')] ?? null
}
