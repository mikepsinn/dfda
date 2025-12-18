'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'
import { slugToName } from '@/lib/slugs'
import VariableChipList from '@/components/variables/VariableChipList'

interface Variable {
  id: number
  name: string
  image_url: string | null
  number_of_aggregate_correlations_as_cause: number | null
  number_of_aggregate_correlations_as_effect: number | null
  number_of_user_variables: number | null
  variable_category_id: number | null
}

interface Category {
  id: number
  name: string
  image_url: string | null
  number_of_variables: number | null
  number_of_user_variables: number | null
  number_of_measurements: number | null
  number_of_outcome_population_studies: number | null
  number_of_predictor_population_studies: number | null
}

export default function VariableCategoryPage() {
  const params = useParams()
  const categorySlug = params.name as string

  const [category, setCategory] = useState<Category | null>(null)
  const [variables, setVariables] = useState<Variable[]>([])
  const [filteredVariables, setFilteredVariables] = useState<Variable[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [notFoundError, setNotFoundError] = useState(false)

  useEffect(() => {
    const categoryName = slugToName(decodeURIComponent(categorySlug))

    // Fetch category info from the API
    fetch(`/api/v1/variable-categories/${categorySlug}/variables`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Category not found')
        }
        return res.json()
      })
      .then(data => {
        setVariables(data.variables)
        setFilteredVariables(data.variables)
        setLoading(false)

        // For now, we don't have category details in the API response
        // Set a basic category object
        setCategory({
          id: data.variables[0]?.variable_category_id || 0,
          name: categoryName,
          image_url: null,
          number_of_variables: data.variables.length,
          number_of_user_variables: null,
          number_of_measurements: null,
          number_of_outcome_population_studies: null,
          number_of_predictor_population_studies: null,
        })
      })
      .catch(err => {
        console.error('Error loading category:', err)
        setNotFoundError(true)
        setLoading(false)
      })
  }, [categorySlug])

  useEffect(() => {
    // Filter variables based on search query
    if (!searchQuery.trim()) {
      setFilteredVariables(variables)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = variables.filter(variable =>
        variable.name.toLowerCase().includes(query)
      )
      setFilteredVariables(filtered)
    }
  }, [searchQuery, variables])

  if (notFoundError) {
    notFound()
  }

  if (loading || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2 text-center">{category.name}</h1>
        <p className="text-xl text-gray-600 text-center mb-6">
          Browse {variables.length.toLocaleString()} {category.name.toLowerCase()} variables
        </p>

        {/* Search Box */}
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-2xl">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="flex items-center px-4 py-3 border border-gray-300 rounded-full shadow-sm bg-white">
                <i className="fas fa-search text-gray-400 mr-3"></i>
                <input
                  type="text"
                  className="flex-1 outline-none text-base"
                  placeholder={`Search for a ${category.name.toLowerCase().replace(/s$/, '')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Variables List - Chip Style */}
      <VariableChipList variables={filteredVariables} loading={false} />

      {/* No Results Message */}
      {filteredVariables.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">
            {searchQuery
              ? `No variables found matching "${searchQuery}"`
              : 'No variables found in this category'}
          </p>
        </div>
      )}
    </div>
  )
}
