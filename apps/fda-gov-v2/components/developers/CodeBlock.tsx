import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import type { ReactNode } from "react"

interface CodeBlockProps {
  title: string
  children: ReactNode
}

export function CodeBlock({ title, children }: CodeBlockProps) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <Button variant="ghost" size="sm">
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy</span>
        </Button>
      </div>
      <pre className="text-sm overflow-auto">{children}</pre>
    </div>
  )
}

