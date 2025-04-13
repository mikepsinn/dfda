'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Music, Plus, Edit, BellRing, AlertTriangle } from "lucide-react"
import type { Database } from "@/lib/database.types"
import { createClient } from '@/lib/supabase/client' // Import client
import { createLogger } from '@/lib/logger' // Import logger

import { AddConditionDialog } from "./add-condition-dialog"
import { AddTreatmentDialog } from "./add-treatment-dialog"
import { ConditionsList } from "./conditions-list"
import { TreatmentSearch } from "./treatment-search"
import { SideEffectsDialog } from "./side-effects-dialog"
import { TreatmentRatingDialog } from "./treatment-rating-dialog"

const logger = createLogger("treatments-client")

// Define types based on database.types.ts
type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];
type TreatmentRating = Database["public"]["Tables"]["treatment_ratings"]["Row"];
// Extend TreatmentRating to include treatment details (assuming a join or separate fetch)
type UserTreatment = TreatmentRating & {
  treatment_name: string; // Need to fetch this
  condition_name?: string; // Optional, as rating might not have condition
};

// Use patient_treatments type directly now
type PatientTreatment = Database["public"]["Tables"]["patient_treatments"]["Row"] & {
  treatment_name: string; // Need to join or fetch this
  condition_name?: string; // Optional, fetchable via patient_conditions
  // Add fields from the base patient_treatments table
  start_date: string | null;
  status: string;
  patient_notes: string | null;
  is_prescribed: boolean;
  // Add rating details if joining?
  effectiveness_out_of_ten?: number | null;
  review?: string | null;
  rating_id?: string | null; // ID of the rating if found
};

interface TreatmentsClientProps {
  userId: string;
  initialConditions: PatientCondition[];
  conditionsError: Error | null;
}

