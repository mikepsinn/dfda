'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Music, Edit, AlertTriangle } from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from "@/components/ui/data-table"
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddConditionDialog } from "./add-condition-dialog"
import { AddTreatmentDialog } from "./add-treatment-dialog"
import { ConditionsList } from "@/components/conditions-list"
import { TreatmentSearch } from "@/components/treatment-search"
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

export function TreatmentsClient({
  userId,
  initialConditions = [],
  conditionsError,
}: TreatmentsClientProps) {
  const [selectedTreatmentForSearch, setSelectedTreatmentForSearch] = useState<{ id: string; name: string } | null>(null)
  const [userTreatments, setUserTreatments] = useState<PatientTreatmentWithDetails[]>([])
  const [isLoadingTreatments, setIsLoadingTreatments] = useState(true)
  const [treatmentsError, setTreatmentsError] = useState<string | null>(null)
  const [selectedTreatmentForDialog, setSelectedTreatmentForDialog] = useState<PatientTreatmentWithDetails | null>(null)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [isSideEffectsDialogOpen, setIsSideEffectsDialogOpen] = useState(false)

  const fetchUserTreatments = useCallback(async () => {
    setIsLoadingTreatments(true)
    setTreatmentsError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patient_treatments')
        .select(`
          *,
          global_variables ( name ), 
          treatment_ratings ( effectiveness_out_of_ten, review, id )
        `)
        .eq('patient_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        throw error
      }

      const formattedData: PatientTreatmentWithDetails[] = data.map(pt => ({
         ...pt,
         treatment_name: (pt.global_variables as any)?.name ?? 'Unknown Treatment',
         effectiveness_out_of_ten: (pt.treatment_ratings as any)?.[0]?.effectiveness_out_of_ten ?? null,
         review: (pt.treatment_ratings as any)?.[0]?.review ?? null,
         rating_id: (pt.treatment_ratings as any)?.[0]?.id ?? null,
      }));
      
      setUserTreatments(formattedData)
      logger.info("Fetched user treatments successfully", { userId, count: formattedData.length });
    } catch (err) {
      logger.error("Error fetching user treatments:", err)
      setTreatmentsError("Failed to load treatments.")
      setUserTreatments([])
    } finally {
      setIsLoadingTreatments(false)
    }
  }, [userId])
  
  useEffect(() => {
    fetchUserTreatments()
  }, [fetchUserTreatments])

  const handleSelectTreatmentForSearch = (treatment: { id: string; name: string }) => {
    setSelectedTreatmentForSearch(treatment)
    console.log("Selected treatment in search:", treatment)
  }

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

  const columns: ColumnDef<PatientTreatmentWithDetails>[] = [
    {
      accessorKey: "treatment_name",
      header: "Treatment",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <span className="capitalize">{row.getValue("status")}</span>,
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => {
        const date = row.getValue("start_date") as string | null;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const treatment = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => openRatingDialog(treatment)}>
                <Edit className="mr-1 h-4 w-4" /> Rate
            </Button>
            <Button variant="outline" size="sm" onClick={() => openSideEffectsDialog(treatment)}>
                <AlertTriangle className="mr-1 h-4 w-4" /> Effects
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <Tabs defaultValue="treatments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="treatments">My Treatments</TabsTrigger>
          <TabsTrigger value="conditions">My Conditions</TabsTrigger>
          <TabsTrigger value="search">Search Global Treatments</TabsTrigger>
        </TabsList>

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
                    <AddTreatmentDialog userId={userId} conditions={initialConditions || []} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <DataTable columns={columns} data={userTreatments} filterColumnId="treatment_name" filterPlaceholder="Filter treatments..." />
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
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