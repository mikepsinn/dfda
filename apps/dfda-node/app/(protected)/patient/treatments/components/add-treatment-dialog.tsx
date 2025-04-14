"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { TreatmentSearch } from "@/components/treatment-search"
import { createLogger } from "@/lib/logger"
import { addSinglePatientTreatmentAction } from "@/app/actions/patientTreatments"

const logger = createLogger("add-treatment-dialog")

interface AddTreatmentDialogProps {
  userId: string
  onSuccess?: () => void;
}

export function AddTreatmentDialog({ userId, onSuccess }: AddTreatmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<{ id: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info("handleSubmit called", { 
        userId,
        selectedTreatment,
    });

    if (!selectedTreatment) {
        logger.warn("handleSubmit aborted: No treatment selected");
        toast({ title: "Missing Treatment", description: "Please select a treatment.", variant: "destructive" });
        return;
    }

    setIsLoading(true);

    try {
      logger.info("Calling addSinglePatientTreatmentAction...", { userId, treatmentId: selectedTreatment.id });
      
      const result = await addSinglePatientTreatmentAction({ 
         patient_id: userId, 
         treatment_id: selectedTreatment.id 
      });

      if (!result.success || !result.data?.id) { 
         throw new Error(result.error || "Failed to save treatment record"); 
      }
      const newPatientTreatmentId = result.data.id; 
      logger.info("Successfully added patient treatment record via action", { newPatientTreatmentId });

      toast({ title: "Treatment Added", description: `${selectedTreatment.name} added successfully.` });

      if (onSuccess) {
        onSuccess();
      }
      
      handleOpenChange(false);

    } catch (error: any) {
      logger.error("Error in handleSubmit", { 
        error: error?.message ?? String(error),
        userId, 
        treatmentId: selectedTreatment?.id, 
      })
      
      toast({
        title: "Error",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      logger.info("Dialog closed, resetting state");
      setSelectedTreatment(null)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Treatment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Treatment to Track</DialogTitle>
          <DialogDescription>
            Select a treatment to add it to your tracked list. You can rate it later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="treatment">Treatment <span className="text-red-500">*</span></Label>
              <TreatmentSearch
                onSelect={(treatment) => setSelectedTreatment(treatment)}
                selected={selectedTreatment}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={
                !selectedTreatment || 
                isLoading
              }
            >
              {isLoading ? "Adding..." : "Add Treatment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 