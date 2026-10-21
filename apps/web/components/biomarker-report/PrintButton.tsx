"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Opens the browser's print dialog, where the report can also be saved as a PDF. */
export function PrintButton() {
  return (
    <Button type="button" variant="outline" className="print:hidden" onClick={() => window.print()}>
      <Printer aria-hidden="true" className="mr-2 h-4 w-4" /> Print or save as PDF
    </Button>
  )
}
