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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createPatientConditionAction } from "@/app/actions/patient-conditions"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { ConditionSearch } from "@/components/ConditionSearch"

interface AddConditionDialogProps {
  userId: string
}

export function AddConditionDialog({ userId }: AddConditionDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<{ id: string; name: string } | null>(null)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCondition) return

    setIsLoading(true)
    try {
      await createPatientConditionAction({
        patient_id: userId,
        condition_id: selectedCondition.id,
        diagnosed_at: new Date().toISOString(),
        status: "active",
        notes: notes || null
      })

      toast({
        title: "Condition added",
        description: `${selectedCondition.name} has been added to your conditions.`
      })

      setOpen(false)
      setSelectedCondition(null)
      setNotes("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add condition. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="condition">Condition</Label>
              <ConditionSearch
                onSelect={(condition) => setSelectedCondition(condition)}
                selected={selectedCondition}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about your condition..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!selectedCondition || isLoading}>
              {isLoading ? "Adding..." : "Add Condition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 