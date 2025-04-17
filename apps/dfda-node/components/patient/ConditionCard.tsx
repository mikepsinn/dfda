import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { PatientCondition } from "@/app/actions/patient-conditions" // Assuming type export

interface ConditionCardProps {
  condition: PatientCondition
  emoji?: string // Add optional emoji prop
}

export function ConditionCard({ condition, emoji }: ConditionCardProps) {
  return (
    <Link key={condition.id} href={`/patient/conditions/${condition.id}`} className="block">
      <Card className="hover:bg-muted/50 cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-2"> {/* Wrapper for emoji and title */}
            {emoji && <span className="text-xl">{emoji}</span>} {/* Display emoji */}
            <CardTitle className="text-lg">{condition.condition_name || "Unknown Condition"}</CardTitle>
          </div>
          {condition.description && (
            // Add some margin if description exists and emoji is present
            <CardDescription className={emoji ? "mt-1 ml-[calc(1.25rem+0.5rem)]" : "mt-1"}> {/* Adjust margin-left based on emoji presence */}
               {condition.description}
            </CardDescription>
          )}
        </CardHeader>
        {/* Optional: Add more details like status, severity if needed */}
        {/* <CardContent>
            <p>Status: {condition.status}</p>
            <p>Severity: {condition.severity}</p>
        </CardContent> */}
      </Card>
    </Link>
  )
} 