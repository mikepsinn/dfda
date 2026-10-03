"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User } from '@supabase/supabase-js'
import { DialogTitle } from "@/components/ui/dialog"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { logger } from "@/lib/logger"
import { searchVariablesAction } from "@/lib/actions/search"
import type { SearchResult } from "@/lib/actions/search"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { VARIABLE_CATEGORIES_DATA } from "@/lib/constants/variable-categories"

// What a result is, in plain words: a condition, a treatment, or otherwise its category (a vital
// sign such as blood pressure is in Health and Physiology but is not a condition); the user's own
// are marked.
function resultLabel(result: SearchResult) {
  const kind = result.kind === "condition" ? "Condition"
    : result.kind === "treatment" ? "Treatment"
    : VARIABLE_CATEGORIES_DATA[result.variableCategoryId ?? ""]?.name ?? ""
  return result.category === "My Variables" ? [kind, "yours"].filter(Boolean).join(" · ") : kind
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function SearchModal({ isOpen, onClose, user }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchResults = useCallback(async (currentQuery: string) => {
    setLoading(true);
    logger.info("SearchModal: Fetching results", { query: currentQuery, userId: user?.id });
    try {
      const searchResults = await searchVariablesAction(currentQuery, user?.id);
      setResults(searchResults);
      logger.info("SearchModal: Results fetched", { query: currentQuery, count: searchResults.length });

    } catch (error) {
      logger.error("SearchModal: Error fetching search results", { error });
      setResults([]); // Clear results on error
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch initial suggestions when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch immediately with empty query for initial suggestions
      fetchResults(""); 
    }
  }, [isOpen, fetchResults]);

  // Handle selecting an item
  const handleSelect = (href: string) => {
    router.push(href);
    onClose(); // Close the modal after navigation
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <VisuallyHidden>
        <DialogTitle>Search treatments, conditions and more</DialogTitle>
      </VisuallyHidden>
      <CommandInput 
        placeholder="Search treatments, conditions and more..."
        value={query}
        onValueChange={(search) => {
            setQuery(search);
            // Debounce or directly call fetchResults
            fetchResults(search); // Consider adding debounce here for performance
        }} 
      />
      <CommandList>
        {loading && <div className="p-4 text-sm text-center">Loading...</div>}
        {!loading && results.length === 0 && query.length > 0 && (
          <CommandEmpty>No results found for "{query}".</CommandEmpty>
        )}
        {!loading && results.length === 0 && query.length === 0 && (
            <CommandEmpty>Start typing to search treatments, conditions and more.</CommandEmpty> // Initial state
        )}
        {!loading && results.length > 0 && (
           <CommandGroup heading="Suggestions">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`${result.category}-${result.name}`} // Unique value for Command filtering/selection
                  onSelect={() => handleSelect(result.href)}
                  className="cursor-pointer"
                >
                  {/* Add an icon maybe based on category? */} 
                  <span>{result.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{resultLabel(result)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
        )}
        {/* Add separators or more groups if needed */}
        {/* <CommandSeparator /> */}
      </CommandList>
    </CommandDialog>
  );
} 