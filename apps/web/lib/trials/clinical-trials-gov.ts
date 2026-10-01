// Copied unchanged from mikepsinn/optimitron packages/data/src/fetchers/clinical-trials-gov.ts
// at commit 700dcbc, with its tests (tests/unit/lib/clinical-trials-gov-search.test.ts).
// docs/MIGRATION.md plans to move it into a shared trials package later.

/**
 * ClinicalTrials.gov study search.
 *
 * Uses the documented v2 API: https://clinicaltrials.gov/data-api/api
 *
 * The site's own /api/int/studies endpoint served this until it started
 * answering 403 to every caller, with or without a browser user agent, so do
 * not go back to it.
 *
 * v2 has no offset parameter; it pages with an opaque nextPageToken. Callers
 * here page by offset, so a page is read as the first `from + limit` studies
 * and then sliced. That caps offset paging at CLINICAL_TRIALS_MAX_STUDIES.
 */

export const CLINICAL_TRIALS_SEARCH_ENDPOINT =
  "https://clinicaltrials.gov/api/v2/studies";

/** v2 rejects a pageSize above this, which is what caps offset paging. */
export const CLINICAL_TRIALS_MAX_STUDIES = 1000;

/** Radius used when a search has coordinates but no explicit distance. */
const DEFAULT_DISTANCE_MILES = 50;

export type ClinicalTrialStatusKey =
  | "not yet recruiting"
  | "recruiting"
  | "enrolling"
  | "active"
  | "suspended"
  | "terminated"
  | "completed"
  | "withdrawn"
  | "unknown"
  | "available"
  | "no longer available"
  | "approved for marketing";

export type ClinicalTrialStudyTypeKey = "int" | "obs" | "pat" | "all";
export type ClinicalTrialAgeGroupKey = "child" | "adult" | "older_adult";
export type ClinicalTrialSexKey = "all" | "female" | "male";

export interface ClinicalTrialsSearchParams {
  ageGroups?: ClinicalTrialAgeGroupKey[];
  condition?: string;
  distance?: number;
  from?: number;
  intervention?: string;
  lat?: number;
  limit?: number;
  lng?: number;
  locStr?: string;
  sex?: ClinicalTrialSexKey;
  studyStatus?: ClinicalTrialStatusKey;
  studyType?: ClinicalTrialStudyTypeKey;
}

/** Values verified against the live API; it rejects anything else. */
const STATUS_TO_V2: Record<ClinicalTrialStatusKey, string> = {
  "not yet recruiting": "NOT_YET_RECRUITING",
  recruiting: "RECRUITING",
  enrolling: "ENROLLING_BY_INVITATION",
  active: "ACTIVE_NOT_RECRUITING",
  suspended: "SUSPENDED",
  terminated: "TERMINATED",
  completed: "COMPLETED",
  withdrawn: "WITHDRAWN",
  unknown: "UNKNOWN",
  available: "AVAILABLE",
  "no longer available": "NO_LONGER_AVAILABLE",
  "approved for marketing": "APPROVED_FOR_MARKETING",
};

const STUDY_TYPE_TO_V2: Record<
  Exclude<ClinicalTrialStudyTypeKey, "all">,
  string
> = {
  int: "INTERVENTIONAL",
  obs: "OBSERVATIONAL",
  pat: "EXPANDED_ACCESS",
};

const AGE_GROUP_TO_V2: Record<ClinicalTrialAgeGroupKey, string> = {
  child: "CHILD",
  adult: "ADULT",
  older_adult: "OLDER_ADULT",
};

const SEX_TO_V2: Record<Exclude<ClinicalTrialSexKey, "all">, string> = {
  female: "FEMALE",
  male: "MALE",
};

/**
 * Only the modules the trial cards read. The whole study payload is about
 * eight times larger, mostly eligibility criteria and results text.
 */
const STUDY_FIELDS = [
  "protocolSection.identificationModule",
  "protocolSection.statusModule",
  "protocolSection.designModule",
  "protocolSection.conditionsModule",
  "protocolSection.armsInterventionsModule",
  "protocolSection.contactsLocationsModule",
  "protocolSection.sponsorCollaboratorsModule",
  "protocolSection.eligibilityModule.sex",
  "protocolSection.eligibilityModule.minimumAge",
  "protocolSection.eligibilityModule.maximumAge",
  "protocolSection.eligibilityModule.stdAges",
  "hasResults",
].join(",");

/**
 * Filter keys arrive from a URL query string and are only cast to these unions
 * by the callers, so an unknown value can reach a map. v2 rejects the whole
 * request for a bad filter value, so drop what does not map instead.
 */
function lookUp<Key extends string>(
  map: Record<Key, string>,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return Object.prototype.hasOwnProperty.call(map, key)
    ? map[key as Key]
    : undefined;
}

