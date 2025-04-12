"use client"

import { useState, useEffect } from "react"
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
import { createClient } from "@/lib/supabase/client"

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
      try {
        const supabase = createClient()
        let query = supabase
          .from("treatments")
          .select(`
            id,
            name:global_variables!inner(name)
          `)
          .is("deleted_at", null)
          .limit(10)

        if (searchQuery) {
          query = query.ilike('global_variables.name', `${searchQuery}%`)
        }

        if (conditionId) {
          //query = query.eq("condition_id", conditionId)
        }

        const { data, error } = await query

        console.log("[TreatmentSearch] Supabase response:", { data, error });

        if (error) throw error

        setTreatments(data ? data.map(t => ({ id: t.id, name: t.name.name })) : [])
      } catch (error) {
        console.error("Error searching treatments:", error)
        setTreatments([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchTreatments, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, conditionId])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected ? selected.name : "Select treatment..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search treatments..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {loading ? "Searching..." : "No treatments found."}
          </CommandEmpty>
          <CommandGroup>
            {treatments.map((treatment) => (
              <CommandItem
                key={treatment.id}
                value={treatment.name}
                onSelect={() => {
                  onSelect(treatment)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected?.id === treatment.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {treatment.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 