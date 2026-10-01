import { logger } from "@/lib/logger"
import { buildClinicalTrialsSearchUrl, toClinicalTrialsOffsetPage } from "./clinical-trials-gov"

// A ClinicalTrials.gov study, reduced to what a trial list shows.
// These are registry entries: they support finding a study, not claims about its results.
export interface RegistryTrial {
  nctId: string
  title: string
  studyType: string | null
  phases: string[]
  sponsor: string | null
  interventions: string[]
  // "City, Country" for each distinct site.
  locations: string[]
  url: string
}

export type RegistryTrialsResult =
  | { ok: true; total: number; trials: RegistryTrial[]; searchUrl: string }
  | { ok: false; searchUrl: string }

type Json = Record<string, unknown>

const asObject = (value: unknown): Json =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {}
const asText = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null)
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const isText = (value: string | null): value is string => value !== null

// The ClinicalTrials.gov search page for recruiting studies of a condition.
export function registrySearchUrl(condition: string) {
  const url = new URL("https://clinicaltrials.gov/search")
  url.searchParams.set("cond", condition)
  url.searchParams.set("aggFilters", "status:rec")
  return url.toString()
}

// Returns null for a study without a valid NCT ID or a title.
export function toRegistryTrial(study: unknown): RegistryTrial | null {
  const protocol = asObject(asObject(study).protocolSection)
  const identification = asObject(protocol.identificationModule)
  const nctId = asText(identification.nctId)
  const title = asText(identification.briefTitle) ?? asText(identification.officialTitle)
  if (!nctId || !/^NCT\d{8}$/.test(nctId) || !title) {
    return null
  }

  const design = asObject(protocol.designModule)
  const interventions = asList(asObject(protocol.armsInterventionsModule).interventions)
    .map(intervention => asText(asObject(intervention).name))
    .filter(isText)
  const locations = asList(asObject(protocol.contactsLocationsModule).locations)
    .map(location => {
      const { city, country } = asObject(location)
      return [asText(city), asText(country)].filter(isText).join(", ") || null
    })
    .filter(isText)

  return {
    nctId,
    title,
    studyType: asText(design.studyType),
    phases: asList(design.phases).map(asText).filter(isText),
    sponsor: asText(asObject(asObject(protocol.sponsorCollaboratorsModule).leadSponsor).name),
    interventions: [...new Set(interventions)],
    locations: [...new Set(locations)],
    url: `https://clinicaltrials.gov/study/${nctId}`,
  }
}

// The most relevant recruiting studies for a condition. A failed request returns ok: false,
// so the page can link to the registry search instead of failing.
export async function getRecruitingRegistryTrials(condition: string, limit = 20): Promise<RegistryTrialsResult> {
  const searchUrl = registrySearchUrl(condition)

  try {
    const url = buildClinicalTrialsSearchUrl({ condition, studyStatus: "recruiting", limit })
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      logger.error("ClinicalTrials.gov search failed", { condition, status: response.status })
      return { ok: false, searchUrl }
    }

    const page = toClinicalTrialsOffsetPage(await response.json(), { limit })
    const trials = page.hits.map(hit => toRegistryTrial(hit.study)).filter((trial): trial is RegistryTrial => trial !== null)
    return { ok: true, total: page.total, trials, searchUrl }
  } catch (error) {
    logger.error("ClinicalTrials.gov search failed", { condition, error })
    return { ok: false, searchUrl }
  }
}

// "PHASE2" → "Phase 2"; "NA" (not applicable) is left out.
export function formatRegistryPhases(phases: string[]) {
  const labels = phases.flatMap(phase =>
    phase === "EARLY_PHASE1" ? ["Early phase 1"] : /^PHASE\d$/.test(phase) ? [`Phase ${phase.slice(5)}`] : [],
  )
  return labels.length ? labels.join(", ") : null
}

// "EXPANDED_ACCESS" → "Expanded access"
export function formatRegistryStudyType(studyType: string) {
  const text = studyType.toLowerCase().replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}
