import { DFDA_APP_ORIGIN } from "./constants"
import { nameToSlug, slugToName } from "@/lib/slugs"

const PUBLIC_DATA_REVALIDATE_SECONDS = 3600
const PUBLIC_DATA_TIMEOUT_MS = 30_000

type QueryValue = string | number | boolean | undefined

export class PublicDfdaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = "PublicDfdaApiError"
  }
}

export interface PublicVariable {
  id: number
  name: string
  description?: string | null
  imageUrl?: string | null
  isPublic?: boolean
  numberOfAggregateCorrelationsAsCause?: number | null
  numberOfAggregateCorrelationsAsEffect?: number | null
  numberOfCorrelations?: number | null
  numberOfMeasurements?: number | null
  numberOfUserVariables?: number | null
  unitName?: string | null
  url?: string | null
  variableCategoryId?: number | null
  variableCategoryName?: string | null
}

export interface PublicVariableCategory {
  id: number
  name: string
  boring?: boolean | null
  imageUrl?: string | null
  isPublic?: boolean | null
  public?: boolean | null
  numberOfMeasurements?: number | null
  numberOfOutcomePopulationStudies?: number | null
  numberOfPredictorPopulationStudies?: number | null
  numberOfUserVariables?: number | null
  numberOfVariables?: number | null
}

export interface PublicCorrelation {
  aggregateQMScore?: number | null
  averageEffectFollowingHighCause?: number | null
  averageEffectFollowingLowCause?: number | null
  confidenceInterval?: number | null
  forwardPearsonCorrelationCoefficient?: number | null
  numberOfCorrelations?: number | null
  numberOfPairs?: number | null
  numberOfUsers?: number | null
  pValue?: number | null
  statisticalSignificance?: number | null
  tValue?: number | null
  updatedAt?: string | null
}

export interface PublicStudy {
  id: string
  type?: string
  causeVariable: PublicVariable
  causeVariableId?: number
  causeVariableName?: string
  effectVariable: PublicVariable
  effectVariableId?: number
  effectVariableName?: string
  statistics?: PublicCorrelation | null
}

interface PublicStudiesResponse {
  success?: boolean
  studies?: PublicStudy[]
}

async function publicDfdaGet<T>(
  path: string,
  query: Record<string, QueryValue> = {}
): Promise<T> {
  const url = new URL(`/api/v3/${path}`, DFDA_APP_ORIGIN)

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(PUBLIC_DATA_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new PublicDfdaApiError(
      `DFDA API request failed with status ${response.status}`,
      response.status
    )
  }

  return response.json() as Promise<T>
}

export async function getPublicVariables({
  categoryName,
  concise = false,
  id,
  limit = 200,
  name,
}: {
  categoryName?: string
  concise?: boolean
  id?: number
  limit?: number
  name?: string
} = {}): Promise<PublicVariable[]> {
  const variables = await publicDfdaGet<unknown>("variables", {
    concise: concise ? true : undefined,
    id,
    includePublic: true,
    limit,
    name,
    sort: "-numberOfAggregateCorrelationsAsEffect",
    variableCategoryName: categoryName,
  })

  if (!Array.isArray(variables)) {
    throw new Error("DFDA variables response was not an array")
  }

  return variables as PublicVariable[]
}

export async function getPublicVariable(query: string) {
  const numericId = /^\d+$/.test(query) ? Number.parseInt(query, 10) : undefined
  const name = numericId === undefined ? slugToName(query) : undefined
  const variables = await getPublicVariables({ id: numericId, limit: 5, name })

  const directMatch = variables.find((variable) =>
    numericId === undefined
      ? variable.name.localeCompare(name ?? "", undefined, {
          sensitivity: "accent",
        }) === 0
      : variable.id === numericId
  )

  if (directMatch || numericId !== undefined) return directMatch ?? null

  const requestedSlug = query.toLocaleLowerCase()
  const slugMatch = variables.find(
    (variable) =>
      getPublicVariableSlug(variable).toLocaleLowerCase() === requestedSlug
  )
  if (slugMatch) return slugMatch

  // nameToSlug intentionally removes or replaces punctuation. Search by the
  // strongest remaining substring, then compare the API's canonical slug so
  // broad wildcard results cannot resolve to the wrong variable.
  const slugParts = query.match(/[\p{L}\p{N}]+/gu) ?? []
  const strongestPart = slugParts.sort(
    (left, right) => right.length - left.length
  )[0]
  const searchLengths = [8, 4, 3, 2]
  const searchPhrases = strongestPart
    ? Array.from(
        new Set(
          searchLengths.map(
            (length) => `%${strongestPart.slice(0, length)}%`
          )
        )
      )
    : []

  for (const fallbackName of searchPhrases) {
    const fallbackVariables = await getPublicVariables({
      limit: 200,
      name: fallbackName,
    })
    const fallbackMatch = fallbackVariables.find(
      (variable) =>
        getPublicVariableSlug(variable).toLocaleLowerCase() === requestedSlug
    )
    if (fallbackMatch) return fallbackMatch
  }

  return null
}

