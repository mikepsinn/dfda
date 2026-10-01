import { logger } from "@/lib/logger"
import { buildClinicalTrialsSearchUrl, toClinicalTrialsOffsetPage } from "./clinical-trials-gov"

// A ClinicalTrials.gov study, reduced to what a trial list shows.
// These are registry entries: they support finding a study, not claims about its results.
export interface RegistryTrial {
  nctId: string
  title: string
  summary: string | null
  // Registry status code, for example "RECRUITING".
  status: string | null
  // "2024-01-08" or "2024-01"; the registry also uses month precision.
  startDate: string | null
  studyType: string | null
  phases: string[]
  sponsor: string | null
  interventions: string[]
  // "City, Country" for each distinct site.
  locations: string[]
  url: string
}

export type RegistryTrialsResult =
  | {
      ok: true
      // The registry counts matches only on the first page; later pages report null.
      total: number | null
      trials: RegistryTrial[]
      searchUrl: string
      // Cursor for the next page; the registry gives no cursor for earlier pages.
      nextPageToken: string | null
      // True when the requested page had expired and the first page is shown instead.
      paginationReset: boolean
    }
  | { ok: false; searchUrl: string }

export const REGISTRY_PAGE_SIZE = 10

// The modules the trial cards read, plus the brief summary.
const REGISTRY_FIELDS = [
  "protocolSection.identificationModule",
  "protocolSection.statusModule",
  "protocolSection.descriptionModule.briefSummary",
  "protocolSection.designModule",
  "protocolSection.armsInterventionsModule",
  "protocolSection.contactsLocationsModule",
  "protocolSection.sponsorCollaboratorsModule",
].join(",")

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

// From crowdsourcing-cures: URL encoding alone does not escape ClinicalTrials.gov's query
// language, so a condition name is searched as one quoted phrase.
export function quoteSearchText(value: string) {
  return '"' + value.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'
}

// Page cursors are short alphanumeric tokens; anything else is ignored.
export function isRegistryPageToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(value)
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

  const status = asObject(protocol.statusModule)
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
    summary: asText(asObject(protocol.descriptionModule).briefSummary),
    status: asText(status.overallStatus),
    startDate: asText(asObject(status.startDateStruct).date),
    studyType: asText(design.studyType),
    phases: asList(design.phases).map(asText).filter(isText),
    sponsor: asText(asObject(asObject(protocol.sponsorCollaboratorsModule).leadSponsor).name),
    interventions: [...new Set(interventions)],
    locations: [...new Set(locations)],
    url: `https://clinicaltrials.gov/study/${nctId}`,
  }
}

// From crowdsourcing-cures: a cursor belongs to one data snapshot, so only the first page is cached,
// and the retry after an expired cursor bypasses that cache too.
function fetchStudies(url: URL, fresh: boolean) {
  return fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    ...(fresh || url.searchParams.has("pageToken") ? { cache: "no-store" as const } : { next: { revalidate: 3600 } }),
  })
}

// One page of the most relevant recruiting studies for a condition. A failed request returns
// ok: false, so the page can link to the registry search instead of failing.
export async function getRecruitingRegistryTrials(
  condition: string,
  { pageToken, limit = REGISTRY_PAGE_SIZE }: { pageToken?: string; limit?: number } = {},
): Promise<RegistryTrialsResult> {
  const searchUrl = registrySearchUrl(condition)

  try {
    const url = buildClinicalTrialsSearchUrl({ condition: quoteSearchText(condition), studyStatus: "recruiting", limit })
    url.searchParams.set("fields", REGISTRY_FIELDS)
    if (isRegistryPageToken(pageToken)) {
      url.searchParams.set("pageToken", pageToken)
    }

    let response = await fetchStudies(url, false)
    let errorText = response.ok ? "" : await response.text()
    let paginationReset = false

    // An expired or malformed cursor: show the first page and say so.
    if (response.status === 400 && url.searchParams.has("pageToken") && /pageToken|paginating/i.test(errorText)) {
      url.searchParams.delete("pageToken")
      response = await fetchStudies(url, true)
      errorText = response.ok ? "" : await response.text()
      paginationReset = true
    }

    if (!response.ok) {
      logger.error("ClinicalTrials.gov search failed", { condition, status: response.status, errorText: errorText.slice(0, 300) })
      return { ok: false, searchUrl }
    }

    const payload = await response.json()
    const page = toClinicalTrialsOffsetPage(payload, { limit })
    const trials = page.hits.map(hit => toRegistryTrial(hit.study)).filter((trial): trial is RegistryTrial => trial !== null)
    const { nextPageToken, totalCount } = asObject(payload)
    return {
      ok: true,
      total: typeof totalCount === "number" ? totalCount : null,
      trials,
      searchUrl,
      nextPageToken: isRegistryPageToken(nextPageToken) ? nextPageToken : null,
      paginationReset,
    }
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

// "EXPANDED_ACCESS" → "Expanded access", "NOT_YET_RECRUITING" → "Not yet recruiting"
export function formatRegistryCode(code: string) {
  const text = code.toLowerCase().replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// "2024-01-08" → "Jan 8, 2024"; "2024-01" → "Jan 2024". Formatted in UTC so that the day does not shift.
export function formatRegistryDate(date: string) {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(date)
  if (!match) return date
  const [, year, month, day] = match
  return new Date(Date.UTC(+year, +month - 1, day ? +day : 1)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    ...(day ? { day: "numeric" } : {}),
    timeZone: "UTC",
  })
}
