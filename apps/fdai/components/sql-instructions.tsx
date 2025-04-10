"\"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy, Check, AlertCircle, Database } from "lucide-react"

interface SqlInstructionsProps {
  title: string
  description: string
  sql: string
  onClose?: () => void
}

export function SqlInstructions({ title, description, sql, onClose }: SqlInstructionsProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy SQL:", err)
    }
  }

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

        <Tabs defaultValue="instructions">
          <TabsList className="mb-4">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
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

export default SqlInstructions
