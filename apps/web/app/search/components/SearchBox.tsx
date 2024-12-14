'use client'

import { useState, useEffect } from 'react'
import { X, Search } from "lucide-react"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { searchTreatmentsAndConditions } from '../../dfdaActions'

type SearchResult = {
  id: number
  name: string
  type: 'treatment' | 'condition'
}

export function SearchBox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleSearch = async () => {
      if (query.length > 2) {
        setIsLoading(true)
        const searchResults = await searchTreatmentsAndConditions(query)
        setResults(searchResults as SearchResult[])
        setIsLoading(false)
      } else {
        setResults([])
      }
    }

    const debounce = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(debounce)
  }, [query])

  const handleClear = () => {
    setQuery('')
    setResults([])
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Search className="h-6 w-6 text-gray-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search treatments or conditions..."
          className="w-full pl-14 pr-12 p-4 bg-white border-4 border-black rounded-none 
          focus:outline-none focus:ring-0 focus:translate-x-[-4px] focus:translate-y-[-4px]
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all
          placeholder:text-gray-600 text-lg"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 
            hover:scale-110 transition-transform"
            aria-label="Clear search"
          >
            <X className="h-6 w-6 text-black" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="mt-8 text-center">
          <div className="animate-spin rounded-none h-12 w-12 border-8 border-black border-t-transparent mx-auto"></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.type === 'treatment' ? `/dfda/treatments/${result.name}` : `/dfda/conditions/${result.name}`}
              className="block p-4 bg-white border-4 border-black rounded-none 
              hover:bg-gray-50 hover:translate-x-[-4px] hover:translate-y-[-4px] 
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">{result.name}</span>
                <span className="text-base bg-blue-300 px-3 py-1 border-2 border-black capitalize">{result.type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 