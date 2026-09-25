import React from 'react';
import { cn } from "@/lib/utils"; // Import cn utility
import { CitationDisplay } from './CitationDisplay'; // Import the new component
import type { OutcomeFooterData } from '@/lib/actions/global-variable-relationships'; // Import the updated footer type

export interface OutcomeValue {
  percentage: number;
  absolute?: string; // e.g., "-69 mg/dL"
  nnh?: number;
}

export interface OutcomeItem {
  name: string;
  baseline?: string; // e.g., "(baseline: 160 mg/dL)"
  value: OutcomeValue;
  isPositive?: boolean; // Green if true, Red if false, Amber if undefined (for side effects)
}

export interface OutcomeCategory {
  title: string;
  items: OutcomeItem[];
  isSideEffectCategory?: boolean; // To apply specific styling/logic for side effects
}

export interface OutcomeLabelProps {
  title: string;
  subtitle?: string; // e.g., "Lipid-lowering agent"
  tag?: string; // Optional tag, e.g., "Drug Class"
  data: OutcomeCategory[];
  footer?: OutcomeFooterData; // Use the updated footer type from the action
}

export function OutcomeLabel({ title, subtitle, tag, data = [], footer }: OutcomeLabelProps) {
  const renderProgressBar = (item: OutcomeItem, isSideEffect: boolean = false) => {
    // Determine color based on positivity or if it's a side effect
    const colorClass = isSideEffect
      ? 'bg-amber-500' // Use amber for side effects if isPositive is not explicitly set
      : item.isPositive === true
        ? 'bg-green-600'
        : item.isPositive === false
          ? 'bg-red-600'
          : 'bg-gray-400'; // Default or neutral color if positivity is undefined and not a side effect

    const textColorClass = isSideEffect
        ? 'text-red-600' // Side effects usually shown in red/amber text
        : item.isPositive === true
          ? 'text-green-600'
          : item.isPositive === false
            ? 'text-red-600'
            : 'text-gray-700';

    const valueString = `${item.value.percentage > 0 ? '+' : ''}${item.value.percentage}%` +
                        (item.value.absolute ? ` (${item.value.absolute})` : '') +
                        (item.value.nnh ? ` (NNH: ${item.value.nnh})` : '');

    return (
      <div key={item.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
        <div className="flex items-center">
          <span className="text-sm">{item.name}</span>
          {item.baseline && <span className="ml-2 text-xs text-muted-foreground">{item.baseline}</span>}
        </div>
        <div className="flex items-center">
          <span className={cn("text-sm font-medium", textColorClass)}>{valueString}</span>
          {/* Simple visual bar, matching the example's style */}
          <div className="ml-2 h-2 w-16 rounded-full bg-gray-200 hidden sm:block">
            <div
              className={cn("h-2 rounded-full", colorClass)}
              // Use absolute percentage for width, max 100
              style={{ width: `${Math.min(Math.abs(item.value.percentage), 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    // Using border and bg-background to mimic the style in OutcomeLabelsSection
    <div className="rounded-lg border bg-background p-4 w-full max-w-xl">
       <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
         <span className="font-semibold text-lg">{title}</span>
         {tag && (
           <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1 sm:mt-0">
             {tag}
           </span>
         )}
       </div>
       {subtitle && <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>}

      <div className="space-y-4">
        {data.map((category, index) => (
          <div key={category.title} className={index < data.length - 1 ? 'border-b pb-3 mb-3' : ''}>
            <div className="text-sm font-medium mb-2">{category.title}</div>
            <div className="space-y-3 sm:space-y-2">
              {category.items.map(item => renderProgressBar(item, category.isSideEffectCategory))}
            </div>
          </div>
        ))}

        {/* Updated Footer Section */}
        {footer && (
           <div className="mt-4 pt-3 border-t text-xs text-muted-foreground space-y-2">
             {/* Render the CitationDisplay component */}
             <CitationDisplay citation={footer.sourceCitation} />

             {/* Display Last Updated and NNH Description separately */}
             <div className="flex justify-between">
                {footer.lastUpdated && <span>{footer.lastUpdated}</span>}
                {footer.nnhDescription && <span>{footer.nnhDescription}</span>}
             </div>
             {footer.nnhDescription && (
               <div className="mt-1">
                 <span>{footer.nnhDescription}</span>
               </div>
             )}
           </div>
        )}

        {/* Removing the old link for now, can be added back if needed via props */}
        {/*
        <div className="text-xs text-primary font-medium cursor-pointer hover:underline">
           View full outcome label →
        </div>
        */}
      </div>
    </div>
  );
} 