import Link from 'next/link'
import {
  getPublicStudies,
  getPublicVariableSlug,
} from '@/lib/dfda/public-data'

export const metadata = {
  title: 'Studies | DFDA',
  description: 'Browse all available population studies analyzing relationships between variables.',
}

interface StudiesPageProps {
  searchParams?: {
    page?: string | string[]
  }
}

async function getStudies(page: number = 1, perPage: number = 5) {
  const studiesWithLookahead = await getPublicStudies({
    limit: perPage + 1,
    offset: (page - 1) * perPage,
  })

  return {
    studies: studiesWithLookahead.slice(0, perPage),
    hasNextPage: studiesWithLookahead.length > perPage,
    page,
  }
}

export default async function StudiesPage({ searchParams }: StudiesPageProps) {
  const rawPage = Array.isArray(searchParams?.page) ? searchParams.page[0] : searchParams?.page
  const parsedPage = Number.parseInt(rawPage || '1', 10)
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const { studies, hasNextPage, page } = await getStudies(requestedPage)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Population Studies</h1>
        <p className="text-xl text-gray-600">
          Browse studies analyzing relationships between variables
        </p>
      </div>

      <div className="grid gap-4">
        {studies.map((study) => {
          const causeVar = study.causeVariable
          const effectVar = study.effectVariable
          const statistics = study.statistics
          const correlationValue = statistics?.forwardPearsonCorrelationCoefficient
          const correlationType = correlationValue == null
            ? 'unavailable'
            : correlationValue > 0
              ? 'positive'
              : correlationValue < 0
                ? 'negative'
                : 'no relationship'
          const correlationColor = correlationValue == null || correlationValue === 0
            ? 'text-gray-500'
            : correlationValue > 0
              ? 'text-green-600'
              : 'text-red-600'

          const studyHref = `/population-study/${encodeURIComponent(
            getPublicVariableSlug(causeVar)
          )}/${encodeURIComponent(getPublicVariableSlug(effectVar))}`

          return (
            <Link
              key={study.id}
              href={studyHref}
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
                      <strong>Users:</strong>{' '}
                      {statistics?.numberOfUsers?.toLocaleString() ?? 'Unknown'}
                    </span>
                    <span>
                      <strong>Participant analyses:</strong>{' '}
                      {statistics?.numberOfCorrelations?.toLocaleString() ?? 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${correlationColor}`}>
                    {correlationValue == null ? '—' : Math.abs(correlationValue).toFixed(3)}
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

      {(page > 1 || hasNextPage) && (
        <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Studies pagination">
          {page > 1 ? (
            <Link
              href={`/studies?page=${page - 1}`}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded border px-4 py-2 text-gray-400" aria-disabled="true">
              Previous
            </span>
          )}
          <span>Page {page.toLocaleString()}</span>
          {hasNextPage ? (
            <Link
              href={`/studies?page=${page + 1}`}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              Next
            </Link>
          ) : (
            <span className="rounded border px-4 py-2 text-gray-400" aria-disabled="true">
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
