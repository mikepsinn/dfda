"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JavaScriptExamples } from "./JavaScriptExamples"
import { PythonExamples } from "./PythonExamples"
import { RubyExamples } from "./RubyExamples"
import { CurlExamples } from "./CurlExamples"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function CodeExampleTabs() {
  return (
    <>
      <Tabs defaultValue="javascript">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="ruby">Ruby</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
        </TabsList>
        <TabsContent value="javascript" className="mt-4">
          <JavaScriptExamples />
        </TabsContent>
        <TabsContent value="python" className="mt-4">
          <PythonExamples />
        </TabsContent>
        <TabsContent value="ruby" className="mt-4">
          <RubyExamples />
        </TabsContent>
        <TabsContent value="curl" className="mt-4">
          <CurlExamples />
        </TabsContent>
      </Tabs>
      <div className="mt-4">
        <Button variant="outline" className="w-full">
          <ExternalLink className="mr-2 h-4 w-4" /> View More Examples on GitHub
        </Button>
      </div>
    </>
  )
}

