"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy, Check, AlertCircle, Database, Terminal, Info } from "lucide-react"

interface SqlInstructionsProps {
  title: string
  description: string
  sql: string
  errorDetails?: string
  onClose?: () => void
}

export default function SqlInstructions({ title, description, sql, errorDetails, onClose }: SqlInstructionsProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("instructions")

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy SQL:", err)
    }
  }

  // If there are error details, automatically show the error tab
  useEffect(() => {
    if (errorDetails) {
      setActiveTab("error")
    }
  }, [errorDetails])

  // Determine if this is a pgclient error or ON CONFLICT error
  const isPgClientError = errorDetails?.includes("pgclient") || false
  const isOnConflictError = errorDetails?.includes("ON CONFLICT") || false

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Manual Action Required</AlertTitle>
          <AlertDescription>
            The automatic database operation couldn't be completed. Please run the SQL manually in your Supabase
            dashboard.
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <Info className="h-4 w-4" />
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            This SQL script includes DROP TABLE statements that will remove existing tables and data. Make sure you have
            a backup if needed before running this script.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
            {errorDetails && (
              <TabsTrigger value="error" className="text-red-500">
                Error Details
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="instructions" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">How to run this SQL in Supabase:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Log in to your Supabase dashboard</li>
                <li>Select your project</li>
                <li>
                  Go to the <strong>SQL Editor</strong> in the left sidebar
                </li>
                <li>
                  Click <strong>New Query</strong>
                </li>
                <li>Paste the SQL from the SQL tab</li>
                <li>
                  Click <strong>Run</strong> to execute the query
                </li>
              </ol>
            </div>

            <div className="space-y-2 mt-6 border-t pt-4">
              <h3 className="font-medium">Recommended Order for Running Scripts:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>tables.sql</strong> - Creates all database tables
                </li>
                <li>
                  <strong>functions.sql</strong> - Creates PostgreSQL functions and triggers
                </li>
                <li>
                  <strong>reference-data.sql</strong> - Inserts reference data
                </li>
                <li>
                  <strong>sample-data.sql</strong> - Inserts sample data (optional)
                </li>
              </ol>
              <p className="text-sm text-muted-foreground mt-2">
                Following this order ensures that all dependencies are properly created before they are referenced.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="sql">
            <div className="relative">
              <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto max-h-[400px] text-sm">
                {sql}
              </pre>
              <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </TabsContent>

          {errorDetails && (
            <TabsContent value="error">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <Terminal className="h-5 w-5" />
                  <h3 className="font-medium">SQL Execution Error</h3>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <pre className="whitespace-pre-wrap break-words text-sm text-red-800 dark:text-red-200">
                    {errorDetails}
                  </pre>
                </div>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Common Error Solutions</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      {isPgClientError && (
                        <li>
                          <strong>pgclient function not found:</strong> The pgclient function doesn't exist in your
                          Supabase database. This is expected - you'll need to run the SQL manually through the Supabase
                          SQL Editor.
                        </li>
                      )}
                      {isOnConflictError && (
                        <li>
                          <strong>ON CONFLICT error:</strong> This error occurs when using ON CONFLICT without
                          specifying a unique constraint or when the constraint doesn't exist. Make sure the tables have
                          the necessary unique constraints before using ON CONFLICT.
                        </li>
                      )}
                      <li>
                        <strong>Trigger already exists:</strong> The trigger "on_auth_user_created" already exists. You
                        can manually drop it first with:{" "}
                        <code>DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;</code>
                      </li>
                      <li>
                        <strong>Relation does not exist:</strong> Tables haven't been created yet. Run the tables.sql
                        script first.
                      </li>
                      <li>
                        <strong>Permission denied:</strong> Your Supabase user doesn't have the necessary permissions.
                        Make sure you're using the service role key.
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      {onClose && (
        <CardFooter>
          <Button onClick={onClose} className="ml-auto">
            Close
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
