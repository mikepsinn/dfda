"use client"

import { useState } from "react";
import { useRouter } from 'next/navigation'; 
import { createLogger } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TreatmentSearch } from "@/components/treatment-search";
import { addInitialPatientTreatmentsAction } from "@/lib/actions/patient-treatments";
import { useToast } from "@/components/ui/use-toast";

const logger = createLogger("patient-onboarding-treatments-form");

// Simplified interface for selected treatments
interface SelectedTreatment {
  treatmentId: string;
  treatmentName: string;
}

interface PatientOnboardingTreatmentsFormProps {
  userId: string;
  // Removed conditions prop
}

export function PatientOnboardingTreatmentsForm({ userId }: PatientOnboardingTreatmentsFormProps) {
  
  // Simplified state: just a list of selected treatments
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // When a treatment is selected from the search input
  const handleTreatmentSelect = (treatment: { id: string; name: string }) => {
     logger.info('Treatment selected', { treatmentId: treatment.id });
     // Avoid adding duplicates
     if (!selectedTreatments.some(t => t.treatmentId === treatment.id)) {
         setSelectedTreatments(prev => [...prev, { treatmentId: treatment.id, treatmentName: treatment.name }]);
     }
  };

  const handleRemoveTreatment = (treatmentId: string) => {
     setSelectedTreatments(prev => prev.filter(t => t.treatmentId !== treatmentId));
  };

  const handleNext = async () => {
    setIsLoading(true);
    logger.info("Submitting initial treatments", { userId, count: selectedTreatments.length });
    try {
       // Call the server action with the simplified list
       const result = await addInitialPatientTreatmentsAction(userId, selectedTreatments);
       
       if (!result.success) {
         throw new Error(result.error || "Server action failed");
       }
       logger.info('Initial treatments saved', { userId });

       logger.info('Navigating to dashboard after treatment submission', { userId });
       // Navigate to dashboard after saving
       toast({ title: "Success", description: "Treatments saved! Onboarding complete." });
       router.push('/patient');
    } catch (error) {
      logger.error("Failed to save treatments", { userId, error });
      toast({ variant: "destructive", title: "Error", description: "Failed to save treatments. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Treatments</CardTitle>
        <CardDescription>Add the treatments, medications, or supplements you are currently taking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-1 block text-sm font-medium">Search and add treatments:</Label>
          <TreatmentSearch 
             onSelect={handleTreatmentSelect} 
             selected={null} // Reset selection after adding
             />
        </div>

        {selectedTreatments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Selected Treatments:</h4>
            <ul className="list-disc space-y-1 pl-5">
              {selectedTreatments.map(t => (
                <li key={t.treatmentId} className="flex items-center justify-between">
                  <span>{t.treatmentName}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveTreatment(t.treatmentId)}>&times;</Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleNext} disabled={isLoading || selectedTreatments.length === 0}>
              {isLoading ? "Saving..." : "Finish Onboarding"}
           </Button>
        </div>
      </CardContent>
    </Card>
  )
} 