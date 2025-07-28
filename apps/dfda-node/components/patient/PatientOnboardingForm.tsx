"use client"

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { createLogger } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConditionSearchInput } from "@/components/ConditionSearchInput"; 
import { addInitialPatientConditionsAction } from "@/lib/actions/patient-conditions";
// TODO: Add toast import if needed e.g. import { useToast } from "@/components/ui/use-toast";

const logger = createLogger("patient-onboarding-form");

interface PatientOnboardingFormProps {
  userId: string;
}

export function PatientOnboardingForm({ userId }: PatientOnboardingFormProps) {
  const [selectedConditions, setSelectedConditions] = useState< { id: string; name: string }[] >([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const { toast } = useToast(); // Uncomment if using toast

  const handleConditionSelect = (condition: { id: string; name: string }) => {
     // Avoid adding duplicates
     if (!selectedConditions.some(c => c.id === condition.id)) {
         setSelectedConditions(prev => [...prev, condition]);
     }
  };

  const handleRemoveCondition = (conditionId: string) => {
     setSelectedConditions(prev => prev.filter(c => c.id !== conditionId));
  }

  const handleNext = async () => {
    setIsLoading(true);
    logger.info("Submitting initial conditions", { userId, count: selectedConditions.length });
    try {
      // Save conditions
      const result = await addInitialPatientConditionsAction(userId, selectedConditions);
      if (!result.success) {
        throw new Error(result.error || "Server action failed");
      }
      logger.info("Initial conditions saved", { userId });

      logger.info("Navigating to treatment step", { userId });
      router.push('/patient/onboarding/treatments');

    } catch (error) {
      logger.error("Failed to submit initial conditions", { userId, error });
      // TODO: Replace alert with toast notification
      // toast({
      //   title: "Error Submitting Conditions",
      //   description: error instanceof Error ? error.message : String(error),
      //   variant: "destructive",
      // });
      alert(`Error submitting conditions: ${error instanceof Error ? error.message : String(error)}. Please try again.`); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <Card>
        <CardHeader>
          <CardTitle>Your Health Conditions</CardTitle>
          <CardDescription>Start by telling us which health conditions you are managing or tracking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Search and add conditions:</label>
             <ConditionSearchInput onSelect={handleConditionSelect} selected={null} />
          </div>

          {selectedConditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Conditions:</h4>
              <ul className="list-disc space-y-1 pl-5">
                {selectedConditions.map(c => (
                  <li key={c.id} className="flex items-center justify-between">
                    <span>{c.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveCondition(c.id)}>&times;</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
             <Button 
               onClick={handleNext}
               disabled={selectedConditions.length === 0 || isLoading}
             >
               {isLoading ? "Saving..." : "Next: Add Treatments"}
             </Button>
          </div>
        </CardContent>
      </Card>
  )
} 