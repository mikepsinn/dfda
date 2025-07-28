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
import { useState } from "react"

interface SchemaSetupPanelProps {
  onShowSqlInstructions: (instructions: {
    title: string
    description: string
    sql: string
    errorDetails?: string
  }) => void
}

export function SchemaSetupPanel({ onShowSqlInstructions }: SchemaSetupPanelProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Show SQL instructions for complete schema setup
  const showCompleteSchemaInstructions = async () => {
    try {
      setIsLoading(true)
      const sql = await getCompleteSchemaSql()
      onShowSqlInstructions({
        title: "Complete Database Setup",
        description: "Run this SQL in your Supabase SQL Editor to set up the entire database schema and seed data",
        sql,
      })
    } catch (error) {
      onShowSqlInstructions({
        title: "Error Loading SQL",
        description: "Failed to load the complete schema SQL",
        sql: "",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show SQL instructions for tables only
  const showTablesInstructions = async () => {
    try {
      setIsLoading(true)
      const sql = await getTablesSql()
      onShowSqlInstructions({
        title: "Database Tables Setup",
        description: "Run this SQL in your Supabase SQL Editor to set up just the database tables",
        sql,
      })
    } catch (error) {
      onShowSqlInstructions({
        title: "Error Loading SQL",
        description: "Failed to load the tables SQL",
        sql: "",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show SQL instructions for functions only
  const showFunctionsInstructions = async () => {
    try {
      setIsLoading(true)
      const sql = await getFunctionsSql()
      onShowSqlInstructions({
        title: "Database Functions Setup",
        description: "Run this SQL in your Supabase SQL Editor to set up the database functions and triggers",
        sql,
      })
    } catch (error) {
      onShowSqlInstructions({
        title: "Error Loading SQL",
        description: "Failed to load the functions SQL",
        sql: "",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show SQL instructions for reference data only
  const showReferenceDataInstructions = async () => {
    try {
      setIsLoading(true)
      const sql = await getReferenceDataSql()
      onShowSqlInstructions({
        title: "Reference Data Setup",
        description: "Run this SQL in your Supabase SQL Editor to insert reference data",
        sql,
      })
    } catch (error) {
      onShowSqlInstructions({
        title: "Error Loading SQL",
        description: "Failed to load the reference data SQL",
        sql: "",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show SQL instructions for sample data only
  const showSampleDataInstructions = async () => {
    try {
      setIsLoading(true)
      const sql = await getSampleDataSql()
      onShowSqlInstructions({
        title: "Sample Data Setup",
        description: "Run this SQL in your Supabase SQL Editor to insert sample data with emojis and images",
        sql,
      })
    } catch (error) {
      onShowSqlInstructions({
        title: "Error Loading SQL",
        description: "Failed to load the sample data SQL",
        sql: "",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
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
            <Button variant="default" onClick={showCompleteSchemaInstructions} disabled={isLoading}>
              <FileText className="mr-2 h-4 w-4" />
              {isLoading ? "Loading..." : "Complete Setup"}
            </Button>
            <Button variant="outline" onClick={showTablesInstructions} disabled={isLoading}>
              {isLoading ? "Loading..." : "Tables"}
            </Button>
            <Button variant="outline" onClick={showFunctionsInstructions} disabled={isLoading}>
              {isLoading ? "Loading..." : "Functions"}
            </Button>
            <Button variant="outline" onClick={showReferenceDataInstructions} disabled={isLoading}>
              {isLoading ? "Loading..." : "Reference Data"}
            </Button>
            <Button variant="outline" onClick={showSampleDataInstructions} disabled={isLoading}>
              {isLoading ? "Loading..." : "Sample Data"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
