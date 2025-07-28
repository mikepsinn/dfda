"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ResetDatabaseOutput() {
  const [showOutput, setShowOutput] = useState(true)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Reset Database Function Output</CardTitle>
        <CardDescription>
          This is what you'll see after running the reset_database_schema() function in Supabase SQL Editor
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showOutput ? (
          <div className="font-mono text-sm bg-black text-green-400 p-4 rounded-md overflow-auto max-h-[400px] whitespace-pre">
            {`-- SQL query
SELECT reset_database_schema();

-- Console output
NOTICE:  Database schema has been reset. Please run the schema.sql script to recreate it.
 reset_database_schema 
----------------------
 
(1 row)

-- Query returned successfully in 245 ms.`}
          </div>
        ) : (
          <div className="font-mono text-sm bg-black text-red-400 p-4 rounded-md overflow-auto max-h-[400px] whitespace-pre">
            {`-- SQL query
SELECT reset_database_schema();

-- Console output
ERROR:  relation "profiles" does not exist
CONTEXT:  SQL statement "DROP TABLE IF EXISTS profiles CASCADE"
PL/pgSQL function reset_database_schema() line 63 at SQL statement

-- Query returned error in 32 ms.`}
          </div>
        )}

        <div className="mt-4 flex space-x-4">
          <Button variant={showOutput ? "default" : "outline"} onClick={() => setShowOutput(true)}>
            Successful Output
          </Button>
          <Button variant={!showOutput ? "default" : "outline"} onClick={() => setShowOutput(false)}>
            Error Output
          </Button>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium mb-2">To run the reset function in Supabase:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to your Supabase project dashboard</li>
            <li>Navigate to the SQL Editor in the left sidebar</li>
            <li>Create a new query</li>
            <li>
              Enter the following SQL command:
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 text-sm">
                SELECT reset_database_schema();
              </pre>
            </li>
            <li>Click "Run" to execute the function</li>
            <li>
              After seeing the "Database schema has been reset" notice, you'll need to run the schema creation scripts
              in this order:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>tables.sql - Creates all database tables</li>
                <li>functions.sql - Creates PostgreSQL functions and triggers</li>
                <li>reference-data.sql - Inserts reference data</li>
                <li>sample-data.sql - Inserts sample data (optional)</li>
              </ul>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
