import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export interface ConditionSearchProps {
  onConditionSelect: (condition: string) => void
  initialSearchTerm?: string
  placeholder?: string
  availableConditions: string[]
}

export function ConditionSearch({ 
  onConditionSelect, 
  initialSearchTerm = "", 
  placeholder = "Search conditions...",
  availableConditions 
}: ConditionSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [isOpen, setIsOpen] = useState(false)

  const filteredConditions = availableConditions.filter(condition =>
    condition.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          className="pl-8"
        />
      </div>
      {isOpen && searchTerm && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg">
          {filteredConditions.map((condition) => (
            <div
              key={condition}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                onConditionSelect(condition)
                setSearchTerm("")
                setIsOpen(false)
              }}
            >
              {condition}
            </div>
          ))}
          {filteredConditions.length === 0 && (
            <div className="px-4 py-2 text-gray-500">No conditions found</div>
          )}
        </div>
      )}
    </div>
  )
} 