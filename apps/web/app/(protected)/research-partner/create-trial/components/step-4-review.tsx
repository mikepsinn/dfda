"use client"

import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Step4Props {
  prevStep: () => void
}

export function Step4Review({ prevStep }: Step4Props) {
  return (
    <>
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>Review your trial details before submitting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Trial Details</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <span className="text-sm font-medium">Trial Name:</span>
              <p className="text-sm text-muted-foreground">Efficacy of Treatment X for Condition Y</p>
            </div>
            <div>
              <span className="text-sm font-medium">Trial Type:</span>
              <p className="text-sm text-muted-foreground">Interventional</p>
            </div>
            <div>
              <span className="text-sm font-medium">Trial Phase:</span>
              <p className="text-sm text-muted-foreground">Phase 2</p>
            </div>
            <div>
              <span className="text-sm font-medium">Target Condition:</span>
              <p className="text-sm text-muted-foreground">Type 2 Diabetes</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Insurance</h3>
          <div className="mt-2">
            <div>
              <span className="text-sm font-medium">Selected Provider:</span>
              <p className="text-sm text-muted-foreground">SafeTrial Insurance</p>
            </div>
            <div>
              <span className="text-sm font-medium">Coverage:</span>
              <p className="text-sm text-muted-foreground">$2M per subject</p>
            </div>
            <div>
              <span className="text-sm font-medium">Cost:</span>
              <p className="text-sm text-muted-foreground">$120 per subject</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Trial Parameters</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <span className="text-sm font-medium">Patient Price:</span>
              <p className="text-sm text-muted-foreground">$250 per patient</p>
            </div>
            <div>
              <span className="text-sm font-medium">Refundable Deposit:</span>
              <p className="text-sm text-muted-foreground">$100</p>
            </div>
            <div>
              <span className="text-sm font-medium">Data Requirements:</span>
              <p className="text-sm text-muted-foreground">
                Demographics, Medical History, Symptom Tracking, Side Effects
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-dashed p-4 bg-muted/50">
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 text-muted-foreground" />
            <div>
              <h4 className="font-medium">Next Steps</h4>
              <p className="text-sm text-muted-foreground">
                After submission, your trial will be reviewed for compliance with The Decentralized FDA standards. Once
                approved, it will be listed in the marketplace for patient enrollment.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button>Submit Trial</Button>
      </CardFooter>
    </>
  )
}

