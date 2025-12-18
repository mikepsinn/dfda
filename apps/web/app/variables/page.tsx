'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { nameToSlug } from '@/lib/slugs'

interface Variable {
  id: number
  name: string
  image_url: string | null
  number_of_aggregate_correlations_as_cause: number | null
  number_of_aggregate_correlations_as_effect: number | null
  variable_categories: {
    name: string
  }
}

export default function VariablesPage() {
  const [variables, setVariables] = useState<Variable[]>([])
  const [filteredVariables, setFilteredVariables] = useState<Variable[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch variables on mount
    fetch('/api/v1/variables')
      .then(res => res.json())
      .then(data => {
        setVariables(data.variables)
        setFilteredVariables(data.variables)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading variables:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    // Filter variables based on search query
    if (!searchQuery.trim()) {
      setFilteredVariables(variables)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = variables.filter(variable =>
        variable.name.toLowerCase().includes(query) ||
        variable.variable_categories.name.toLowerCase().includes(query)
      )
      setFilteredVariables(filtered)
    }
  }, [searchQuery, variables])

  const getTotalStudies = (variable: Variable) => {
    return (variable.number_of_aggregate_correlations_as_cause || 0) +
      (variable.number_of_aggregate_correlations_as_effect || 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading variables...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2 text-center">Variables</h1>
        <p className="text-xl text-gray-600 text-center mb-6">
          Browse {variables.length.toLocaleString()} variables with statistics and correlations
        </p>

        {/* Search Box */}
        <form onSubmit={(e) => e.preventDefault()} className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center px-4 py-3 border border-gray-300 rounded-full shadow-sm bg-white">
              <i className="fas fa-search text-gray-400 mr-3"></i>
              <input
                type="text"
                className="flex-1 outline-none text-base"
                placeholder="Search for a variable..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </form>
      </div>

      {/* Variables List - Chip Style */}
      <div className="flex flex-wrap justify-center gap-2">
        {filteredVariables.map((variable) => {
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

      {/* No Results Message */}
      {filteredVariables.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">No variables found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}
