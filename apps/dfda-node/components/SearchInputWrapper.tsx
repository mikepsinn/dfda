"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchInputWrapper() {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search for a medication, supplement, or food..." className="pl-8" />
    </div>
  )
}

