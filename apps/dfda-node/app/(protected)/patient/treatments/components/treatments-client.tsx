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

const logger = createLogger("treatments-client")

// Define types based on database.types.ts
type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];
type TreatmentRating = Database["public"]["Tables"]["treatment_ratings"]["Row"];
// Extend TreatmentRating to include treatment details (assuming a join or separate fetch)
type UserTreatment = TreatmentRating & {
  treatment_name: string; // Need to fetch this
  condition_name?: string; // Optional, as rating might not have condition
};

interface TreatmentsClientProps {
  userId: string;
  initialConditions: PatientCondition[];
  conditionsError: Error | null;
}

export function TreatmentsClient({
  userId,
  initialConditions,
  conditionsError
}: TreatmentsClientProps) {
  const [selectedTreatmentForSearch, setSelectedTreatmentForSearch] = useState<{ id: string; name: string } | null>(null)
  const [userTreatments, setUserTreatments] = useState<UserTreatment[]>([])
  const [isLoadingTreatments, setIsLoadingTreatments] = useState(true)
  const [treatmentsError, setTreatmentsError] = useState<string | null>(null)

  // State for dialogs (placeholders for now)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [isSideEffectsDialogOpen, setIsSideEffectsDialogOpen] = useState(false)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [selectedTreatmentForDialog, setSelectedTreatmentForDialog] = useState<UserTreatment | null>(null)

  useEffect(() => {
    const fetchUserTreatments = async () => {
      setIsLoadingTreatments(true)
      setTreatmentsError(null)
      const supabase = createClient()
      try {
        // Fetch ratings linked to the user, joining with treatments and conditions
        // Using left joins to ensure treatments without conditions/ratings are included if schema changes
        const { data, error } = await supabase
          .from('treatment_ratings') // Start from ratings as they link user and treatment
          .select(`
            *,
            treatments!inner(id, global_variables!inner(name)),
            conditions(id, global_variables!inner(name))
          `)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) {
          // Handle case where no ratings exist gracefully (PGRST116: No rows found)
          if (error.code === 'PGRST116') {
             setUserTreatments([]);
          } else {
            throw error; // Rethrow other errors
          }
        } else {
          // Format the data
          const formattedTreatments = data.map(rating => ({
            ...rating,
            // Safely access nested properties
            treatment_name: (rating.treatments as any)?.global_variables?.name ?? 'Unknown Treatment',
            condition_name: (rating.conditions as any)?.global_variables?.name ?? undefined,
          }));

          logger.info("Fetched user treatments", { userId, count: formattedTreatments.length });
          setUserTreatments(formattedTreatments);
        }
      } catch (error: any) {
        logger.error("Error fetching user treatments", { userId, error: error.message });
        setTreatmentsError("Failed to load your treatments. Please try again.");
      } finally {
        setIsLoadingTreatments(false);
      }
    };

    fetchUserTreatments();
  }, [userId]);


  const handleSelectTreatmentForSearch = (treatment: { id: string; name: string }) => {
    setSelectedTreatmentForSearch(treatment)
    // TODO: Maybe show details in the search tab when selected?
    console.log("Selected treatment in search:", treatment)
  }

  const openRatingDialog = (treatment: UserTreatment) => {
    setSelectedTreatmentForDialog(treatment);
    // setIsRatingDialogOpen(true); // Uncomment when dialog is created
    alert(`Rating dialog for ${treatment.treatment_name} (ID: ${treatment.treatment_id}) - Coming Soon!`);
  }

  const openSideEffectsDialog = (treatment: UserTreatment) => {
    setSelectedTreatmentForDialog(treatment);
    // setIsSideEffectsDialogOpen(true); // Uncomment when dialog is created
    alert(`Side Effects dialog for ${treatment.treatment_name} (ID: ${treatment.treatment_id}) - Coming Soon!`);
  }

  const openReminderDialog = (treatment: UserTreatment) => {
    setSelectedTreatmentForDialog(treatment);
    // setIsReminderDialogOpen(true); // Uncomment when dialog is created
    alert(`Reminder dialog for ${treatment.treatment_name} (ID: ${treatment.treatment_id}) - Coming Soon! DB schema needs update.`);
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
                    <p className="text-muted-foreground mb-4">No treatments added yet.</p>
                    <AddTreatmentDialog userId={userId} conditions={initialConditions || []} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userTreatments.map((treatment) => (
                      <Card key={treatment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                        <div className='flex-grow'>
                          <h4 className="font-semibold">{treatment.treatment_name}</h4>
                          {treatment.condition_name && (
                            <p className="text-sm text-muted-foreground">
                              For: {treatment.condition_name}
                            </p>
                          )}
                           {treatment.effectiveness_out_of_ten !== null && (
                             <p className="text-sm text-muted-foreground">
                               Your Rating: {treatment.effectiveness_out_of_ten}/10
                             </p>
                           )}
                           {treatment.review && (
                             <p className="text-sm text-muted-foreground mt-1 italic">
                               Review: "{treatment.review}"
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
              {initialConditions && initialConditions.length > 0 ? (
                <ConditionsList conditions={initialConditions} />
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

      {/* Placeholder for Dialogs - Implement these components next */}
      {/* {isRatingDialogOpen && <TreatmentRatingDialog treatment={selectedTreatmentForDialog} onClose={() => setIsRatingDialogOpen(false)} />} */}
      {/* {isSideEffectsDialogOpen && <SideEffectsDialog treatment={selectedTreatmentForDialog} onClose={() => setIsSideEffectsDialogOpen(false)} />} */}
      {/* {isReminderDialogOpen && <ReminderDialog treatment={selectedTreatmentForDialog} onClose={() => setIsReminderDialogOpen(false)} />} */}
    </>
  )
} 