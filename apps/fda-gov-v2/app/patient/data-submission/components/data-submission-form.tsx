"use client"

import type React from "react"
import type { Database } from "@/lib/database.types"

import { useState } from "react"
import { Calendar, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { SubmissionComplete } from "./submission-complete"
import { createBrowserClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"

type Trial = Database["public"]["Tables"]["trials"]["Row"]
type DataSubmissionInsert = Database["public"]["Tables"]["data_submissions"]["Insert"]
type DataSubmission = Database["public"]["Tables"]["data_submissions"]["Row"]

export interface TrialSubmissionData {
  trial: Trial
  submission: DataSubmission | null
  currentMilestone: string
  refundAmount: number
  progress: number
}

export function DataSubmissionForm({ trialData }: { trialData: TrialSubmissionData }) {
  const [submissionComplete, setSubmissionComplete] = useState(false)
  const supabase = createBrowserClient()

  if (!trialData.submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{trialData.trial.title}</CardTitle>
          <CardDescription>No submission data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      logger.error("No user found during data submission")
      return
    }

    // Extract form values
    const bloodGlucose = formData.get("blood-glucose") as string
    const hypoglycemia = formData.get("hypoglycemia") as string
    const energyLevel = formData.get("energy") as string
    const sideEffects = formData.get("side-effects") as string
    const adherence = formData.get("adherence") as string
    const missedDoses = formData.get("missed-doses") as string
    const hba1c = formData.get("hba1c") as string
    const comments = formData.get("comments") as string

    const submission: DataSubmissionInsert = {
      enrollment_id: trialData.submission.enrollment_id,
      patient_id: user.id,
      data: {
        blood_glucose: Number.parseFloat(bloodGlucose),
        hypoglycemic_episodes: hypoglycemia === "yes",
        energy_level: Number.parseInt(energyLevel),
        side_effects: sideEffects,
        medication_adherence: adherence,
        missed_doses_reason: missedDoses,
        hba1c: hba1c ? Number.parseFloat(hba1c) : null,
        additional_comments: comments,
        milestone: trialData.currentMilestone,
      },
      submission_date: new Date().toISOString(),
      status: "pending_review"
    }

    // Submit data to database
    const { error } = await supabase.from("data_submissions").insert(submission)

    if (!error) {
      // Update the enrollment to mark data submission as complete
      await supabase
        .from("trial_enrollments")
        .update({
          updated_at: new Date().toISOString(),
          notes: "Data submission completed"
        })
        .eq("id", trialData.submission.enrollment_id)

      setSubmissionComplete(true)
    } else {
      logger.error("Error submitting trial data:", error)
      // Handle error (could add toast notification here)
    }
  }

  if (submissionComplete) {
    return <SubmissionComplete trialData={trialData} />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{trialData.trial.title}</CardTitle>
            <CardDescription>
              {trialData.currentMilestone} - Due {new Date(trialData.submission.submission_date).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            ${trialData.refundAmount} refund available
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Trial Progress</span>
              <span>{trialData.progress}% complete</span>
            </div>
            <Progress value={trialData.progress} className="h-2" />
          </div>

          <Separator />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Symptom Tracking</h3>

              <div className="space-y-2">
                <Label htmlFor="blood-glucose">Average Blood Glucose Level (mg/dL)</Label>
                <Input id="blood-glucose" name="blood-glucose" type="number" required />
              </div>

              <div className="space-y-2">
                <Label>Have you experienced any hypoglycemic episodes?</Label>
                <RadioGroup defaultValue="no" name="hypoglycemia">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="hypoglycemia-yes" />
                    <Label htmlFor="hypoglycemia-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="hypoglycemia-no" />
                    <Label htmlFor="hypoglycemia-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Rate your energy levels over the past week</Label>
                <RadioGroup defaultValue="3" name="energy">
                  <div className="flex justify-between max-w-md">
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="1" id="energy-1" />
                      <Label htmlFor="energy-1" className="mt-1 text-xs">
                        Very Low
                      </Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="2" id="energy-2" />
                      <Label htmlFor="energy-2" className="mt-1 text-xs">
                        Low
                      </Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="3" id="energy-3" />
                      <Label htmlFor="energy-3" className="mt-1 text-xs">
                        Moderate
                      </Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="4" id="energy-4" />
                      <Label htmlFor="energy-4" className="mt-1 text-xs">
                        High
                      </Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="5" id="energy-5" />
                      <Label htmlFor="energy-5" className="mt-1 text-xs">
                        Very High
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="side-effects">Have you experienced any side effects?</Label>
                <Textarea
                  id="side-effects"
                  name="side-effects"
                  placeholder="Please describe any side effects you've experienced..."
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Medication Adherence</h3>

              <div className="space-y-2">
                <Label>How often did you take the study medication as prescribed?</Label>
                <RadioGroup defaultValue="always" name="adherence">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="always" id="adherence-always" />
                    <Label htmlFor="adherence-always">Always (100%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mostly" id="adherence-mostly" />
                    <Label htmlFor="adherence-mostly">Mostly (75-99%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sometimes" id="adherence-sometimes" />
                    <Label htmlFor="adherence-sometimes">Sometimes (50-74%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rarely" id="adherence-rarely" />
                    <Label htmlFor="adherence-rarely">Rarely (25-49%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never" id="adherence-never" />
                    <Label htmlFor="adherence-never">Never (0-24%)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="missed-doses">If you missed any doses, please explain why:</Label>
                <Textarea id="missed-doses" name="missed-doses" placeholder="E.g., forgot, side effects, etc." />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Lab Results</h3>

              <div className="space-y-2">
                <Label htmlFor="hba1c">HbA1c (%)</Label>
                <Input id="hba1c" name="hba1c" type="number" step="0.1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lab-results">Upload Lab Results (optional)</Label>
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <div className="mx-auto flex max-w-[180px] flex-col items-center justify-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload lab results</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, or PNG files up to 10MB</p>
                    </div>
                    <Button size="sm" variant="outline" className="mt-2">
                      Select File
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Comments</h3>
              <div className="space-y-2">
                <Label htmlFor="comments">Any additional information you'd like to share:</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder="Please share any other observations or feedback..."
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Next Follow-up</h4>
                  <p className="text-sm text-muted-foreground">
                    Your next data submission (8-week follow-up) will be due on April 15, 2025. You'll receive a
                    reminder email one week before the due date.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Submit Data</Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