export function TreatmentsClient({
  userId,
  initialConditions: patientConditions,
  conditionsError
}: TreatmentsClientProps) {
  const [selectedTreatmentForSearch, setSelectedTreatmentForSearch] = useState<{ id: string; name: string } | null>(null)
  const [userTreatments, setUserTreatments] = useState<PatientTreatment[]>([])
  const [isLoadingTreatments, setIsLoadingTreatments] = useState(true)
  const [treatmentsError, setTreatmentsError] = useState<string | null>(null)

  // State for dialogs (placeholders for now)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [isSideEffectsDialogOpen, setIsSideEffectsDialogOpen] = useState(false)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [selectedTreatmentForDialog, setSelectedTreatmentForDialog] = useState<PatientTreatment | null>(null)

  // Define fetchUserTreatments function here so it's accessible
  const fetchUserTreatments = async () => {
    setIsLoadingTreatments(true)
    setTreatmentsError(null)
    const supabase = createClient()
    try {
      // Fetch patient_treatments and join necessary related data
      const { data, error } = await supabase
        .from('patient_treatments')
        .select(`
          *,
          treatments!inner(id, global_variables!inner(name)),
          treatment_ratings(id, effectiveness_out_of_ten, review)
        `)
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // Handle case where no ratings exist gracefully (PGRST116: No rows found)
        if (error.code === 'PGRST116') {
           setUserTreatments([]);
        } else {
          throw error; // Rethrow other errors
        }
      } else {
        // Format the data - combine patient_treatment with treatment name and optional rating
        const formattedTreatments = data.map(pt => {
          const rating = (pt.treatment_ratings as any)?.[0]; // Assuming one rating per patient_treatment for now
          return {
            ...pt,
            treatment_name: (pt.treatments as any)?.global_variables?.name ?? 'Unknown Treatment',
            // Condition name would require another join or separate fetch based on condition link if needed
            effectiveness_out_of_ten: rating?.effectiveness_out_of_ten,
            review: rating?.review,
            rating_id: rating?.id,
          };
        });

        logger.info("Fetched user patient treatments", { userId, count: formattedTreatments.length });
        setUserTreatments(formattedTreatments);
      }
    } catch (error: any) {
      logger.error("Error fetching user patient treatments", { userId, error: error.message });
      setTreatmentsError("Failed to load your treatments. Please try again.");
    } finally {
      setIsLoadingTreatments(false);
    }
  };

  // Use the function in useEffect
  useEffect(() => {
    fetchUserTreatments();
  }, [userId]); // Dependency array might need fetchUserTreatments if it weren't stable

  const handleSelectTreatmentForSearch = (treatment: { id: string; name: string }) => {
    setSelectedTreatmentForSearch(treatment)
    // TODO: Maybe show details in the search tab when selected?
    console.log("Selected treatment in search:", treatment)
  }

  const openRatingDialog = (treatment: PatientTreatment) => {
    setSelectedTreatmentForDialog(treatment);
    setIsRatingDialogOpen(true); // Enable opening the dialog
  }

  const openSideEffectsDialog = (treatment: PatientTreatment) => {
    setSelectedTreatmentForDialog(treatment);
    setIsSideEffectsDialogOpen(true); // Enable opening the dialog
  }

  const openReminderDialog = (treatment: PatientTreatment) => {
    setSelectedTreatmentForDialog(treatment);
    alert(`Reminder dialog for ${treatment.treatment_name} (PatientTreatment ID: ${treatment.id}) - Coming Soon!`);
  }

  // Handle condition fetching errors passed from server component
  if (conditionsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load your conditions. Please try refreshing the page.</p>
          <p className="text-sm text-muted-foreground mt-2">{conditionsError.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Tabs defaultValue="treatments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="treatments">My Treatments</TabsTrigger>
          <TabsTrigger value="conditions">My Conditions</TabsTrigger>
          <TabsTrigger value="search">Search Global Treatments</TabsTrigger>
        </TabsList>

        {/* Tab for User's Treatments */}
        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Treatments</CardTitle>
              <CardDescription>Manage ratings, side effects, and reminders for treatments you track.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTreatments && <p>Loading your treatments...</p>}
              {treatmentsError && <p className="text-destructive">{treatmentsError}</p>}
              {!isLoadingTreatments && !treatmentsError && (
                userTreatments.length === 0 ? (
                  <div className="text-center py-6">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No treatments being tracked yet.</p>
                    <AddTreatmentDialog userId={userId} conditions={patientConditions || []} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userTreatments.map((treatment) => (
                      <Card key={treatment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                        <div className='flex-grow'>
                          <h4 className="font-semibold">{treatment.treatment_name}</h4>
                          {/* Display relevant info from patient_treatments */}
                          <p className="text-sm text-muted-foreground">Status: <span className="capitalize">{treatment.status}</span></p>
                          {treatment.start_date && 
                            <p className="text-sm text-muted-foreground">
                              Started: {new Date(treatment.start_date).toLocaleDateString()}
                            </p>}
                           {treatment.effectiveness_out_of_ten !== null && treatment.effectiveness_out_of_ten !== undefined && (
                             <p className="text-sm text-muted-foreground">
                               Rating: {treatment.effectiveness_out_of_ten}/10
                             </p>
                           )}
                           {treatment.review && (
                             <p className="text-sm text-muted-foreground mt-1 italic">
                               Review: "{treatment.review}"
                             </p>
                           )}
                           {treatment.patient_notes && (
                             <p className="text-sm text-muted-foreground mt-1">
                               Notes: {treatment.patient_notes}
                             </p>
                           )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                           <Button variant="outline" size="sm" onClick={() => openRatingDialog(treatment)}>
                              <Edit className="mr-1 h-4 w-4" /> Rate
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => openSideEffectsDialog(treatment)}>
                              <AlertTriangle className="mr-1 h-4 w-4" /> Effects
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => openReminderDialog(treatment)}>
                              <BellRing className="mr-1 h-4 w-4" /> Reminder
                           </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab for Conditions */}
        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Conditions</CardTitle>
              <CardDescription>Your current health conditions</CardDescription>
            </CardHeader>
            <CardContent>
              {patientConditions && patientConditions.length > 0 ? (
                <ConditionsList conditions={patientConditions} />
              ) : (
                <div className="text-center py-6">
                  <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No conditions added yet.</p>
                  <AddConditionDialog userId={userId} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab for Global Search */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Search</CardTitle>
              <CardDescription>
                Search for treatments globally (ratings not specific to you).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TreatmentSearch
                onSelect={handleSelectTreatmentForSearch}
                selected={selectedTreatmentForSearch}
              />
              {/* TODO: Display search results or details of selectedTreatmentForSearch here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Render SideEffectsDialog conditionally */}
      {isSideEffectsDialogOpen && selectedTreatmentForDialog && (
          <SideEffectsDialog 
              patientTreatmentId={selectedTreatmentForDialog.id} 
              treatmentName={selectedTreatmentForDialog.treatment_name}
              open={isSideEffectsDialogOpen} 
              onOpenChange={setIsSideEffectsDialogOpen}
              onSuccess={fetchUserTreatments} // Re-fetch treatments after success
          />
      )}

      {/* Render TreatmentRatingDialog conditionally */}
      {isRatingDialogOpen && selectedTreatmentForDialog && (
          <TreatmentRatingDialog 
              patientTreatment={selectedTreatmentForDialog}
              patientConditions={patientConditions || []} // Pass patient conditions
              open={isRatingDialogOpen} 
              onOpenChange={setIsRatingDialogOpen}
              onSuccess={fetchUserTreatments} // Re-fetch treatments after success
          />
      )}

      {/* Placeholder for Dialogs - Implement these components next */}
      {/* {isReminderDialogOpen && <ReminderDialog treatment={selectedTreatmentForDialog} onClose={() => setIsReminderDialogOpen(false)} />} */}
    </>
  )
} 