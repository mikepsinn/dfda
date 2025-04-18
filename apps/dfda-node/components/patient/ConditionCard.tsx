import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { PatientCondition } from "@/lib/actions/patient-conditions" // Assuming type export includes optional fields
import { format } from 'date-fns'; // Import date-fns for formatting

interface ConditionCardProps {
  // Expecting PatientCondition type to include optional emoji, status, and diagnosed_at
  condition: PatientCondition & { 
    emoji?: string | null;
    status?: string | null; // Add status 
    diagnosed_at?: string | null; // Add diagnosed_at
  }
}

export function ConditionCard({ condition }: ConditionCardProps) {
  const displayEmoji = condition.emoji; 
  const formattedDate = condition.diagnosed_at 
    ? format(new Date(condition.diagnosed_at), 'MMM d, yyyy') 
    : null;

  return (
    <Link key={condition.id} href={`/patient/conditions/${condition.id}`} className="block">
      <TooltipProvider delayDuration={300}> {/* Add TooltipProvider */} 
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:bg-muted/50 cursor-pointer">
              <CardHeader className="flex flex-row items-start gap-4 p-4"> {/* Use flex-row, items-start, adjust padding */} 
                {/* Emoji Column */} 
                {displayEmoji && (
                  <div className="flex items-center justify-center pt-1"> {/* Align emoji slightly lower */} 
                    <span className="text-3xl">{displayEmoji}</span>
                  </div>
                )}
                {/* Text Content Column */} 
                <div className="flex-1 space-y-1"> {/* Take remaining space, add vertical spacing */} 
                  <CardTitle className="text-lg leading-tight">{condition.condition_name || "Unknown Condition"}</CardTitle>
                  {/* Secondary Info */} 
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2"> {/* Smaller text, flex for status/date */} 
                    {condition.status && (
                      <span className="capitalize inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium">{condition.status}</span>
                    )}
                    {formattedDate && (
                      <span>Diagnosed: {formattedDate}</span>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </TooltipTrigger>
          {/* Tooltip Content (only if description exists) */} 
          {condition.description && (
            <TooltipContent side="bottom" align="start">
              <p className="max-w-xs text-sm">{condition.description}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </Link>
  )
} 