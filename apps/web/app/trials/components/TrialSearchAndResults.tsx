import { Suspense } from "react"
import { ListStudiesRequest } from "@/app/lib/clinical-trials-gov"
import AdvancedTrialSearch from "./AdvancedTrialSearch"
import TrialsList from "./TrialsList"
import { searchTrials } from "../trialActions"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TrialSearchAndResultsProps {
  searchParams: Partial<ListStudiesRequest> & {
    sex?: string
    ageRange?: string
    phase?: string[]
    studyType?: string[]
    zipCode?: string
    distance?: string
    status?: string[]
    dateRanges?: string
    pageToken?: string
  }
  defaultIntervention?: string
}

function formatSearchCriteria(searchParams: Partial<ListStudiesRequest>) {
  const criteria: string[] = []

  if (searchParams.queryCond) {
    criteria.push(`Condition: ${searchParams.queryCond}`)
  }
  if (searchParams.queryTerm) {
    criteria.push(`Terms: ${searchParams.queryTerm}`)
  }
  if (searchParams.queryIntr) {
    criteria.push(`Intervention: ${searchParams.queryIntr}`)
  }
  if (searchParams.filterGeo) {
    criteria.push(`Location: ${searchParams.filterGeo}`)
  }
  if (searchParams.filterAdvanced) {
    const filters = searchParams.filterAdvanced.split(",")
    filters.forEach((filter) => {
      const [key, value] = filter.split(":")
      switch (key) {
        case "sex":
          criteria.push(`Sex: ${value === "m" ? "Male" : "Female"}`)
          break
        case "phase":
          criteria.push(`Phase: ${value}`)
          break
        case "studyType":
          criteria.push(`Type: ${value.split(" ").join(", ")}`)
          break
        case "healthy":
          criteria.push("Accepts healthy volunteers")
          break
        case "funderType":
          criteria.push(`Funder: ${value.toUpperCase()}`)
          break
        case "results":
          criteria.push(`Results: ${value}`)
          break
        case "docs":
          criteria.push(`Documents: ${value.toUpperCase()}`)
          break
      }
    })
  }

  return criteria
}

async function getTrials(searchParams: Partial<ListStudiesRequest>) {
  try {
    return await searchTrials(searchParams)
  } catch (error) {
    console.error("Error fetching trials:", error)
    return null
  }
}

function PaginationControls({ 
  currentPageToken,
  nextPageToken,
  searchParams,
}: { 
  currentPageToken?: string
  nextPageToken?: string
  searchParams: Record<string, any>
}) {
  // Create URLs for previous and next pages
  const baseParams = new URLSearchParams(searchParams as Record<string, string>)
  
  // Remove existing pageToken
  baseParams.delete('pageToken')
  
  // Create URLs
  const prevParams = new URLSearchParams(baseParams)
  if (currentPageToken) {
    // For previous page, we remove the current token to go back to the previous state
    prevParams.delete('pageToken')
  }
  
  const nextParams = new URLSearchParams(baseParams)
  if (nextPageToken) {
    nextParams.set('pageToken', nextPageToken)
  }

  return (
    <div className="mt-6 flex items-center justify-between">
      <Link
        href={`?${prevParams.toString()}`}
        className={`inline-flex items-center gap-2 rounded-xl border-4 border-black bg-white px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
          !currentPageToken ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Link>
      
      <Link
        href={`?${nextParams.toString()}`}
        className={`inline-flex items-center gap-2 rounded-xl border-4 border-black bg-white px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
          !nextPageToken ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export default async function TrialSearchAndResults({
  searchParams,
  defaultIntervention,
}: TrialSearchAndResultsProps) {
  // Merge defaultIntervention with searchParams if provided
  const mergedSearchParams = {
    ...searchParams,
    queryIntr: searchParams.queryIntr || defaultIntervention,
  }

  const searchCriteria = formatSearchCriteria(mergedSearchParams)
  const trialsData = await getTrials(mergedSearchParams)

  // Parse the search params into the format expected by AdvancedTrialSearch
  const initialFilters = {
    queryCond: mergedSearchParams.queryCond,
    queryTerm: mergedSearchParams.queryTerm,
    queryIntr: mergedSearchParams.queryIntr,
    filterGeo: mergedSearchParams.filterGeo,
    ageRange: mergedSearchParams.ageRange
      ? {
          min: parseInt(mergedSearchParams.ageRange.split("_")[0].replace("y", "")),
          max: parseInt(mergedSearchParams.ageRange.split("_")[1].replace("y", "")),
        }
      : undefined,
    filterAdvanced: mergedSearchParams.filterAdvanced,
    queryTitles: mergedSearchParams.queryTitles,
    queryOutc: mergedSearchParams.queryOutc,
    querySpons: mergedSearchParams.querySpons,
    queryLead: mergedSearchParams.queryLead,
    queryId: mergedSearchParams.queryId,
  }

  return (
    <div>
      <div className="rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="mb-4 text-3xl font-black">Modify Search</h1>
        <AdvancedTrialSearch initialFilters={initialFilters} />
      </div>

      {searchCriteria.length > 0 && (
        <div className="mt-4 rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-bold text-gray-600">Current Search Criteria:</h2>
          <div className="flex flex-wrap gap-2">
            {searchCriteria.map((criteria, index) => (
              <span
                key={index}
                className="rounded-full border-2 border-black bg-yellow-200 px-3 py-1 text-sm font-bold"
              >
                {criteria}
              </span>
            ))}
          </div>
        </div>
      )}

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="rounded-xl border-4 border-black bg-white p-6 text-center font-bold shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-2">Searching for clinical trials...</div>
              <div className="text-sm text-gray-600">This may take a few moments</div>
            </div>
          </div>
        }
      >
        {trialsData ? (
          <>
            <TrialsList searchParams={mergedSearchParams} trialsData={trialsData} />
            <PaginationControls 
              currentPageToken={searchParams.pageToken}
              nextPageToken={trialsData.nextPageToken}
              searchParams={searchParams}
            />
          </>
        ) : (
          <div className="rounded-xl border-4 border-black bg-red-100 p-6 text-center font-bold text-red-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            Error loading trials. Please try again.
          </div>
        )}
      </Suspense>
    </div>
  )
} 