import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { ConditionSearchInput } from "@/components/ConditionSearchInput" // Assuming this is the correct component
import { createLogger } from "@/lib/logger"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { addInitialPatientConditionsAction } from "@/app/actions/patient-conditions"
import { createDefaultReminderAction } from "@/app/actions/reminder-schedules"
import { useRouter } from 'next/navigation'
import { useState } from "react"

const logger = createLogger("patient-onboarding-page")

// We'll need a client component to manage state
function OnboardingClientContent({ userId }: { userId: string }) {
  "use client"

  const [selectedConditions, setSelectedConditions] = useState< { id: string; name: string }[] >([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()

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

      // Attempt to create default reminders (fire-and-forget, log errors)
      logger.info("Attempting to create default condition reminders", { userId });
      for (const condition of selectedConditions) {
          createDefaultReminderAction(userId, condition.id, condition.name, 'condition')
            .then(reminderResult => {
                if (!reminderResult.success) {
                   logger.warn('Failed to create default reminder for condition', { userId, conditionId: condition.id, error: reminderResult.error });
                }
             })
             .catch(err => { 
                logger.error('Error calling createDefaultReminderAction for condition', { userId, conditionId: condition.id, err });
             });
      }

      logger.info("Navigating to treatment step", { userId });
      router.push('/patient/onboarding/treatments');

    } catch (error) {
      logger.error("Failed to submit initial conditions", { userId, error });
      // Use toast for better user experience
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
            {/* Note: ConditionSearchInput expects onSelect and selected props */}
            {/* We might need to adapt ConditionSearchInput or how we use it */}
            {/* For now, we just use onSelect to add to our list */}
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


export default async function PatientOnboardingPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // TODO: Add logic here to check if user has already completed onboarding
  // If completed, redirect to /patient dashboard
  // const isOnboardingComplete = await checkOnboardingStatus(user.id);
  // if (isOnboardingComplete) redirect("/patient");

  logger.info("Rendering patient onboarding page", { userId: user.id });

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Suspense fallback={<p>Loading onboarding...</p>}>
         <OnboardingClientContent userId={user.id} />
      </Suspense>
    </div>
  )
} 