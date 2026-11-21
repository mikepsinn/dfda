'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Search, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { searchVariablesAction } from '@/lib/actions/recording'
import type { VariableCategory, VariableSearchResult } from '@/lib/patient/variables'
import { CategorySelect } from './category-select'

/** How long the search waits after typing, as QuantiModo's half-second debounce. */
const DEBOUNCE_MS = 300

function subtitle(result: VariableSearchResult) {
  if (!result.recorded) return result.category
  const count = `${result.recorded.count} ${result.recorded.count === 1 ? 'measurement' : 'measurements'}`
  return `Recorded ${formatDistanceToNow(new Date(result.recorded.latestAt), { addSuffix: true })} · ${count}`
}

/**
 * QuantiModo's variable search: a category filter and a search box over the
 * person's own variables (most recently recorded first) and then all others.
 * Each result links to `href` with the variable's id as `variableId`.
 */
export function VariableSearch({ categories, initialCategoryId, initialResults, href }: {
  categories: VariableCategory[]
  initialCategoryId: string | null
  initialResults: VariableSearchResult[]
  href: string
}) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [results, setResults] = useState(initialResults)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const request = useRef(0)
  const first = useRef(true)

  useEffect(() => {
    // The server already gave the results of the first filter.
    if (first.current) {
      first.current = false
      return
    }
    const current = ++request.current
    setSearching(true)
    const timer = setTimeout(async () => {
      const result = await searchVariablesAction(query, categoryId)
      if (current !== request.current) return
      setSearching(false)
      if (result.ok) {
        setResults(result.variables)
        setError(null)
      } else {
        setError(result.error)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, categoryId])

  const link = (id: string) => `${href}${href.includes('?') ? '&' : '?'}variableId=${encodeURIComponent(id)}`
  const trimmed = query.trim()

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="variable-search" className="sr-only">Search variables</label>
          <Input id="variable-search" type="search" autoComplete="off" autoFocus value={query}
            onChange={(event) => setQuery(event.target.value)} placeholder="Search, for example headache or vitamin D"
            className="h-11 pl-9 pr-10 [&::-webkit-search-cancel-button]:appearance-none" />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear the search"
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {searching ? 'Searching' : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
      </p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {results.length > 0 ? (
        <ul className={`divide-y rounded-lg border ${searching ? 'opacity-60' : ''}`}>
          {results.map((result) => (
            <li key={result.globalVariableId}>
              <Link href={link(result.globalVariableId)}
                className="flex min-h-14 items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                  {result.emoji ?? result.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-medium">{result.name}</span>
                  <span className="block text-sm text-muted-foreground">{subtitle(result)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !searching && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {trimmed
              ? `No variables match "${trimmed}".`
              : 'You have no variables here yet. Search for what you want to track.'}
          </Card>
        )
      )}
    </div>
  )
}
