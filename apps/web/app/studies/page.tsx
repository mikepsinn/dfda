import Link from 'next/link'
import { prisma } from '@repo/mysql-database'

export const metadata = {
  title: 'Studies | DFDA',
  description: 'Browse all available population studies analyzing relationships between variables.',
}

// Revalidate every 6 hours
export const revalidate = 21600

async function getStudies(page: number = 1, perPage: number = 50) {
  const skip = (page - 1) * perPage

  const [studies, total] = await Promise.all([
    prisma.aggregate_correlations.findMany({
      where: {
        deleted_at: null,
        is_public: true,
      },
      include: {
        variables_aggregate_correlations_cause_variable_idTovariables: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variables_aggregate_correlations_effect_variable_idTovariables: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { aggregate_qm_score: 'desc' },
      ],
      skip,
      take: perPage,
    }),
    prisma.aggregate_correlations.count({
      where: {
        deleted_at: null,
        is_public: true,
      },
    }),
  ])

  return { studies, total, page, perPage }
}

export default async function StudiesPage() {
  const { studies, total } = await getStudies()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Population Studies</h1>
        <p className="text-xl text-gray-600">
          Browse {total.toLocaleString()} studies analyzing relationships between variables
        </p>
      </div>

      <div className="grid gap-4">
        {studies.map((study) => {
          const causeVar = study.variables_aggregate_correlations_cause_variable_idTovariables
          const effectVar = study.variables_aggregate_correlations_effect_variable_idTovariables
          const correlationValue = study.forward_pearson_correlation_coefficient || 0
          const correlationType = correlationValue > 0 ? 'positive' : 'negative'
          const correlationColor = correlationValue > 0 ? 'text-green-600' : 'text-red-600'

          return (
            <Link
              key={study.id}
              href={`/study/${study.id}`}
              className="block p-6 bg-white border rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-2">
                    {causeVar.name}{' '}
                    <span className="text-gray-400">→</span>{' '}
                    {effectVar.name}
                  </h2>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>
                      <strong>Users:</strong> {study.number_of_users?.toLocaleString()}
                    </span>
                    <span>
                      <strong>Correlations:</strong> {study.number_of_correlations?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${correlationColor}`}>
                    {Math.abs(correlationValue).toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">{correlationType}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {studies.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">No studies found</p>
        </div>
      )}
    </div>
  )
}
