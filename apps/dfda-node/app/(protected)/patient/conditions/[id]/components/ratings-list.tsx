"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientConditionRating, deleteTreatmentRatingAction } from "@/app/actions/treatment-ratings"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Star, Edit, Trash2, MoreVertical } from "lucide-react"
import { RateTreatmentDialog } from "./rate-treatment-dialog" // Import the dialog
import { Tables } from "@/lib/database.types"
import { useTransition } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createLogger } from "@/lib/logger"

const logger = createLogger("ratings-list")

interface RatingsListProps {
  ratings: PatientConditionRating[]
  patientCondition: Tables<"patient_conditions_view">
}

// Component to render the clickable stars
function RatingStars({ ratingValue, onClick }: { ratingValue: number | null; onClick?: () => void }) {
  const value = ratingValue ?? 0;
  return (
    <div className="flex items-center gap-0.5 cursor-pointer" onClick={onClick}>
      {[...Array(10)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < value ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground/50'}`}
        />
      ))}
       <span className="ml-2 text-sm font-medium text-foreground">{ratingValue ?? "N/A"}/10</span>
    </div>
  );
}

function RatingItem({ rating, patientCondition }: { rating: PatientConditionRating; patientCondition: Tables<"patient_conditions_view"> }) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete the rating for ${rating.treatment_name}?`)) {
      return;
    }
    startTransition(async () => {
      try {
        const result = await deleteTreatmentRatingAction(rating.id);
        if (result.success) {
          toast({ title: "Success", description: "Rating deleted." });
          // Revalidation should refresh the list
        } else {
          throw new Error(result.error || "Failed to delete rating");
        }
      } catch (error) {
        logger.error("Failed to delete rating", { error, ratingId: rating.id });
        toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete rating.", variant: "destructive" });
      }
    });
  }

  return (
     <Card key={rating.id} className="overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        {/* Main content on left */}
        <div className="flex-1 mr-4">
          <CardTitle className="text-lg mb-1">{rating.treatment_name || "Unnamed Treatment"}</CardTitle>
          {rating.review && (
             <CardDescription className="text-sm italic">" {rating.review} "</CardDescription>
          )}
        </div>

        {/* Dots menu on right */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 w-8 h-8" disabled={isPending}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Edit action triggers the dialog */}
            <RateTreatmentDialog patientCondition={patientCondition} existingRating={rating}>
               {/* We need a component here that DropdownMenuItem can render */}
              <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left">
                 <Edit className="mr-2 h-4 w-4" />
                 <span>Edit</span>
              </button>
            </RateTreatmentDialog>
            <DropdownMenuItem onClick={handleDelete} disabled={isPending} className="text-destructive focus:text-destructive">
              {isPending ? (
                 <>
                   <Trash2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                 </>
               ) : (
                 <>
                   <Trash2 className="mr-2 h-4 w-4" /> Delete
                 </>
               )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </CardHeader>
      <CardContent className="p-4 pt-0">
         {/* Clickable stars trigger the dialog */}
         <RateTreatmentDialog patientCondition={patientCondition} existingRating={rating}>
            {/* Wrap stars in a button-like div to make it clear it's interactive and provide trigger */}
            <div role="button" aria-label={`Edit rating for ${rating.treatment_name}`}>
              <RatingStars ratingValue={rating.effectiveness_out_of_ten} />
            </div>
         </RateTreatmentDialog>
      </CardContent>
    </Card>
  )
}

export function RatingsList({ ratings, patientCondition }: RatingsListProps) {
  if (!ratings || ratings.length === 0) {
    return <p className="text-sm text-muted-foreground">No treatments have been rated for this condition yet.</p>
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <RatingItem key={rating.id} rating={rating} patientCondition={patientCondition} />
      ))}
    </div>
  )
} 