/**
 * Page values come from a query string, so `?from=abc` arrives as NaN and
 * `?from=-5` as a negative. NaN reaches the API as `pageSize=NaN`, which it
 * rejects outright, and a negative offset slices from the end and silently
 * returns nothing.
 */
function toPageValue(
  value: number | undefined,
  fallback: number,
  minimum: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(Math.floor(value), minimum);
}

/**
 * Coordinates come from the same query string, so `?lat=abc` arrives as NaN,
 * which is still a `number`. A NaN or out-of-range coordinate would produce
 * `distance(NaN,-74,50mi)`, which the API rejects, and would also hide the
 * text-location fallback. Treat it as no coordinate.
 */
function toCoordinate(value: number | undefined, limit: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.abs(value) <= limit ? value : undefined;
}

/** How many studies must be read to serve the window that starts at `from`. */
export function getRequiredPageSize(from: number, limit: number): number {
  return Math.min(
    toPageValue(from, 0, 0) + toPageValue(limit, 10, 1),
    CLINICAL_TRIALS_MAX_STUDIES,
  );
}

export function buildClinicalTrialsSearchUrl(
  params: ClinicalTrialsSearchParams,
): URL {
  const {
    ageGroups,
    condition,
    distance,
    from = 0,
    intervention,
    lat,
    limit = 10,
    lng,
    locStr,
    sex,
    studyStatus,
    studyType,
  } = params;

  const url = new URL(CLINICAL_TRIALS_SEARCH_ENDPOINT);
  const query = url.searchParams;

  if (condition) query.set("query.cond", condition);
  if (intervention) query.set("query.intr", intervention);

  // Coordinates win over the text location. The search form fills locStr with
  // "Current Location" or "Coordinates Provided" whenever it sends
  // coordinates, and v2 reads query.locn as a place name: sending both matched
  // nothing at all.
  const latitude = toCoordinate(lat, 90);
  const longitude = toCoordinate(lng, 180);
  if (latitude !== undefined && longitude !== undefined) {
    const radius = toPageValue(distance, DEFAULT_DISTANCE_MILES, 1);
    query.set("filter.geo", `distance(${latitude},${longitude},${radius}mi)`);
  } else if (locStr) {
    query.set("query.locn", locStr);
  }

  const status = lookUp(STATUS_TO_V2, studyStatus);
  if (status) query.set("filter.overallStatus", status);

  // Everything else filters on a study field, which v2 takes as one expression.
  const advanced: string[] = [];
  const type = studyType === "all" ? undefined : lookUp(STUDY_TYPE_TO_V2, studyType);
  if (type) advanced.push(`AREA[StudyType]${type}`);

  const sexValue = sex === "all" ? undefined : lookUp(SEX_TO_V2, sex);
  if (sexValue) advanced.push(`AREA[Sex]${sexValue}`);

  if (ageGroups?.length) {
    const ages = ageGroups
      .map((group) => lookUp(AGE_GROUP_TO_V2, group))
      .filter((age): age is string => Boolean(age));
    if (ages.length > 0) {
      advanced.push(`AREA[StdAge](${ages.join(" OR ")})`);
    }
  }
  if (advanced.length > 0) {
    query.set("filter.advanced", advanced.join(" AND "));
  }

  query.set("pageSize", String(getRequiredPageSize(from, limit)));
  query.set("countTotal", "true");
  query.set("fields", STUDY_FIELDS);
  query.set("sort", "@relevance");

  return url;
}

interface ClinicalTrialsV2Payload {
  studies?: unknown[];
  totalCount?: number;
}

export interface ClinicalTrialsOffsetPage {
  from: number;
  limit: number;
  total: number;
  hits: { id: string; study: Record<string, unknown> }[];
}

/** Only the part of a v2 study this module reads; the rest passes through. */
interface StudyWithNctId {
  protocolSection?: { identificationModule?: { nctId?: unknown } };
}

function readNctId(study: unknown): string {
  const nctId = (study as StudyWithNctId | null)?.protocolSection
    ?.identificationModule?.nctId;
  return typeof nctId === "string" ? nctId : "";
}

/**
 * Turn a v2 payload into the offset-paged shape the trial pages render. The
 * request already asked for `from + limit` studies, so the window is the tail.
 */
export function toClinicalTrialsOffsetPage(
  payload: unknown,
  { from, limit }: { from?: number; limit?: number },
): ClinicalTrialsOffsetPage {
  const start = toPageValue(from, 0, 0);
  const size = toPageValue(limit, 10, 1);
  const { studies, totalCount } = (payload ?? {}) as ClinicalTrialsV2Payload;
  // A null or malformed `studies` must not crash the page that renders it.
  const found = Array.isArray(studies) ? studies : [];
  const window = found.slice(start, start + size);

  return {
    from: start,
    limit: size,
    total: typeof totalCount === "number" ? totalCount : found.length,
    hits: window.map((study) => ({
      id: readNctId(study),
      study: study as Record<string, unknown>,
    })),
  };
}
