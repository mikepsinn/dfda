import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { decodeRouteParam } from '@/lib/decode-route-param'
import {
  getPublicStudy,
  getPublicVariable,
  PublicDfdaApiError,
} from '@/lib/dfda/public-data'

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
      title: `${study.causeVariable.name} → ${study.effectVariable.name} Study`,
      description: `Analyze the relationship between ${study.causeVariable.name} and ${study.effectVariable.name}.`,
    }
  } catch (error) {
    return {
      title: 'Study Not Found',
      description: 'The requested study could not be found.',
    }
  }
}

const getStudyBySlug = cache(async (causeSlug: string, effectSlug: string) => {
  try {
    const decodedCauseSlug = decodeRouteParam(causeSlug)
    const decodedEffectSlug = decodeRouteParam(effectSlug)
    if (decodedCauseSlug === null || decodedEffectSlug === null) return null

    const [causeVariable, effectVariable] = await Promise.all([
      getPublicVariable(decodedCauseSlug),
      getPublicVariable(decodedEffectSlug),
    ])

    if (!causeVariable || !effectVariable) return null

    return getPublicStudy(
      `cause-${causeVariable.id}-effect-${effectVariable.id}-population-study`
    )
  } catch (error) {
    console.error('Error fetching study:', error)
    if (error instanceof PublicDfdaApiError && error.status === 404) {
      return null
    }
    throw error
  }
})

export default async function StudyPage({ params }: StudyPageProps) {
  const study = await getStudyBySlug(params.causeSlug, params.effectSlug)

  if (!study || !study.statistics) {
    notFound()
  }

  const statistics = study.statistics
  const correlationValue = statistics.forwardPearsonCorrelationCoefficient
  const correlationStrength = correlationValue == null ? null : Math.abs(correlationValue)
  const correlationType = correlationValue == null
    ? 'unavailable'
    : correlationValue > 0
      ? 'positive'
      : correlationValue < 0
        ? 'negative'
        : 'no correlation'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {study.causeVariable.name} → {study.effectVariable.name}
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
              <strong>Correlation:</strong>{' '}
              {correlationStrength == null ? 'Unavailable' : `${correlationStrength.toFixed(3)} (${correlationType})`}
            </p>
            <p className="text-lg">
              <strong>Sample Size:</strong>{' '}
              {statistics.numberOfUsers == null
                ? 'Unknown'
                : `${statistics.numberOfUsers.toLocaleString()} users`}
            </p>
            {statistics.statisticalSignificance != null && (
              <p className="text-lg">
                <strong>Statistical Significance:</strong> {statistics.statisticalSignificance.toFixed(3)}
              </p>
            )}
          </div>
        </div>

        {/* Variables */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Predictor Variable</h3>
            <p className="text-2xl font-bold text-blue-600 mb-2">
              {study.causeVariable.name}
            </p>
            {study.causeVariable.description && (
              <p className="text-gray-600">{study.causeVariable.description}</p>
            )}
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Outcome Variable</h3>
            <p className="text-2xl font-bold text-green-600 mb-2">
              {study.effectVariable.name}
            </p>
            {study.effectVariable.description && (
              <p className="text-gray-600">{study.effectVariable.description}</p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Statistical Analysis</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {statistics.pValue != null && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">P-Value</p>
                <p className="text-2xl font-bold">{statistics.pValue.toFixed(4)}</p>
              </div>
            )}
            {statistics.tValue != null && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">T-Value</p>
                <p className="text-2xl font-bold">{statistics.tValue.toFixed(3)}</p>
              </div>
            )}
            {statistics.confidenceInterval != null && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Confidence Interval</p>
                <p className="text-2xl font-bold">{statistics.confidenceInterval.toFixed(3)}</p>
              </div>
            )}
            {statistics.numberOfPairs != null && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Number of Pairs</p>
                <p className="text-2xl font-bold">{statistics.numberOfPairs.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Effect Details */}
        {(statistics.averageEffectFollowingHighCause != null || statistics.averageEffectFollowingLowCause != null) && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Effect Analysis</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {statistics.averageEffectFollowingHighCause != null && (
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-gray-600">Average Effect (High {study.causeVariable.name})</p>
                  <p className="text-2xl font-bold">{statistics.averageEffectFollowingHighCause.toFixed(2)}</p>
                </div>
              )}
              {statistics.averageEffectFollowingLowCause != null && (
                <div className="p-4 bg-red-50 rounded">
                  <p className="text-sm text-gray-600">Average Effect (Low {study.causeVariable.name})</p>
                  <p className="text-2xl font-bold">{statistics.averageEffectFollowingLowCause.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          <p>Study ID: {study.id}</p>
          {statistics.updatedAt && (
            <p>Last updated: {new Date(statistics.updatedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}
