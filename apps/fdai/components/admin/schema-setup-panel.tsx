"use client"
import { Button } from "@/components/ui/button"
import { FileText, Database } from "lucide-react"
import {
  getCompleteSchemaSql,
  getTablesSql,
  getFunctionsSql,
  getReferenceDataSql,
  getSampleDataSql,
} from "@/lib/sql-loader"

interface SchemaSetupPanelProps {
  onShowSqlInstructions: (instructions: {
    title: string
    description: string
    sql: string
    errorDetails?: string
  }) => void
}

export function SchemaSetupPanel({ onShowSqlInstructions }: SchemaSetupPanelProps) {
  // Show SQL instructions for complete schema setup
  const showCompleteSchemaInstructions = () => {
    onShowSqlInstructions({
      title: "Complete Database Setup",
      description: "Run this SQL in your Supabase SQL Editor to set up the entire database schema and seed data",
      sql: getCompleteSchemaSql(),
    })
  }

  // Show SQL instructions for tables only
  const showTablesInstructions = () => {
    onShowSqlInstructions({
      title: "Database Tables Setup",
      description: "Run this SQL in your Supabase SQL Editor to set up just the database tables",
      sql: getTablesSql(),
    })
  }

  // Show SQL instructions for functions only
  const showFunctionsInstructions = () => {
    onShowSqlInstructions({
      title: "Database Functions Setup",
      description: "Run this SQL in your Supabase SQL Editor to set up the database functions and triggers",
      sql: getFunctionsSql(),
    })
  }

  // Show SQL instructions for reference data only
  const showReferenceDataInstructions = () => {
    onShowSqlInstructions({
      title: "Reference Data Setup",
      description: "Run this SQL in your Supabase SQL Editor to insert reference data",
      sql: getReferenceDataSql(),
    })
  }

  // Show SQL instructions for sample data only
  const showSampleDataInstructions = () => {
    onShowSqlInstructions({
      title: "Sample Data Setup",
      description: "Run this SQL in your Supabase SQL Editor to insert sample data with emojis and images",
      sql: getSampleDataSql(),
    })
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-start">
        <Database className="h-10 w-10 text-amber-500 mr-4 mt-1" />
        <div>
          <h3 className="text-lg font-medium mb-2">Database Schema Setup</h3>
          <p className="text-muted-foreground mb-4">
            Get the SQL scripts to set up the database schema. You can run the complete script or individual components.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={showCompleteSchemaInstructions}>
              <FileText className="mr-2 h-4 w-4" />
              Complete Setup
            </Button>
            <Button variant="outline" onClick={showTablesInstructions}>
              Tables
            </Button>
            <Button variant="outline" onClick={showFunctionsInstructions}>
              Functions
            </Button>
            <Button variant="outline" onClick={showReferenceDataInstructions}>
              Reference Data
            </Button>
            <Button variant="outline" onClick={showSampleDataInstructions}>
              Sample Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
