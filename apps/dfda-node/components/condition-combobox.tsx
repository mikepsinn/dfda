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
  value: string // Currently selected patient_condition UUID or "not-specified"
  onValueChange: (value: string) => void // Passes back patient_condition UUID or "not-specified"
  // Add a prop to control if adding new conditions is allowed/relevant
  // allowAddingNew?: boolean; // Example, not implemented here
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
    // Decide if searching should be enabled based on component usage
    // if (debouncedSearchQuery && allowAddingNew) { ... }
    if (debouncedSearchQuery) {
      setIsLoading(true)
      searchConditionsAction(debouncedSearchQuery)
        .then((data) => {
            // Filter out conditions the patient already has from search results
            // Note: This compares global_variable text IDs
            const existingGlobalIds = new Set(patientConditions.map(pc => pc.condition_id))
            setSearchResults(data.filter(c => !existingGlobalIds.has(c.id)))
        })
        .catch(console.error) // Add proper logging/error handling
        .finally(() => setIsLoading(false))
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchQuery, patientConditions]) // Add allowAddingNew if implemented

  // Map patient conditions for display, using the patient_condition UUID as the primary identifier
  const patientConditionItems = patientConditions
    .filter(pc => pc.id && pc.condition_name) // Ensure valid data (pc.id is the UUID)
    .map(pc => ({
        patientConditionId: pc.id!,         // The UUID of the patient_conditions record
        conditionName: pc.condition_name!, // The readable name
        // conditionId: pc.condition_id // The TEXT ID from global_variables (might still be useful)
        // emoji: pc.emoji // Add if available in patient_conditions_view
    }));

  // Function to find the display name based on the selected patient_condition UUID
  const findSelectedConditionName = () => {
    if (value === NOT_SPECIFIED_VALUE) return NOT_SPECIFIED_LABEL
    // Find based on the patientConditionId (UUID)
    const found = patientConditionItems.find(c => c.patientConditionId === value)
    return found?.conditionName
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
          {value && value !== NOT_SPECIFIED_VALUE ? findSelectedConditionName() : "Select condition..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}> {/* We handle filtering via server action */}
          <CommandInput
            placeholder="Search or select condition..." // Updated placeholder
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
                value={NOT_SPECIFIED_VALUE} // Special value
                onSelect={() => {
                  onValueChange(NOT_SPECIFIED_VALUE) // Pass back special value
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

              {/* Patient's Conditions - Use patientConditionId (UUID) */}
              {patientConditionItems.length > 0 && (
                  <CommandSeparator />
              )}
              {patientConditionItems.map((condition) => (
                <CommandItem
                  key={condition.patientConditionId} // Use UUID as key
                  value={condition.patientConditionId} // Use UUID as value
                  onSelect={(currentValue) => {
                    // currentValue is the patientConditionId (UUID)
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearchQuery("") // Clear search on select
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      // Compare against the UUID value
                      value === condition.patientConditionId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {/* {condition.emoji && <span className="mr-2\">{condition.emoji}</span>} */}
                  {condition.conditionName} {/* Display the name */}
                </CommandItem>
              ))}

             {/* Search Results (Global Conditions) - Consider disabling/modifying for rating */}
             {searchResults.length > 0 && (
                <CommandSeparator />
             )}
              {searchResults.map((condition) => (
                 <CommandItem
                 key={condition.id} // Use global variable TEXT ID as key
                 value={condition.id} // Use global variable TEXT ID as value
                 // Make these non-selectable or visually distinct in rating context
                 // For now, selecting them will pass the TEXT ID back, which is wrong for rating
                 // Option 1: Disable them
                 disabled
                 // Option 2: Style them differently
                 className="text-muted-foreground italic"
                 // Option 3: Handle differently in onSelect (e.g., pass special value)
                 /*
                 onSelect={() => {
                   // Indicate this is not a valid selection for rating
                   // onValueChange("INVALID_SELECTION_GLOBAL");
                   onValueChange("") // Or simply clear selection
                   setOpen(false)
                   setSearchQuery("")
                 }}
                 */
               >
                 {/* No checkmark for these in rating context */}
                 <span className="mr-2 h-4 w-4" /> {/* Placeholder for alignment */}
                 {/* {condition.emoji && <span className="mr-2\">{condition.emoji}</span>} */}
                 {condition.name} (Add New) {/* Indicate it's a global condition */}
               </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 