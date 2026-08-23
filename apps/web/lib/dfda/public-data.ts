import { DFDA_APP_ORIGIN } from "./constants"
import { nameToSlug, slugToName } from "@/lib/slugs"

const PUBLIC_DATA_REVALIDATE_SECONDS = 3600

type QueryValue = string | number | boolean | undefined

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
  })

  if (!response.ok) {
    throw new Error(`DFDA API request failed with status ${response.status}`)
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

  return variables.find((variable) =>
    numericId === undefined
      ? variable.name.localeCompare(name ?? "", undefined, {
          sensitivity: "accent",
        }) === 0
      : variable.id === numericId
  ) ?? null
}

export async function getPublicVariableCategories() {
  const categories = await publicDfdaGet<unknown>("variableCategories")

  if (!Array.isArray(categories)) {
    throw new Error("DFDA variable categories response was not an array")
  }

  return (categories as PublicVariableCategory[])
    .filter((category) =>
      !category.boring && category.isPublic !== false && category.public !== false
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
  return publicDfdaGet<PublicStudy>("study", { studyId })
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
