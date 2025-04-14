'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Music, Edit, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'
import { AddTreatmentDialog } from "./add-treatment-dialog"
import { SideEffectsDialog } from "./side-effects-dialog"
import { TreatmentRatingDialog } from "./treatment-rating-dialog"
import type { Database } from '@/lib/database.types'

type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];
type PatientTreatmentWithDetails = Database["public"]["Tables"]["patient_treatments"]["Row"] & {
  treatment_name: string;
  effectiveness_out_of_ten?: number | null;
  review?: string | null;
  rating_id?: string | null;
};

interface TreatmentsClientProps {
  userId: string;
  initialConditions: PatientCondition[];
  conditionsError: Error | null;
}

const DisplayRating = ({ rating }: { rating: number | null | undefined }) => {
  if (rating === null || rating === undefined) {
    return <span className="text-sm text-muted-foreground">Not Rated</span>;
  }
  return <span className="text-sm font-medium">{rating.toFixed(1)} / 10</span>;
};

export function TreatmentsClient({
  userId,
  initialConditions = [],
  conditionsError,
}: TreatmentsClientProps) {
  const [userTreatments, setUserTreatments] = useState<PatientTreatmentWithDetails[]>([])
  const [isLoadingTreatments, setIsLoadingTreatments] = useState(true)
  const [treatmentsError, setTreatmentsError] = useState<string | null>(null)
  const [selectedTreatmentForDialog, setSelectedTreatmentForDialog] = useState<PatientTreatmentWithDetails | null>(null)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [isSideEffectsDialogOpen, setIsSideEffectsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUserTreatments = useCallback(async () => {
    setIsLoadingTreatments(true)
    setTreatmentsError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patient_treatments')
        .select(`
          *,
          treatments!inner ( global_variables!inner ( name ) ),
          treatment_ratings ( effectiveness_out_of_ten, review, id, patient_condition_id )
        `)
        .eq('patient_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error("Supabase fetch error (patient treatments):", JSON.stringify(error, null, 2));
        throw error
      }

      const formattedData: PatientTreatmentWithDetails[] = data.map(pt => {
         const firstRating = (pt.treatment_ratings as any)?.[0];
         return {
           ...pt,
           treatment_name: (pt.treatments as any)?.global_variables?.name ?? 'Unknown Treatment',
           effectiveness_out_of_ten: firstRating?.effectiveness_out_of_ten ?? null,
           review: firstRating?.review ?? null,
           rating_id: firstRating?.id ?? null,
         };
      });
      
      setUserTreatments(formattedData)
      logger.info("Fetched user treatments successfully", { userId, count: formattedData.length });
    } catch (err) {
      logger.error("Error fetching user treatments:", err instanceof Error ? err.message : err)
      setTreatmentsError("Failed to load treatments.")
      setUserTreatments([])
    } finally {
      setIsLoadingTreatments(false)
    }
  }, [userId])
  
  useEffect(() => {
    fetchUserTreatments()
  }, [fetchUserTreatments])

  const openRatingDialog = (treatment: PatientTreatmentWithDetails) => {
    setSelectedTreatmentForDialog(treatment);
    setIsRatingDialogOpen(true);
  }

  const openSideEffectsDialog = (treatment: PatientTreatmentWithDetails) => {
    setSelectedTreatmentForDialog(treatment);
    setIsSideEffectsDialogOpen(true);
  }

  if (conditionsError) {
    return (
      <div className="border bg-card text-card-foreground shadow-sm rounded-lg p-4">
        <h3 className="text-lg font-semibold">Error Loading Supporting Data</h3>
        <p className="text-destructive mt-2">Failed to load supporting condition data needed for dialogs. Please try refreshing the page.</p>
        <p className="text-sm text-muted-foreground mt-1">{conditionsError.message}</p>
      </div>
    )
  }

  const filteredTreatments = userTreatments.filter(treatment =>
    treatment.treatment_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-4">
        {isLoadingTreatments && <p className="text-center text-muted-foreground">Loading your treatments...</p>}
        {treatmentsError && <p className="text-destructive text-center">{treatmentsError}</p>}
        {!isLoadingTreatments && !treatmentsError && (
          <>
            {userTreatments.length > 0 && (
              <div className="mb-4">
                <Input
                  placeholder="Filter treatments by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            )}

            {userTreatments.length > 0 && filteredTreatments.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No treatments match your filter.</p>
            )}

            {filteredTreatments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTreatments.map((treatment) => (
                  <Card key={treatment.id}>
                    <CardHeader>
                      <CardTitle>{treatment.treatment_name}</CardTitle>
                      {treatment.status && (
                        <Badge variant={treatment.status === 'active' ? 'default' : 'secondary'} className="w-fit">
                          {treatment.status}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {treatment.start_date && (
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(treatment.start_date).toLocaleDateString()}
                        </p>
                      )}
                      <div>
                        <span className="text-sm font-medium">Effectiveness: </span>
                        <DisplayRating rating={treatment.effectiveness_out_of_ten} />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openRatingDialog(treatment)}>
                          <Edit className="mr-1 h-4 w-4" /> Rate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openSideEffectsDialog(treatment)}>
                          <AlertTriangle className="mr-1 h-4 w-4" /> Effects
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {userTreatments.length === 0 && (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No treatments tracked yet</h3>
                <p className="text-muted-foreground mb-4">Add your first treatment to start tracking.</p>
                <AddTreatmentDialog userId={userId} conditions={initialConditions || []} />
              </div>
            )}

            {userTreatments.length > 0 && (
              <div className="mt-6 flex justify-center">
                  <AddTreatmentDialog userId={userId} conditions={initialConditions || []} />
              </div>
            )}
          </>
        )}
      </div>

      {selectedTreatmentForDialog && (
        <TreatmentRatingDialog 
           open={isRatingDialogOpen} 
           onOpenChange={setIsRatingDialogOpen} 
           patientTreatment={selectedTreatmentForDialog}
           patientConditions={initialConditions || []}
           onSuccess={fetchUserTreatments} 
        />
      )}
      {selectedTreatmentForDialog && (
        <SideEffectsDialog 
           open={isSideEffectsDialogOpen} 
           onOpenChange={setIsSideEffectsDialogOpen} 
           patientTreatmentId={selectedTreatmentForDialog.id}
           treatmentName={selectedTreatmentForDialog.treatment_name}
           onSuccess={fetchUserTreatments} 
         />
       )}
    </>
  )
} 