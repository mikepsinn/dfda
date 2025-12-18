import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@repo/mysql-database'
import { slugToName } from '@/lib/slugs'

interface VariablePageProps {
  params: {
    query: string
  }
}

async function getVariable(query: string) {
  // Try to find by ID first
  const isNumeric = /^\d+$/.test(query)

  let variable

  if (isNumeric) {
    variable = await prisma.variables.findFirst({
      where: {
        id: parseInt(query),
        deleted_at: null,
      },
      include: {
        variable_categories: true,
        units: true,
      },
    })
  } else {
    // Convert slug to name (Laravel uses underscores, e.g., "Overall_Mood" -> "Overall Mood")
    const name = slugToName(decodeURIComponent(query))
    variable = await prisma.variables.findFirst({
      where: {
        name: name,
        deleted_at: null,
      },
      include: {
        variable_categories: true,
        units: true,
      },
    })
  }

  if (!variable) {
    return null
  }

  // Get correlations as cause
  const causeCorrelations = await prisma.aggregate_correlations.findMany({
    where: {
      cause_variable_id: variable.id,
      deleted_at: null,
      is_public: true,
    },
    include: {
      variables_aggregate_correlations_effect_variable_idTovariables: {
        select: {
          id: true,
          name: true,
          image_url: true,
        },
      },
    },
    orderBy: {
      aggregate_qm_score: 'desc',
    },
    take: 20,
  })

  // Get correlations as effect
  const effectCorrelations = await prisma.aggregate_correlations.findMany({
    where: {
      effect_variable_id: variable.id,
      deleted_at: null,
      is_public: true,
    },
    include: {
      variables_aggregate_correlations_cause_variable_idTovariables: {
        select: {
          id: true,
          name: true,
          image_url: true,
        },
      },
    },
    orderBy: {
      aggregate_qm_score: 'desc',
    },
    take: 20,
  })

  return {
    variable,
    causeCorrelations,
    effectCorrelations,
  }
}

export async function generateMetadata({ params }: VariablePageProps): Promise<Metadata> {
  try {
    const data = await getVariable(params.query)

    if (!data) {
      return {
        title: 'Variable Not Found',
        description: 'The requested variable could not be found.',
      }
    }

    return {
      title: `${data.variable.name} | DFDA`,
      description: data.variable.description || `View statistics and correlations for ${data.variable.name}`,
    }
  } catch (error) {
    return {
      title: 'Variable Not Found',
      description: 'The requested variable could not be found.',
    }
  }
}

export default async function VariablePage({ params }: VariablePageProps) {
  const data = await getVariable(params.query)

  if (!data) {
    notFound()
  }

  const { variable, causeCorrelations, effectCorrelations } = data

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 p-6 bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-6">
          {variable.image_url && (
            <img
              src={variable.image_url}
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
                {variable.variable_categories.name}
              </span>
              {variable.units && (
                <span className="px-3 py-1 bg-blue-200 border-2 border-black font-bold text-sm">
                  Unit: {variable.units.name}
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
            {variable.number_of_user_variables?.toLocaleString() || 0}
          </div>
        </div>
        <div className="p-4 bg-white border-4 border-black rounded-lg">
          <div className="text-sm font-bold text-gray-600 mb-1">MEASUREMENTS</div>
          <div className="text-3xl font-black">
            {variable.number_of_measurements?.toLocaleString() || 0}
          </div>
        </div>
        <div className="p-4 bg-white border-4 border-black rounded-lg">
          <div className="text-sm font-bold text-gray-600 mb-1">CORRELATIONS</div>
          <div className="text-3xl font-black">
            {((variable.number_of_aggregate_correlations_as_cause || 0) +
              (variable.number_of_aggregate_correlations_as_effect || 0)).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Predictors (causes) */}
      {causeCorrelations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-4">
            What Predicts {variable.name}?
          </h2>
          <div className="grid gap-3">
            {causeCorrelations.map((corr) => {
              const effectVar = corr.variables_aggregate_correlations_effect_variable_idTovariables
              const correlationValue = corr.forward_pearson_correlation_coefficient || 0
              const correlationColor = correlationValue > 0 ? 'bg-green-200' : 'bg-red-200'

              return (
                <Link
                  key={corr.id}
                  href={`/study/${corr.id}`}
                  className="flex items-center justify-between p-4 bg-white border-3 border-black rounded-lg hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {effectVar.image_url && (
                      <img
                        src={effectVar.image_url}
                        alt={effectVar.name}
                        className="w-10 h-10 object-cover border-2 border-black rounded"
                      />
                    )}
                    <div>
                      <div className="font-bold">{effectVar.name}</div>
                      <div className="text-sm text-gray-600">
                        {corr.number_of_users?.toLocaleString()} users
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 ${correlationColor} border-2 border-black font-black rounded`}>
                    {Math.abs(correlationValue).toFixed(3)}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Outcomes (effects) */}
      {effectCorrelations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-4">
            What Does {variable.name} Predict?
          </h2>
          <div className="grid gap-3">
            {effectCorrelations.map((corr) => {
              const causeVar = corr.variables_aggregate_correlations_cause_variable_idTovariables
              const correlationValue = corr.forward_pearson_correlation_coefficient || 0
              const correlationColor = correlationValue > 0 ? 'bg-green-200' : 'bg-red-200'

              return (
                <Link
                  key={corr.id}
                  href={`/study/${corr.id}`}
                  className="flex items-center justify-between p-4 bg-white border-3 border-black rounded-lg hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {causeVar.image_url && (
                      <img
                        src={causeVar.image_url}
                        alt={causeVar.name}
                        className="w-10 h-10 object-cover border-2 border-black rounded"
                      />
                    )}
                    <div>
                      <div className="font-bold">{causeVar.name}</div>
                      <div className="text-sm text-gray-600">
                        {corr.number_of_users?.toLocaleString()} users
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 ${correlationColor} border-2 border-black font-black rounded`}>
                    {Math.abs(correlationValue).toFixed(3)}
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
