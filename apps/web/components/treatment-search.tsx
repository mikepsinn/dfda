"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { searchTreatmentOptionsAction } from "@/lib/actions/treatments"

interface TreatmentSearchProps {
  onSelect: (treatment: { id: string; name: string }) => void
  selected: { id: string; name: string } | null
  conditionId?: string
}

export function TreatmentSearch({ onSelect, selected, conditionId }: TreatmentSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [treatments, setTreatments] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchTreatments = async () => {
      setLoading(true)
      setTreatments([])
      try {
        setTreatments(await searchTreatmentOptionsAction(searchQuery))
      } catch (error) {
        console.error("Error searching treatments:", error)
        setTreatments([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimeout = setTimeout(() => {
      searchTreatments()
    }, 300)

    return () => clearTimeout(debounceTimeout)
  }, [searchQuery, conditionId])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          style={{ minWidth: "200px" }}
        >
          <span className="truncate">
            {selected ? selected.name : "Select treatment..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{
          width: "var(--radix-popover-trigger-width)",
          maxHeight: "var(--radix-popover-content-available-height)",
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search treatments..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {loading ? "Searching..." : "No treatments found."}
          </CommandEmpty>
          <CommandGroup className="overflow-auto max-h-[300px]">
            {treatments.map((treatment) => (
              <CommandItem
                key={treatment.id}
                value={treatment.name}
                onSelect={() => {
                  onSelect(treatment)
                  setOpen(false)
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected?.id === treatment.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">
                  {treatment.name}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 