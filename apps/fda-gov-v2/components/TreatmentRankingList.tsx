"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StarRating } from "@/components/ui/star-rating"
import { getTreatmentEffectiveness } from "@/lib/api/treatment-effectiveness"

interface TreatmentRankingListProps {
  condition: string
  treatments?: any[]
}

export function TreatmentRankingList({ condition, treatments: initialTreatments }: TreatmentRankingListProps) {
  const [treatments, setTreatments] = useState<any[]>(initialTreatments || [])
  const [isLoading, setIsLoading] = useState(!initialTreatments)

  useEffect(() => {
    if (initialTreatments) {
      setTreatments(initialTreatments)
      setIsLoading(false)
      return
    }

    async function fetchTreatmentEffectiveness() {
      setIsLoading(true)
      try {
        const data = await getTreatmentEffectiveness(condition, condition)
        setTreatments(data)
      } catch (error) {
        console.error("Error fetching treatment effectiveness:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTreatmentEffectiveness()
  }, [condition, initialTreatments])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-2 bg-muted rounded w-full mb-4"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    )
  }

  if (treatments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No treatments found for {condition}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {treatments.map((treatment, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{treatment.name}</h3>
              <p className="text-sm text-muted-foreground">{treatment.description}</p>
              {treatment.rating && (
                <div className="mt-1">
                  <StarRating rating={treatment.rating} readOnly size="sm" />
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{treatment.effectiveness}%</div>
              <div className="text-xs text-muted-foreground">effectiveness</div>
            </div>
          </div>
          <Progress value={treatment.effectiveness} className="h-2" />
          <div className="flex justify-end">
            <Link href={`/treatment/${encodeURIComponent(treatment.id)}?condition=${encodeURIComponent(condition)}`}>
              <Button size="sm" variant="outline" className="mr-2">
                View Details
              </Button>
            </Link>
            <Link href={`/patient/join-trial/${encodeURIComponent(treatment.name)}/${encodeURIComponent(condition)}`}>
              <Button size="sm">
                View Trials
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

