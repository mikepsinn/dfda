"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Info } from "lucide-react"
import SqlInstructions from "@/components/admin/sql-instructions"
import { SchemaSetupPanel } from "./schema-setup-panel"
import { DataManagementPanel } from "./data-management-panel"

interface AdminActionsProps {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  success: string | null
  setSuccess: (success: string | null) => void
}

export function AdminActions({ isLoading, setIsLoading, error, setError, success, setSuccess }: AdminActionsProps) {
  const [sqlInstructions, setSqlInstructions] = useState<{
    title: string
    description: string
    sql: string
    errorDetails?: string
  } | null>(null)

  const handleShowSqlInstructions = (instructions: {
    title: string
    description: string
    sql: string
    errorDetails?: string
  }) => {
    setSqlInstructions(instructions)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Manage database schema and data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              <Info className="h-4 w-4" />
              <AlertTitle>Database Setup Instructions</AlertTitle>
              <AlertDescription>
                <p className="mb-2">For best results, run the SQL scripts in the following order:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Tables - Creates all database tables</li>
                  <li>Functions - Creates PostgreSQL functions and triggers</li>
                  <li>Reference Data - Inserts reference data</li>
                  <li>Sample Data - Inserts sample data with emojis and images</li>
                </ol>
                <p className="mt-2">
                  Alternatively, you can run the complete schema setup script which includes all of the above.
                </p>
              </AlertDescription>
            </Alert>

            <SchemaSetupPanel onShowSqlInstructions={handleShowSqlInstructions} />
            <DataManagementPanel onShowSqlInstructions={handleShowSqlInstructions} />
          </div>
        </CardContent>
      </Card>

      {sqlInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SqlInstructions
            title={sqlInstructions.title}
            description={sqlInstructions.description}
            sql={sqlInstructions.sql}
            errorDetails={sqlInstructions.errorDetails}
            onClose={() => setSqlInstructions(null)}
          />
        </div>
      )}
    </>
  )
}