export function isDiscoverablePublicVariable(variable: PublicVariable) {
  return (
    (variable.numberOfUserVariables ?? 0) > 2 &&
    (variable.numberOfMeasurements ?? 0) > 5 &&
    (variable.numberOfAggregateCorrelationsAsCause ?? 0) +
      (variable.numberOfAggregateCorrelationsAsEffect ?? 0) >
      0
  )
}

export async function getPublicVariableCategories({
  includeBoring = false,
}: {
  includeBoring?: boolean
} = {}) {
  const categories = await publicDfdaGet<unknown>("variableCategories")

  if (!Array.isArray(categories)) {
    throw new Error("DFDA variable categories response was not an array")
  }

  return (categories as PublicVariableCategory[])
    .filter((category) =>
      (includeBoring || !category.boring) &&
      category.isPublic !== false &&
      category.public !== false
    )
    .sort(
      (left, right) =>
        (right.numberOfVariables ?? 0) - (left.numberOfVariables ?? 0)
    )
}

export async function getPublicStudies({
  causeVariableId,
  effectVariableId,
  limit = 50,
  offset = 0,
}: {
  causeVariableId?: number
  effectVariableId?: number
  limit?: number
  offset?: number
} = {}) {
  const response = await publicDfdaGet<PublicStudiesResponse>("studies", {
    aggregated: true,
    causeVariableId,
    effectVariableId,
    limit,
    offset,
    sort: "-aggregate_qm_score",
  })

  if (!Array.isArray(response.studies)) {
    throw new Error("DFDA studies response did not contain a studies array")
  }

  return response.studies
}

export async function getPublicStudy(studyId: string) {
  const study = await publicDfdaGet<unknown>("study", { studyId })

  if (
    typeof study !== "object" ||
    study === null ||
    typeof (study as PublicStudy).id !== "string" ||
    typeof (study as PublicStudy).causeVariable?.id !== "number" ||
    typeof (study as PublicStudy).causeVariable?.name !== "string" ||
    typeof (study as PublicStudy).effectVariable?.id !== "number" ||
    typeof (study as PublicStudy).effectVariable?.name !== "string"
  ) {
    throw new Error("DFDA study response was malformed")
  }

  return study as PublicStudy
}

export function getPublicVariableSlug(variable: Pick<PublicVariable, "name">) {
  return nameToSlug(variable.name)
}

export function toVariableListItem(variable: PublicVariable) {
  return {
    id: variable.id,
    image_url: variable.imageUrl ?? null,
    name: variable.name,
    number_of_aggregate_correlations_as_cause:
      variable.numberOfAggregateCorrelationsAsCause ?? null,
    number_of_aggregate_correlations_as_effect:
      variable.numberOfAggregateCorrelationsAsEffect ?? null,
    number_of_user_variables: variable.numberOfUserVariables ?? null,
    slug: getPublicVariableSlug(variable),
    variable_category_id: variable.variableCategoryId ?? null,
    variable_categories: {
      name: variable.variableCategoryName ?? "Other",
    },
  }
}

export function toVariableCategoryListItem(category: PublicVariableCategory) {
  return {
    id: category.id,
    image_url: category.imageUrl ?? null,
    name: category.name,
    number_of_measurements: category.numberOfMeasurements ?? null,
    number_of_outcome_population_studies:
      category.numberOfOutcomePopulationStudies ?? null,
    number_of_predictor_population_studies:
      category.numberOfPredictorPopulationStudies ?? null,
    number_of_user_variables: category.numberOfUserVariables ?? null,
    number_of_variables: category.numberOfVariables ?? null,
    slug: nameToSlug(category.name),
  }
}
