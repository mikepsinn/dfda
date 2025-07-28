"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface TableStatsProps {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function TableStats({ isLoading, setIsLoading, setError }: TableStatsProps) {
  const [tableStats, setTableStats] = useState<Record<string, number>>({})

  // Fetch table statistics
  const fetchTableStats = async () => {
    try {
      setIsLoading(true)

      // Get counts for each table - now with many more tables in our relational schema
      const tables = [
        // Core user tables
        "profiles",
        "goals",
        "user_goals",
        "conditions",
        "user_conditions",
        "notification_preferences",

        // Health tracking tables
        "health_logs",
        "symptoms",
        "symptom_logs",
        "meal_types",
        "meals",
        "foods",
        "meal_foods",
        "medications",
        "user_medications",
        "medication_logs",

        // Conversation tables
        "conversations",
        "messages",

        // File tables
        "file_types",
        "uploads",
        "upload_metadata",

        // Insight tables
        "insight_types",
        "insights",
        "insight_entities",

        // Notification tables
        "notification_types",
        "notifications",

        // Call tables
        "call_purposes",
        "call_statuses",
        "scheduled_calls",

        // Integration tables
        "integration_providers",
        "integration_statuses",
        "integrations",
        "integration_data_types",
        "integration_data",
      ]

      const stats: Record<string, number> = {}

      for (const table of tables) {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })

        if (error) {
          console.error(`Error fetching count for ${table}:`, error)
          stats[table] = -1 // Indicate error
        } else {
          stats[table] = count || 0
        }
      }

      setTableStats(stats)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching table stats:", err)
      setError("Failed to fetch database statistics")
      setIsLoading(false)
    }
  }

  // Load stats on initial render
  useEffect(() => {
    fetchTableStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Group tables by category for better organization
  const getTablesByCategory = () => {
    const categories = {
      "User Data": ["profiles", "goals", "user_goals", "conditions", "user_conditions", "notification_preferences"],
      "Health Tracking": [
        "health_logs",
        "symptoms",
        "symptom_logs",
        "meal_types",
        "meals",
        "foods",
        "meal_foods",
        "medications",
        "user_medications",
        "medication_logs",
      ],
      Communication: ["conversations", "messages", "notification_types", "notifications"],
      "Files & Media": ["file_types", "uploads", "upload_metadata"],
      "Insights & Analysis": ["insight_types", "insights", "insight_entities"],
      "Calls & Scheduling": ["call_purposes", "call_statuses", "scheduled_calls"],
      Integrations: [
        "integration_providers",
        "integration_statuses",
        "integrations",
        "integration_data_types",
        "integration_data",
      ],
    }

    return categories
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Overview</CardTitle>
        <CardDescription>Current statistics for all database tables</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
            <p>Loading statistics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(getTablesByCategory()).map(([category, tables]) => (
              <div key={category}>
                <h3 className="font-medium text-lg mb-3">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <div key={table} className="border rounded-lg p-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">{table}</h4>
                      <p className="text-2xl font-bold">
                        {tableStats[table] === undefined ? (
                          <span className="text-yellow-500">N/A</span>
                        ) : tableStats[table] === -1 ? (
                          <span className="text-red-500">Error</span>
                        ) : (
                          tableStats[table]
                        )}
                        <span className="text-sm font-normal text-muted-foreground ml-1">records</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={fetchTableStats} disabled={isLoading} className="ml-auto">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </CardFooter>
    </Card>
  )
}
