import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prismaMysql } from '@/lib/prisma-mysql'

interface StudyPageProps {
  params: {
    causeSlug: string
    effectSlug: string
  }
}

// Enable ISR - revalidate every hour
export const revalidate = 3600

export async function generateMetadata({ params }: StudyPageProps): Promise<Metadata> {
  try {
    const study = await getStudyBySlug(params.causeSlug, params.effectSlug)

    if (!study) {
      return {
        title: 'Study Not Found',
        description: 'The requested study could not be found.',
      }
    }

    return {
      title: `${study.cause_variable.name} → ${study.effect_variable.name} Study`,
      description: `Analyze the relationship between ${study.cause_variable.name} and ${study.effect_variable.name}.`,
    }
  } catch (error) {
    return {
      title: 'Study Not Found',
      description: 'The requested study could not be found.',
    }
  }
}

async function getStudyBySlug(causeSlug: string, effectSlug: string) {
  try {
    // Find the cause and effect variables by slug
    const [causeVariable, effectVariable] = await Promise.all([
      prismaMysql.variables.findUnique({
        where: { slug: causeSlug },
        select: { id: true, name: true, slug: true, description: true, image_url: true },
      }),
      prismaMysql.variables.findUnique({
        where: { slug: effectSlug },
        select: { id: true, name: true, slug: true, description: true, image_url: true },
      }),
    ])

    if (!causeVariable || !effectVariable) {
      return null
    }

    // Find the aggregate correlation
    const correlation = await prismaMysql.aggregate_correlations.findFirst({
      where: {
        cause_variable_id: causeVariable.id,
        effect_variable_id: effectVariable.id,
        deleted_at: null,
        is_public: true,
      },
      include: {
        cause_variable: true,
        effect_variable: true,
      },
    })

    return correlation
  } catch (error) {
    console.error('Error fetching study:', error)
    return null
  }
}

export default async function StudyPage({ params }: StudyPageProps) {
  const study = await getStudyBySlug(params.causeSlug, params.effectSlug)

  if (!study) {
    notFound()
  }

  const correlationStrength = study.forward_pearson_correlation_coefficient
    ? Math.abs(study.forward_pearson_correlation_coefficient)
    : 0

  const correlationType = study.forward_pearson_correlation_coefficient && study.forward_pearson_correlation_coefficient > 0
    ? 'positive'
    : 'negative'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {study.cause_variable.name} → {study.effect_variable.name}
          </h1>
          <p className="text-xl text-gray-600">
            Population Study
          </p>
        </div>

        {/* Key Findings */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Key Findings</h2>
          <div className="space-y-3">
            <p className="text-lg">
              <strong>Correlation:</strong> {correlationStrength.toFixed(3)} ({correlationType})
            </p>
            <p className="text-lg">
              <strong>Sample Size:</strong> {study.number_of_users?.toLocaleString()} users
            </p>
            {study.statistical_significance && (
              <p className="text-lg">
                <strong>Statistical Significance:</strong> {study.statistical_significance.toFixed(3)}
              </p>
            )}
          </div>
        </div>

        {/* Variables */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Predictor Variable</h3>
            <p className="text-2xl font-bold text-blue-600 mb-2">
              {study.cause_variable.name}
            </p>
            {study.cause_variable.description && (
              <p className="text-gray-600">{study.cause_variable.description}</p>
            )}
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Outcome Variable</h3>
            <p className="text-2xl font-bold text-green-600 mb-2">
              {study.effect_variable.name}
            </p>
            {study.effect_variable.description && (
              <p className="text-gray-600">{study.effect_variable.description}</p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Statistical Analysis</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {study.p_value !== null && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">P-Value</p>
                <p className="text-2xl font-bold">{study.p_value.toFixed(4)}</p>
              </div>
            )}
            {study.t_value !== null && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">T-Value</p>
                <p className="text-2xl font-bold">{study.t_value.toFixed(3)}</p>
              </div>
            )}
            {study.confidence_interval !== null && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Confidence Interval</p>
                <p className="text-2xl font-bold">{study.confidence_interval.toFixed(3)}</p>
              </div>
            )}
            {study.number_of_pairs !== null && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Number of Pairs</p>
                <p className="text-2xl font-bold">{study.number_of_pairs.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Effect Details */}
        {(study.average_effect_following_high_cause !== null || study.average_effect_following_low_cause !== null) && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Effect Analysis</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {study.average_effect_following_high_cause !== null && (
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-gray-600">Average Effect (High {study.cause_variable.name})</p>
                  <p className="text-2xl font-bold">{study.average_effect_following_high_cause.toFixed(2)}</p>
                </div>
              )}
              {study.average_effect_following_low_cause !== null && (
                <div className="p-4 bg-red-50 rounded">
                  <p className="text-sm text-gray-600">Average Effect (Low {study.cause_variable.name})</p>
                  <p className="text-2xl font-bold">{study.average_effect_following_low_cause.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          <p>Study ID: {study.id}</p>
          <p>Last updated: {new Date(study.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
