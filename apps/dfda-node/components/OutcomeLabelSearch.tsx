'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { searchPredictorsAction, PredictorSuggestion } from '@/lib/actions/global-variables';
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

  const fetchSuggestions = useCallback(async (term: string, isInitialFetch = false) => {
    if (term === '' && isInitialFetch) {
      setIsLoading(true);
      try {
        const results = await searchPredictorsAction('');
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error("Failed to fetch initial suggestions:", error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    } else if (term.length >= 2) {
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
    } else if (!isInitialFetch) {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      fetchSuggestions(debouncedSearchTerm);
    } else {
      const isFocusedAndEmpty = inputRef.current === document.activeElement && inputValue === '';
      if (!isFocusedAndEmpty) {
        setSuggestions([]);
        setIsOpen(false);
      }
    }
  }, [debouncedSearchTerm, inputValue, fetchSuggestions]);

  const handleSelect = (suggestion: PredictorSuggestion) => {
    setInputValue(suggestion.name);
    setSelectedPredictorId(suggestion.id);
    setIsOpen(false);
    router.push(`/outcome-labels/${encodeURIComponent(suggestion.id)}`);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    inputRef.current?.blur();
    setIsOpen(false);
    const targetId = selectedPredictorId || inputValue.trim();
    if (targetId) {
      const matchingSuggestion = suggestions.find(s => s.name.toLowerCase() === targetId.toLowerCase());
      const finalId = matchingSuggestion ? matchingSuggestion.id : targetId;
      router.push(`/outcome-labels/${encodeURIComponent(finalId)}`);
    } else {
      console.log("Search submitted with empty input");
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSelectedPredictorId(null);
  };

  const handleFocus = () => {
    if (!inputValue && suggestions.length === 0) {
      fetchSuggestions('', true);
    } else {
      setIsOpen(suggestions.length > 0);
    }
  };

  return (
    <div className="flex justify-center w-full p-4">
      <form onSubmit={handleFormSubmit} className="w-full max-w-xl">
        <Command className="overflow-visible rounded-full border">
          <CommandInput
             ref={inputRef}
             placeholder="Search interventions (e.g., atorvastatin)..."
             className="h-10 rounded-full focus:ring-0 border-0 bg-transparent"
             value={inputValue}
             onValueChange={handleInputChange}
             onFocus={handleFocus}
             onBlur={() => setTimeout(() => setIsOpen(false), 200)}
           />

          {isOpen && (
            <div className="relative">
              <CommandList className="absolute top-2 mt-1 w-full z-10 border rounded-md bg-background shadow-lg">
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
    </div>
  );
} 