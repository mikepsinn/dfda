"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createPatientConditionAction } from "@/app/actions/patient-conditions"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { ConditionSearch } from "@/components/ConditionSearch"

interface AddConditionDialogProps {
  userId: string
}

export function AddConditionDialog({ userId }: AddConditionDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleSelectCondition = async (condition: { id: string; name: string }) => {
    try {
      await createPatientConditionAction({
        patient_id: userId,
        condition_id: condition.id,
        diagnosed_at: new Date().toISOString(),
        status: "active",
        notes: null
      })

      toast({
        title: "Condition added",
        description: `${condition.name} has been added to your conditions.`
      })

      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add condition. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Condition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Condition</DialogTitle>
          <DialogDescription>
            Add a condition to track its treatments and progress.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ConditionSearch
            onSelect={handleSelectCondition}
            selected={null}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 