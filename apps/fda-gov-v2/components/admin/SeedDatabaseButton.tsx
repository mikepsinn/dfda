"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { seedDatabase } from "@/app/actions/seed-data"
import { Loader2 } from "lucide-react"

export function SeedDatabaseButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSeedDatabase = async () => {
    try {
      setLoading(true)
      const result = await seedDatabase()
      setResult(result)
    } catch (error) {
      console.error("Error seeding database:", error)
      setResult({ success: false, message: "An error occurred while seeding the database." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleSeedDatabase} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Seed Database with Initial Data
      </Button>

      {result && (
        <div className={`p-4 rounded-md ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {result.message}
        </div>
      )}
    </div>
  )
}

