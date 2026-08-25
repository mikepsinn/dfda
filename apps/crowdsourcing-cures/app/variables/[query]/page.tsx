import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cache } from 'react'
import { decodeRouteParam } from '@/lib/decode-route-param'
import {
  getPublicStudies,
  getPublicVariable,
} from '@/lib/dfda/public-data'

interface VariablePageProps {
  params: {
    query: string
  }
}

// Study API responses include large nested reports and charts. Keep this page
// to the ten strongest relationships in each direction to bound cold renders.
const RELATED_STUDY_LIMIT = 10

const getVariableData = cache(async (query: string) => {
  const decodedQuery = decodeRouteParam(query)
  if (decodedQuery === null) return null

  const variable = await getPublicVariable(decodedQuery)
  if (!variable) return null

  const [causeCorrelations, effectCorrelations] = await Promise.all([
    getPublicStudies({
      causeVariableId: variable.id,
      limit: RELATED_STUDY_LIMIT,
    }),
    getPublicStudies({
      effectVariableId: variable.id,
      limit: RELATED_STUDY_LIMIT,
    }),
  ])

  return {
    variable,
    causeCorrelations,
    effectCorrelations,
  }
})

export async function generateMetadata({ params }: VariablePageProps): Promise<Metadata> {
  try {
    const data = await getVariableData(params.query)

    if (!data) {
      return {
        title: 'Variable Not Found',
        description: 'The requested variable could not be found.',
      }
    }

    return {
      title: `${data.variable.name} | DFDA`,
      description: data.variable.description || `View statistics and studies for ${data.variable.name}`,
    }
  } catch (error) {
    return {
      title: 'Variable Not Found',
      description: 'The requested variable could not be found.',
    }
  }
}

export default async function VariablePage({ params }: VariablePageProps) {
  const data = await getVariableData(params.query)

  if (!data) {
    notFound()
  }

  const { variable, causeCorrelations, effectCorrelations } = data

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 p-6 bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-6">
          {variable.imageUrl && (
            <img
              src={variable.imageUrl}
              alt={variable.name}
              className="w-24 h-24 object-cover border-4 border-black rounded-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-black mb-3">{variable.name}</h1>
            {variable.description && (
              <p className="text-lg text-gray-700 mb-4">{variable.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-yellow-200 border-2 border-black font-bold text-sm">
                {variable.variableCategoryName ?? 'Other'}
              </span>
              {variable.unitName && (
                <span className="px-3 py-1 bg-blue-200 border-2 border-black font-bold text-sm">
                  Unit: {variable.unitName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-white border-4 border-black rounded-lg">
          <div className="text-sm font-bold text-gray-600 mb-1">USERS</div>
          <div className="text-3xl font-black">
            {variable.numberOfUserVariables?.toLocaleString() || 0}
          </div>
        </div>
        <div className="p-4 bg-white border-4 border-black rounded-lg">
          <div className="text-sm font-bold text-gray-600 mb-1">MEASUREMENTS</div>
          <div className="text-3xl font-black">
            {variable.numberOfMeasurements?.toLocaleString() || 0}
          </div>
        </div>
        <div className="p-4 bg-white border-4 border-black rounded-lg">
          <div className="text-sm font-bold text-gray-600 mb-1">STUDIES</div>
          <div className="text-3xl font-black">
            {((variable.numberOfAggregateCorrelationsAsCause || 0) +
              (variable.numberOfAggregateCorrelationsAsEffect || 0)).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Outcomes (effects) */}
      {causeCorrelations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-4">
            What Does {variable.name} Predict?
          </h2>
          <div className="grid gap-3">
            {causeCorrelations.map((study) => {
              const effectVar = study.effectVariable
              const correlationValue = study.statistics?.forwardPearsonCorrelationCoefficient
              const correlationColor = correlationValue == null || correlationValue === 0
                ? 'bg-gray-200'
                : correlationValue > 0
                  ? 'bg-green-200'
                  : 'bg-red-200'

              return (
                <Link
                  key={study.id}
                  href={`/study/${encodeURIComponent(study.id)}`}
                  className="flex items-center justify-between p-4 bg-white border-3 border-black rounded-lg hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {effectVar.imageUrl && (
                      <img
                        src={effectVar.imageUrl}
                        alt={effectVar.name}
                        className="w-10 h-10 object-cover border-2 border-black rounded"
                      />
                    )}
                    <div>
                      <div className="font-bold">{effectVar.name}</div>
                      <div className="text-sm text-gray-600">
                        {study.statistics?.numberOfUsers == null
                          ? 'Unknown number of users'
                          : `${study.statistics.numberOfUsers.toLocaleString()} users`}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 ${correlationColor} border-2 border-black font-black rounded`}>
                    {correlationValue == null
                      ? '—'
                      : Math.abs(correlationValue).toFixed(3)}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Predictors (causes) */}
      {effectCorrelations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-4">
            What Predicts {variable.name}?
          </h2>
          <div className="grid gap-3">
            {effectCorrelations.map((study) => {
              const causeVar = study.causeVariable
              const correlationValue = study.statistics?.forwardPearsonCorrelationCoefficient
              const correlationColor = correlationValue == null || correlationValue === 0
                ? 'bg-gray-200'
                : correlationValue > 0
                  ? 'bg-green-200'
                  : 'bg-red-200'

              return (
                <Link
                  key={study.id}
                  href={`/study/${encodeURIComponent(study.id)}`}
                  className="flex items-center justify-between p-4 bg-white border-3 border-black rounded-lg hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {causeVar.imageUrl && (
                      <img
                        src={causeVar.imageUrl}
                        alt={causeVar.name}
                        className="w-10 h-10 object-cover border-2 border-black rounded"
                      />
                    )}
                    <div>
                      <div className="font-bold">{causeVar.name}</div>
                      <div className="text-sm text-gray-600">
                        {study.statistics?.numberOfUsers == null
                          ? 'Unknown number of users'
                          : `${study.statistics.numberOfUsers.toLocaleString()} users`}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 ${correlationColor} border-2 border-black font-black rounded`}>
                    {correlationValue == null
                      ? '—'
                      : Math.abs(correlationValue).toFixed(3)}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
