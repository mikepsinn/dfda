// Figures on /impact. Every figure names its sources. The network has no results of its own yet,
// so the page shows published facts and, separately labeled, model estimates from one analysis.

export interface ImpactSource {
  id: string
  label: string
  url: string
}

// Listed in order of first use; the page numbers its citations by this order.
export const impactSources = [
  {
    id: "iqvia-participants",
    label: "IQVIA report on clinical trial participants in 2022, via GMDP Academy",
    url: "https://gmdpacademy.org/news/iqvia-report-clinical-trial-subjects-number-drops-due-to-decline-in-covid-19-enrollment/",
  },
  {
    id: "un-population",
    label: "United Nations: Day of Eight Billion (15 November 2022)",
    url: "https://www.un.org/en/dayof8billion",
  },
  {
    id: "rare-diseases",
    label: "Domike et al. (2024), Orphanet Journal of Rare Diseases, citing the NIH National Center for Advancing Translational Sciences",
    url: "https://ojrd.biomedcentral.com/articles/10.1186/s13023-024-03398-1",
  },
  {
    id: "pivotal-trial-cost",
    label: "Moore et al. (2018), JAMA Internal Medicine: Estimated Costs of Pivotal Trials for Novel Therapeutic Agents Approved by the US FDA, 2015–2016",
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6248200/",
  },
  {
    id: "depression-exclusion",
    label: "Zimmerman et al. (2002), American Journal of Psychiatry: Are subjects in pharmacological treatment trials of depression representative of patients in routine clinical practice?",
    url: "https://psychiatryonline.org/doi/10.1176/appi.ajp.159.3.469",
  },
  {
    id: "bio-timelines",
    label: "BIO, Informa Pharma Intelligence and QLS Advisors (2021): Clinical Development Success Rates 2011–2020",
    url: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf",
  },
  {
    id: "recovery-cost",
    label: "Oren Cass (2023), Manhattan Institute: Slow, Costly Clinical Trials Drag Down Biomedical Breakthroughs",
    url: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
  },
  {
    id: "recovery-nejm",
    label: "RECOVERY Collaborative Group (2021), New England Journal of Medicine: Dexamethasone in Hospitalized Patients with Covid-19",
    url: "https://www.nejm.org/doi/full/10.1056/NEJMoa2021436",
  },
  {
    id: "nhs-lives",
    label: "NHS England (2021): COVID treatment developed in the NHS saves a million lives",
    url: "https://www.england.nhs.uk/2021/03/covid-treatment-developed-in-the-nhs-saves-a-million-lives/",
  },
  {
    id: "pragmatic-cost-review",
    label: "Ramsberg and Platt (2018), Learning Health Systems: Opportunities and barriers for pragmatic embedded trials",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6508852/",
  },
  {
    id: "impact-paper",
    label: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
    url: "https://manual.warondisease.org/knowledge/appendix/dfda-impact-paper.html",
  },
] as const satisfies readonly ImpactSource[]

export type ImpactSourceId = (typeof impactSources)[number]["id"]

export interface ImpactFigure {
  value: string
  text: string
  sourceIds: readonly ImpactSourceId[]
  // The 90% confidence interval of a model estimate.
  range?: string
}

export const problemFigures: readonly ImpactFigure[] = [
  {
    value: "1.9 million",
    text: "people took part in clinical trials in 2022: about 1 in 4,000 people in the world.",
    sourceIds: ["iqvia-participants", "un-population"],
  },
  {
    value: "More than 95%",
    text: "of the roughly 10,000 known rare diseases have no FDA-approved treatment.",
    sourceIds: ["rare-diseases"],
  },
  {
    value: "$41,117",
    text: "is the median cost per patient in the pivotal trials behind new FDA approvals.",
    sourceIds: ["pivotal-trial-cost"],
  },
  {
    value: "86%",
    text: "of outpatients with major depression in one clinic study would not have qualified for a typical antidepressant trial.",
    sourceIds: ["depression-exclusion"],
  },
  {
    value: "8.2 years",
    text: "is the average time from the end of Phase I safety testing to approval: Phase II and III trials plus regulatory review.",
    sourceIds: ["bio-timelines"],
  },
]

export const recoveryFigures: readonly ImpactFigure[] = [
  {
    value: "About $500",
    text: "per patient: 82 times less than the $41,000 of a typical pivotal trial.",
    sourceIds: ["recovery-cost"],
  },
  {
    value: "81 days",
    text: "to enroll 11,303 patients at 176 NHS hospital organizations.",
    sourceIds: ["recovery-nejm"],
  },
  {
    value: "One third",
    text: "fewer deaths with dexamethasone in patients on ventilators, and one fifth fewer in patients on oxygen. The trial found this in under 3 months.",
    sourceIds: ["recovery-nejm"],
  },
  {
    value: "1 million",
    text: "lives saved worldwide by dexamethasone, estimated by March 2021.",
    sourceIds: ["nhs-lives"],
  },
]

export const pragmaticCostReview: ImpactFigure = {
  value: "$97",
  text: "RECOVERY was not a one-off. A review of 64 embedded pragmatic trials found a median cost of $97 per patient.",
  sourceIds: ["pragmatic-cost-review"],
}

// Model estimates, not results. The ranges are the analysis's 90% confidence intervals.
export const modelEstimates: readonly ImpactFigure[] = [
  {
    value: "44× cheaper trials",
    text: "$929 per patient (a conservative estimate) instead of $41,000.",
    range: "12.8×–210×",
    sourceIds: ["impact-paper"],
  },
  {
    value: "12.3× more trial capacity",
    text: "with the funding that the analysis assumes.",
    range: "4.9×–50.8×",
    sourceIds: ["impact-paper"],
  },
  {
    value: "About 36 years",
    text: "to find first treatments for diseases that have none, instead of about 443 years.",
    range: "8–106 years",
    sourceIds: ["impact-paper"],
  },
  {
    value: "8.2 years sooner",
    text: "access to new treatments: patients can join a trial right after safety testing.",
    range: "4.8–11.5 years",
    sourceIds: ["impact-paper"],
  },
  {
    value: "84 cents",
    text: "per year of healthy life gained (DALY). Malaria bed nets cost about $89.",
    range: "$0.26–$1.49",
    sourceIds: ["impact-paper"],
  },
]

export function sourceNumber(id: ImpactSourceId): number {
  return impactSources.findIndex(source => source.id === id) + 1
}
