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
  status: string
  type: string
  sex: string
  ages: ClinicalTrialAgeGroupKey[]
}

export const defaultTrialSearchForm: TrialSearchForm = {
  condition: "",
  treatment: "",
  location: "",
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

// search is null when the form has no condition, treatment or location, or when a text is too long.
export function parseTrialSearch(params: Params): {
  form: TrialSearchForm
  search: RegistrySearch | null
  error: string | null
} {
  const form: TrialSearchForm = {
    condition: first(params.condition).trim(),
    treatment: first(params.treatment).trim(),
    location: first(params.location).trim(),
    status: oneOf(first(params.status), statusOptions, defaultTrialSearchForm.status),
    type: oneOf(first(params.type), studyTypeOptions, "all"),
    sex: oneOf(first(params.sex), sexOptions, "all"),
    ages: ageOptions.map(option => option.value).filter(age => list(params.age).includes(age)),
  }

  const tooLong = textFields.find(([field]) => form[field].length > MAX_SEARCH_TEXT_LENGTH)
  if (tooLong) {
    return { form, search: null, error: `The ${tooLong[1]} is too long to search. Use at most ${MAX_SEARCH_TEXT_LENGTH} characters.` }
  }
  if (!form.condition && !form.treatment && !form.location) {
    return { form, search: null, error: null }
  }

  return {
    form,
    search: {
      condition: form.condition || undefined,
      treatment: form.treatment || undefined,
      location: form.location || undefined,
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
  if (form.status !== defaultTrialSearchForm.status) query.set("status", form.status)
  if (form.type !== "all") query.set("type", form.type)
  if (form.sex !== "all") query.set("sex", form.sex)
  for (const age of form.ages) query.append("age", age)
  return query
}
