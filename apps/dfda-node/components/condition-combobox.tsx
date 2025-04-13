"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { searchConditionsAction } from "@/app/actions/conditions" // Assuming path is correct
import type { Database } from "@/lib/database.types"
import { useDebounce } from "@/hooks/use-debounce" // Assuming you have a debounce hook

type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"]
// Use a simpler type for searched conditions if appropriate, fetched from global_variables
type SearchedCondition = Pick<Database["public"]["Tables"]["global_variables"]["Row"], "id" | "name" | "emoji">

interface ConditionComboboxProps {
  patientConditions: PatientCondition[] // User's existing conditions
  value: string // Currently selected condition ID or "not-specified"
  onValueChange: (value: string) => void
}

const NOT_SPECIFIED_VALUE = "not-specified"
const NOT_SPECIFIED_LABEL = "Not Specified"

export function ConditionCombobox({ patientConditions, value, onValueChange }: ConditionComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = React.useState<SearchedCondition[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (debouncedSearchQuery) {
      setIsLoading(true)
      searchConditionsAction(debouncedSearchQuery)
        .then((data) => {
            // Filter out conditions the patient already has from search results
            const existingIds = new Set(patientConditions.map(pc => pc.condition_id))
            setSearchResults(data.filter(c => !existingIds.has(c.id)))
        })
        .catch(console.error) // Add proper logging/error handling
        .finally(() => setIsLoading(false))
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchQuery, patientConditions])

  const patientConditionItems = patientConditions
    .filter(pc => pc.condition_id && pc.condition_name) // Ensure valid data
    .map(pc => ({
        id: pc.condition_id!,
        name: pc.condition_name!,
        // emoji: pc.emoji // Add if available in patient_conditions_view
    }));

  const allSortedResults = [
    ...patientConditionItems,
    ...searchResults.filter(sr => !patientConditionItems.some(pc => pc.id === sr.id)) // Avoid duplicates
  ];

  const findSelectedConditionName = () => {
    if (value === NOT_SPECIFIED_VALUE) return NOT_SPECIFIED_LABEL
    const found = allSortedResults.find(c => c.id === value)
    return found?.name
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? findSelectedConditionName() : "Select condition..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}> {/* We handle filtering via server action */}
          <CommandInput
            placeholder="Search condition..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            disabled={isLoading}
          />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : "No condition found."}</CommandEmpty>
            <CommandGroup>
              {/* Not Specified Option */}
              <CommandItem
                key={NOT_SPECIFIED_VALUE}
                value={NOT_SPECIFIED_VALUE}
                onSelect={() => {
                  onValueChange(NOT_SPECIFIED_VALUE)
                  setOpen(false)
                  setSearchQuery("")
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === NOT_SPECIFIED_VALUE ? "opacity-100" : "opacity-0"
                  )}
                />
                {NOT_SPECIFIED_LABEL}
              </CommandItem>

              {/* Patient's Conditions */}
              {patientConditionItems.length > 0 && (
                  <CommandSeparator />
              )}
              {patientConditionItems.map((condition) => (
                <CommandItem
                  key={condition.id}
                  value={condition.id} // Use ID as value
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearchQuery("") // Clear search on select
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === condition.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {/* {condition.emoji && <span className="mr-2">{condition.emoji}</span>} */}
                  {condition.name}
                </CommandItem>
              ))}

             {/* Search Results (excluding patient's existing ones) */}
             {searchResults.length > 0 && (
                <CommandSeparator />
             )}
              {searchResults.map((condition) => (
                 <CommandItem
                 key={condition.id}
                 value={condition.id} // Use ID as value
                 onSelect={(currentValue) => {
                   onValueChange(currentValue === value ? "" : currentValue)
                   setOpen(false)
                   setSearchQuery("") // Clear search on select
                 }}
               >
                 <Check
                   className={cn(
                     "mr-2 h-4 w-4",
                     value === condition.id ? "opacity-100" : "opacity-0"
                   )}
                 />
                 {/* {condition.emoji && <span className="mr-2">{condition.emoji}</span>} */}
                 {condition.name}
               </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 