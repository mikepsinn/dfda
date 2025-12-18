'use client'

import Link from 'next/link'
import { nameToSlug } from '@/lib/slugs'

interface Variable {
  id: number
  name: string
  image_url: string | null
  number_of_aggregate_correlations_as_cause?: number | null
  number_of_aggregate_correlations_as_effect?: number | null
}

interface VariableChipListProps {
  variables: Variable[]
  loading?: boolean
}

export default function VariableChipList({ variables, loading = false }: VariableChipListProps) {
  const getTotalStudies = (variable: Variable) => {
    return (variable.number_of_aggregate_correlations_as_cause || 0) +
      (variable.number_of_aggregate_correlations_as_effect || 0)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
        <p className="mt-4 text-gray-600">Loading variables...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {variables.map((variable) => {
        const totalStudies = getTotalStudies(variable)

        return (
          <Link
            key={variable.id}
            href={`/variables/${nameToSlug(variable.name)}`}
            className="inline-block"
            title={`${totalStudies} studies on the causes or effects of ${variable.name}`}
          >
            <div className="flex justify-center items-center m-1 font-medium py-1 px-2 bg-white rounded-full text-purple-700 bg-purple-100 border border-purple-300 hover:shadow-md transition-shadow">
              {/* Avatar */}
              {variable.image_url && (
                <div className="flex relative w-4 h-4 justify-center items-center m-1 mr-2 ml-0 my-0">
                  <img
                    className="rounded-full w-full h-full object-cover"
                    alt={variable.name}
                    src={variable.image_url}
                  />
                </div>
              )}

              {/* Variable Name and Count */}
              <div className="text font-normal leading-none max-w-full flex-initial">
                {variable.name}
                {totalStudies > 0 && (
                  <span className="ml-1 text-xs rounded-full px-1 py-1 text-center bg-white border border-purple-300">
                    {totalStudies.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
