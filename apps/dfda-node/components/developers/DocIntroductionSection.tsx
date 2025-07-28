import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export function DocIntroductionSection() {
  return (
    <section id="introduction" className="mb-10">
      <h2 className="text-3xl font-bold mb-4">Introduction</h2>
      <p className="text-muted-foreground mb-4">
        The FDA.gov v2 API provides programmatic access to clinical trial data, comparative effectiveness information,
        and outcome labels. This documentation will help you integrate with our API and build powerful healthcare
        applications.
      </p>
      <div className="rounded-lg bg-primary/5 p-4 mb-6">
        <h3 className="font-medium mb-2">Base URL</h3>
        <div className="flex items-center justify-between bg-muted rounded p-2">
          <code className="text-sm">https://api.dfda.earth/v1</code>
          <Button variant="ghost" size="sm">
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy</span>
          </Button>
        </div>
      </div>
      <p className="mb-4">
        All API requests should be made to the base URL above. The API is organized around REST principles and returns
        JSON-encoded responses.
      </p>
    </section>
  )
} 