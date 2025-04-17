'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { searchPredictorsAction, PredictorSuggestion } from '@/app/actions/global-variables';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming a debounce hook exists

export function OutcomeLabelSearch() {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<PredictorSuggestion[]>([]);
  const [selectedPredictorId, setSelectedPredictorId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the input value to limit API calls
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchPredictorsAction(term);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchSuggestions(debouncedSearchTerm);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [debouncedSearchTerm, fetchSuggestions]);

  const handleSelect = (suggestion: PredictorSuggestion) => {
    setInputValue(suggestion.name); // Update input to show the name
    setSelectedPredictorId(suggestion.id); // Store the ID for navigation
    setIsOpen(false);
    // Optionally, navigate immediately on select:
    // router.push(`/outcome-labels/${encodeURIComponent(suggestion.id)}`);
  };

  const handleNavigation = () => {
    const targetId = selectedPredictorId || inputValue.trim();
    if (targetId) {
       router.push(`/outcome-labels/${encodeURIComponent(targetId)}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleNavigation();
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSelectedPredictorId(null); // Clear selected ID if user types again
    // Suggestions are fetched via useEffect/debounce
  };

  return (
    <form onSubmit={handleFormSubmit} className="mb-6 relative">
      <Command className="overflow-visible">
        <div className="relative flex gap-2 items-center">
           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
           <CommandInput 
             ref={inputRef} 
             placeholder="Search interventions (e.g., atorvastatin)..." 
             className="pl-8 flex-grow"
             value={inputValue}
             onValueChange={handleInputChange}
             onFocus={() => setIsOpen(suggestions.length > 0 && !!inputValue)}
             // Removed onBlur that closes immediately for better usability
           />
           <Button type="submit">Search</Button>
        </div>

        {isOpen && (
          <div className="absolute top-full mt-1 w-full z-10">
            <CommandList className="border rounded-md bg-background shadow-md">
              {isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.id}
                        value={suggestion.id} // Use ID as value for selection logic
                        onSelect={() => handleSelect(suggestion)}
                        className="cursor-pointer"
                      >
                        {suggestion.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </div>
        )}
      </Command>
       {/* Click outside handler can be added here if needed */}
    </form>
  );
} 