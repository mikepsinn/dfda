"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ConditionOption = { slug: string; name: string; synonyms: string[] };

// Only the searchable index crosses the client boundary, not treatment records.
export function ConditionPicker({ conditions, initialValue }: {
  conditions: ConditionOption[];
  initialValue: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const selected = conditions.find(condition => condition.slug === value);

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor="condition-picker" className="block text-sm font-medium">Condition</label>
      <input type="hidden" name="condition" value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id="condition-picker" type="button" variant="outline" role="combobox"
            aria-expanded={open} className="h-11 w-full justify-between gap-2 font-normal">
            <span className="truncate">{selected?.name ?? "Choose a condition"}</span>
            <ChevronsUpDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Choose a condition" align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command label="Search conditions" filter={(value, search, keywords = []) => {
            const query = search.trim().toLowerCase();
            const terms = [value, ...keywords].map(term => term.toLowerCase());
            if (!query || terms.includes(query)) return 1;
            return terms.some(term => term.includes(query)) ? 0.5 : 0;
          }}>
            <CommandInput placeholder={`Search ${conditions.length} conditions…`} aria-label="Search conditions" />
            <CommandList>
              <CommandEmpty>No matching conditions.</CommandEmpty>
              <CommandGroup>
                {conditions.map(condition => (
                  <CommandItem key={condition.slug} value={condition.slug}
                    keywords={[condition.name, ...condition.synonyms]}
                    onSelect={() => { setValue(condition.slug); setOpen(false); }}>
                    <Check aria-hidden="true" className={cn("h-4 w-4", value === condition.slug ? "opacity-100" : "opacity-0")} />
                    <span>{condition.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
