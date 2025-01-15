"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react"
import { searchClinicalTrialConditions, searchClinicalTrialInterventions } from "@/lib/clinicaltables"
import SearchInput from "./SearchInput"
import { ListStudiesRequest } from "../../lib/clinical-trials-gov"

interface SearchFilters extends Pick<ListStudiesRequest, 
  | "queryCond" | "queryIntr" | "filterOverallStatus"> {
  status?: string
}

interface AdvancedTrialSearchProps {
  initialFilters?: Partial<SearchFilters>
}

export default function AdvancedTrialSearch({
  initialFilters,
}: AdvancedTrialSearchProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Search inputs state
  const [condition, setCondition] = useState(initialFilters?.queryCond || "")
  const [conditionSuggestions, setConditionSuggestions] = useState<string[]>([])
  const [intervention, setIntervention] = useState(initialFilters?.queryIntr || "")
  const [interventionSuggestions, setInterventionSuggestions] = useState<string[]>([])
  
  // Status filter state
  const [status, setStatus] = useState(initialFilters?.status || "Recruiting")

  const updateSearch = async (params: Partial<SearchFilters>) => {
    setIsNavigating(true)
    try {
      const queryParams = new URLSearchParams()
      
      if (params.queryCond) queryParams.set("queryCond", params.queryCond)
      if (params.queryIntr) queryParams.set("queryIntr", params.queryIntr)
      if (params.status && params.status !== "All studies") {
        const statusMap: Record<string, string> = {
          Recruiting: "RECRUITING",
          "Not yet recruiting": "NOT_YET_RECRUITING",
          "Active, not recruiting": "ACTIVE_NOT_RECRUITING",
          Completed: "COMPLETED",
          "Enrolling by invitation": "ENROLLING_BY_INVITATION",
        }
        queryParams.set("filterOverallStatus", statusMap[params.status] || params.status.toUpperCase())
      }

      await router.push(`/trials/search?${queryParams.toString()}`)
    } catch (error) {
      console.error("Search error:", error)
      setSearchError("Failed to perform search. Please try again.")
    } finally {
      setIsNavigating(false)
    }
  }

  const handleConditionSuggestions = async (value: string) => {
    try {
      const results = await searchClinicalTrialConditions(value)
      return results.slice(0, 5)
    } catch (error) {
      console.error("Error fetching condition suggestions:", error)
      return []
    }
  }

  const handleInterventionSuggestions = async (value: string) => {
    try {
      const results = await searchClinicalTrialInterventions(value)
      return results.slice(0, 5)
    } catch (error) {
      console.error("Error fetching intervention suggestions:", error)
      return []
    }
  }

  return (
    <div className="w-full font-mono">
      <form onSubmit={(e) => {
        e.preventDefault()
        updateSearch({ queryCond: condition, queryIntr: intervention, status })
      }} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <SearchInput
            value={condition}
            onChange={async (e) => {
              const value = e.target.value
              setCondition(value)
              setConditionSuggestions(await handleConditionSuggestions(value))
            }}
            onFocus={async () => setConditionSuggestions(await handleConditionSuggestions(""))}
            onClear={() => {
              setCondition("")
              setConditionSuggestions([])
              updateSearch({ queryIntr: intervention, status })
            }}
            onSuggestionClick={(suggestion) => {
              setCondition(suggestion)
              setConditionSuggestions([])
              updateSearch({ queryCond: suggestion, queryIntr: intervention, status })
            }}
            placeholder="Search by condition, disease, or other health issue"
            suggestions={conditionSuggestions}
          />

          <SearchInput
            value={intervention}
            onChange={async (e) => {
              const value = e.target.value
              setIntervention(value)
              setInterventionSuggestions(await handleInterventionSuggestions(value))
            }}
            onFocus={async () => setInterventionSuggestions(await handleInterventionSuggestions(""))}
            onClear={() => {
              setIntervention("")
              setInterventionSuggestions([])
              updateSearch({ queryCond: condition, status })
            }}
            onSuggestionClick={(suggestion) => {
              setIntervention(suggestion)
              setInterventionSuggestions([])
              updateSearch({ queryCond: condition, queryIntr: suggestion, status })
            }}
            placeholder="Search by intervention or treatment"
            suggestions={interventionSuggestions}
          />

          <button
            type="submit"
            disabled={isNavigating}
            className={`group flex items-center gap-2 rounded-xl border-4 border-black ${
              isNavigating
                ? "cursor-not-allowed bg-gray-200"
                : "bg-gradient-to-r from-green-400 to-emerald-400 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            } px-6 py-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all`}
          >
            {isNavigating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Find Trials</span>
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-xl border-4 border-black bg-white px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          <ChevronDown
            className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
          {showFilters ? "Hide" : "Show"} Advanced Search Options
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-6 rounded-xl border-4 border-black bg-gradient-to-r from-pink-400 to-purple-400 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="rounded-xl border-4 border-black bg-white p-4">
                <label className="mb-2 block font-bold text-black">
                  Study Status
                </label>
                <div className="grid gap-2">
                  {[
                    "All studies",
                    "Recruiting",
                    "Not yet recruiting",
                    "Active, not recruiting",
                    "Completed",
                    "Enrolling by invitation",
                  ].map((statusOption) => (
                    <label key={statusOption} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="studyStatus"
                        value={statusOption}
                        checked={status === statusOption}
                        onChange={(e) => {
                          setStatus(e.target.value)
                          updateSearch({ queryCond: condition, queryIntr: intervention, status: e.target.value })
                        }}
                        className="h-5 w-5"
                      />
                      <span className="font-bold">{statusOption}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {searchError && (
          <div className="mt-2 rounded-lg border-2 border-red-500 bg-red-100 p-2 text-red-700">
            {searchError}
          </div>
        )}
      </form>
    </div>
  )
}
