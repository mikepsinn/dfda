"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Database } from "@/lib/database.types"
import { createLogger } from "@/lib/logger"
import { ConditionSearchInput } from "@/components/ConditionSearchInput"
import { type TrialWithRelations, findTrialsForConditionsAction } from "@/app/actions/trials"

// Use the database view type directly
type ConditionView = Database["public"]["Views"]["patient_conditions_view"]["Row"]

export interface SearchContainerProps {
  initialConditions?: ConditionView[]
}

const logger = createLogger("find-trials-search-container")

export function SearchContainer({ initialConditions = [] }: SearchContainerProps) {
  const router = useRouter()
  const [selectedConditions, setSelectedConditions] = useState<ConditionView[]>(initialConditions)
  const [searchResults, setSearchResults] = useState<TrialWithRelations[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<{ id: string; name: string } | null>(null)

  const handleSelectCondition = (condition: { id: string; name: string }) => {
    setSelectedCondition(condition)
    logger.info("Condition selected:", condition)
    setSelectedConditions(prev => {
      // Check if condition is already selected
      if (prev.some(c => c.condition_id === condition.id)) {
        return prev
      }
      return [...prev, { condition_id: condition.id, condition_name: condition.name, id: null, description: null, diagnosed_at: null, icd_code: null, measurement_count: null, notes: null, patient_id: null, severity: null, status: null }]
    })
  }

  const handleSearch = async () => {
    if (selectedConditions.length === 0) return
    
    setIsSearching(true)
    try {
      // Convert the condition_ids to strings for the API
      const conditionIds = selectedConditions.map(c => c.condition_id as string).filter(Boolean)
      const trials = await findTrialsForConditionsAction(conditionIds)
      setSearchResults(trials)
    } catch (error) {
      console.error("Error searching for trials:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleViewTrial = (trialId: string) => {
    router.push(`/patient/trial-details/${trialId}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Clinical Trials</CardTitle>
          <CardDescription>
            Search for clinical trials based on your conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ConditionSearchInput
              onSelect={handleSelectCondition}
              selected={selectedCondition}
            />
            
            <Button 
              onClick={handleSearch} 
              disabled={selectedConditions.length === 0 || isSearching}
              className="w-full"
            >
              {isSearching ? "Searching..." : "Search Trials"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Found {searchResults.length} Trials</CardTitle>
            <CardDescription>
              Clinical trials matching your conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((trial) => (
                <div 
                  key={trial.id} 
                  className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewTrial(trial.id)}
                >
                  <h3 className="font-medium">{trial.title || 'Unnamed Trial'}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {trial.description?.substring(0, 150)}
                    {trial.description && trial.description.length > 150 ? '...' : ''}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Status: {trial.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Compensation: ${trial.compensation || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

