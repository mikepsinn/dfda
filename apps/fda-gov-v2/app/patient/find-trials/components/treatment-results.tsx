"use client"

import { useEffect, useState } from "react"
import { ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TreatmentRankingList } from "@/components/TreatmentRankingList"
import { getTreatmentsByCondition } from "@/lib/api/treatments"

interface TreatmentResultsProps {
  condition: string
  onClear: () => void
}

export function TreatmentResults({ condition, onClear }: TreatmentResultsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [treatments, setTreatments] = useState<any[]>([])

  useEffect(() => {
    async function loadTreatments() {
      setIsLoading(true)
      try {
        const data = await getTreatmentsByCondition(condition)
        setTreatments(data)
      } catch (error) {
        console.error("Error loading treatments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (condition) {
      loadTreatments()
    }
  }, [condition])

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Treatments for {condition}</CardTitle>
              <CardDescription>Ranked by comparative effectiveness</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear Results
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 bg-muted/50 mb-6">
            <div className="flex items-start gap-4">
              <ThumbsUp className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h4 className="font-medium">Evidence-Based Rankings</h4>
                <p className="text-sm text-muted-foreground">
                  Rankings are based on the aggregate of clinical trials and real-world evidence. Higher percentages
                  indicate better outcomes for patients with your condition.
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col space-y-4 w-full">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-md w-full"></div>
                ))}
              </div>
            </div>
          ) : (
            <TreatmentRankingList condition={condition} treatments={treatments} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

