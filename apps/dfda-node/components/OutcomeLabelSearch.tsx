'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { useDebounce } from '@/hooks/useDebounce';

export function OutcomeLabelSearch() {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<PredictorSuggestion[]>([]);
  const [selectedPredictorId, setSelectedPredictorId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

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
    setInputValue(suggestion.name);
    setSelectedPredictorId(suggestion.id);
    setIsOpen(false);
    router.push(`/outcome-labels/${encodeURIComponent(suggestion.id)}`);
  };

  const handleNavigation = () => {
    const targetId = selectedPredictorId || inputValue.trim();
    if (targetId) {
       router.push(`/outcome-labels/${encodeURIComponent(targetId)}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsOpen(false);
    handleNavigation();
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSelectedPredictorId(null);
    setIsOpen(suggestions.length > 0 && !!value);
  };

  return (
    <form onSubmit={handleFormSubmit} className="mb-6">
      <Command className="overflow-visible flex-grow">
        <div className="flex w-full items-center space-x-2">
           {/* The CommandInput component renders its own icon */}
           <CommandInput 
             ref={inputRef} 
             placeholder="Search interventions (e.g., atorvastatin)..." 
             className="h-10" // Removed flex-grow from input, let Command handle growth
             value={inputValue}
             onValueChange={handleInputChange}
             onFocus={() => setIsOpen(suggestions.length > 0 && !!inputValue)}
             onBlur={() => setTimeout(() => setIsOpen(false), 150)}
           />
           <Button type="submit">Search</Button>
        </div>

        {isOpen && (
          <div className="relative">
            <CommandList className="absolute top-0 mt-1 w-full z-10 border rounded-md bg-background shadow-md">
              {isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.id}
                        value={suggestion.id}
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
    </form>
  );
} 