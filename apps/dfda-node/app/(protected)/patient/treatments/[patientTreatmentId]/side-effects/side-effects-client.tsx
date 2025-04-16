'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"

type SideEffect = {
  id: string
  description: string
  severity_out_of_ten: number | null
}

interface SideEffectsClientProps {
  patientTreatmentId: string
  treatmentName: string
  initialSideEffects: SideEffect[]
}

export function SideEffectsClient({ 
  patientTreatmentId, 
  treatmentName, 
  initialSideEffects = [] 
}: SideEffectsClientProps) {
  const [sideEffects, setSideEffects] = useState<SideEffect[]>(initialSideEffects)
  const [newDescription, setNewDescription] = useState('')
  const [newSeverity, setNewSeverity] = useState<number>(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleAddSideEffect = async () => {
    if (!newDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a description of the side effect.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Note: Implement the actual API call to add side effect
      // This is a placeholder for now
      const mockResponse = {
        id: `temp-${Date.now()}`,
        description: newDescription,
        severity_out_of_ten: newSeverity
      }

      setSideEffects([...sideEffects, mockResponse])
      setNewDescription('')
      setNewSeverity(5)
      
      toast({
        title: "Side Effect Added",
        description: "Your side effect has been recorded successfully."
      })
      
      // Close dialog will happen via DialogClose component
    } catch (error) {
      logger.error("Failed to add side effect", { error, patientTreatmentId })
      toast({
        title: "Error",
        description: "Failed to add side effect. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {sideEffects.length > 0 ? (
        <ul className="space-y-3">
          {sideEffects.map(effect => (
            <li key={effect.id} className="border p-3 rounded-md bg-muted/50 flex justify-between items-start">
              <p className="text-sm flex-grow mr-4">{effect.description}</p>
              {effect.severity_out_of_ten !== null && (
                <Badge variant="secondary">Severity: {effect.severity_out_of_ten}/10</Badge>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-center py-4">No side effects recorded yet.</p>
      )}
      
      <div className="pt-4 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Side Effect
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Side Effect</DialogTitle>
              <DialogDescription>
                Record any side effects you experience from {treatmentName}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the side effect you experienced..." 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="severity">Severity (1-10)</Label>
                <div className="flex items-center space-x-2">
                  <Slider 
                    id="severity"
                    min={1} 
                    max={10} 
                    step={1}
                    value={[newSeverity]}
                    onValueChange={(values) => setNewSeverity(values[0])} 
                  />
                  <span className="w-8 text-center">{newSeverity}</span>
                </div>
                <p className="text-xs text-muted-foreground">1 = Very Mild, 10 = Severe</p>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddSideEffect}
                disabled={isSubmitting || !newDescription.trim()}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 