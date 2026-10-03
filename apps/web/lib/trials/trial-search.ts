import type { ClinicalTrialAgeGroupKey } from "./clinical-trials-gov"
import type { RegistrySearch, RegistryStatus } from "./registry-trials"

// The /find-trials search form: its options, and the conversion between its URL parameters
// and a registry search. Invalid parameter values are ignored, not reported.

export const MAX_SEARCH_TEXT_LENGTH = 200

export const statusOptions: readonly { value: string; label: string; status?: RegistryStatus }[] = [
  { value: "recruiting", label: "Recruiting", status: "recruiting" },
  { value: "not-yet-recruiting", label: "Not yet recruiting", status: "not yet recruiting" },
  { value: "enrolling", label: "Enrolling by invitation", status: "enrolling" },
  { value: "active", label: "Active, not recruiting", status: "active" },
  { value: "completed", label: "Completed", status: "completed" },
  { value: "all", label: "Any status" },
]

export const studyTypeOptions = [
  { value: "all", label: "Any type" },
  { value: "int", label: "Interventional: tests a treatment" },
  { value: "obs", label: "Observational: no assigned treatment" },
] as const

export const sexOptions = [
  { value: "all", label: "Any" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
] as const

export const distanceOptions = ["10", "25", "50", "100", "250"].map(miles => ({ value: miles, label: `Within ${miles} miles` }))

// ClinicalTrials.gov's standard age groups.
export const ageOptions: readonly { value: ClinicalTrialAgeGroupKey; label: string }[] = [
  { value: "child", label: "Child (0–17)" },
  { value: "adult", label: "Adult (18–64)" },
  { value: "older_adult", label: "Older adult (65+)" },
]

// The values the form shows; also the URL parameters, except that defaults are left out.
export interface TrialSearchForm {
  condition: string
  treatment: string
  location: string
  // "lat,lng" from the browser's location, rounded to 2 decimals (about 1 km); it replaces location.
  near: string
  // Miles from near.
  distance: string
  status: string
  type: string
  sex: string
  ages: ClinicalTrialAgeGroupKey[]
}

export const defaultTrialSearchForm: TrialSearchForm = {
  condition: "",
  treatment: "",
  location: "",
  near: "",
  distance: "50",
  status: "recruiting",
  type: "all",
  sex: "all",
  ages: [],
}

type Params = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? ""
const list = (value: string | string[] | undefined) => (Array.isArray(value) ? value : value ? [value] : [])
const oneOf = <T extends string>(value: string, options: readonly { value: T }[], fallback: T): T =>
  options.find(option => option.value === value)?.value ?? fallback

const textFields = [
  ["condition", "condition"],
  ["treatment", "treatment"],
  ["location", "location"],
] as const

// "42.3601,-71.0589" → { lat: 42.36, lng: -71.06 }; null for anything that is not a point on Earth.
export function parseNear(value: string) {
  const match = /^(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/.exec(value.replace(/\s/g, ""))
  if (!match) return null
  const [lat, lng] = [Number(match[1]), Number(match[2])].map(n => Math.round(n * 100) / 100)
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
}

// search is null when the form has no condition, treatment or place, or when a text is too long.
export function parseTrialSearch(params: Params): {
  form: TrialSearchForm
  search: RegistrySearch | null
  error: string | null
} {
  const near = parseNear(first(params.near))
  const form: TrialSearchForm = {
    condition: first(params.condition).trim(),
    treatment: first(params.treatment).trim(),
    location: near ? "" : first(params.location).trim(),
    near: near ? `${near.lat},${near.lng}` : "",
    distance: oneOf(first(params.distance), distanceOptions, defaultTrialSearchForm.distance),
    status: oneOf(first(params.status), statusOptions, defaultTrialSearchForm.status),
    type: oneOf(first(params.type), studyTypeOptions, "all"),
    sex: oneOf(first(params.sex), sexOptions, "all"),
    ages: ageOptions.map(option => option.value).filter(age => list(params.age).includes(age)),
  }

  const tooLong = textFields.find(([field]) => form[field].length > MAX_SEARCH_TEXT_LENGTH)
  if (tooLong) {
    return { form, search: null, error: `The ${tooLong[1]} is too long to search. Use at most ${MAX_SEARCH_TEXT_LENGTH} characters.` }
  }
  if (!form.condition && !form.treatment && !form.location && !near) {
    return { form, search: null, error: null }
  }

  return {
    form,
    search: {
      condition: form.condition || undefined,
      treatment: form.treatment || undefined,
      location: form.location || undefined,
      near: near ? { ...near, miles: Number(form.distance) } : undefined,
      status: statusOptions.find(option => option.value === form.status)?.status,
      studyType: form.type === "all" ? undefined : (form.type as RegistrySearch["studyType"]),
      sex: form.sex === "all" ? undefined : (form.sex as RegistrySearch["sex"]),
      ageGroups: form.ages.length ? form.ages : undefined,
    },
    error: null,
  }
}

// The form's URL parameters, without defaults, for links that keep the search.
export function trialSearchQuery(form: TrialSearchForm) {
  const query = new URLSearchParams()
  for (const [field] of textFields) {
    if (form[field]) query.set(field, form[field])
  }
  if (form.near) {
    query.set("near", form.near)
    if (form.distance !== defaultTrialSearchForm.distance) query.set("distance", form.distance)
  }
  if (form.status !== defaultTrialSearchForm.status) query.set("status", form.status)
  if (form.type !== "all") query.set("type", form.type)
  if (form.sex !== "all") query.set("sex", form.sex)
  for (const age of form.ages) query.append("age", age)
  return query
}

const shortAgeLabels: Record<ClinicalTrialAgeGroupKey, string> = { child: "child", adult: "adult", older_adult: "older adult" }

// The search in short phrases, for the "Showing studies for" chips above the results.
export function describeTrialSearch(form: TrialSearchForm): string[] {
  const ages = form.ages.map(age => shortAgeLabels[age])
  return [
    form.condition && `Condition: ${form.condition}`,
    form.treatment && `Treatment: ${form.treatment}`,
    form.near ? `Within ${form.distance} miles of your location` : form.location && `Location: ${form.location}`,
    statusOptions.find(option => option.value === form.status)?.label ?? "",
    form.type === "int" ? "Interventional studies" : form.type === "obs" ? "Observational studies" : "",
    form.sex === "all" ? "" : `Open to ${form.sex === "female" ? "women" : "men"}`,
    ages.length ? `Open to ages: ${ages.join(", ")}` : "",
  ].filter((phrase): phrase is string => Boolean(phrase))
}
