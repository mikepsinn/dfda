"use client"

import { Button } from "@/components/ui/button"
import { Database, FileText } from "lucide-react"

interface DataManagementPanelProps {
  onShowSqlInstructions: (instructions: {
    title: string
    description: string
    sql: string
    errorDetails?: string
  }) => void
}

export function DataManagementPanel({ onShowSqlInstructions }: DataManagementPanelProps) {
  // Show SQL instructions for clearing data
  const showClearDataInstructions = () => {
    onShowSqlInstructions({
      title: "Clear All Data",
      description: "Run this SQL in your Supabase SQL Editor to clear all data while preserving the schema",
      sql: "SELECT clear_all_data();",
    })
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-start">
        <Database className="h-10 w-10 text-blue-500 mr-4 mt-1" />
        <div>
          <h3 className="text-lg font-medium mb-2">Data Management</h3>
          <p className="text-muted-foreground mb-4">
            Get the SQL script to clear all data while preserving the schema.
          </p>
          <Button variant="default" onClick={showClearDataInstructions}>
            <FileText className="mr-2 h-4 w-4" />
            View Clear Data SQL
          </Button>
        </div>
      </div>
    </div>
  )
}
