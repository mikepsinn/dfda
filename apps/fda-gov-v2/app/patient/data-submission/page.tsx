"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Check, ChevronRight, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

export default function DataSubmission() {
  const [submissionComplete, setSubmissionComplete] = useState(false)

  // Mock data for a patient's trial participation
  const trialData = {
    id: 1,
    name: "Efficacy of Treatment A for Type 2 Diabetes",
    sponsor: "Innovative Therapeutics Inc.",
    currentMilestone: "4-week follow-up",
    dueDate: "Mar 15, 2025",
    refundAmount: 25,
    progress: 33,
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmissionComplete(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/patient/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Submit Trial Data</h1>
            </div>

            {!submissionComplete ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>{trialData.name}</CardTitle>
                      <CardDescription>
                        {trialData.currentMilestone} - Due {trialData.dueDate}
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
                          <Input id="blood-glucose" type="number" required />
                        </div>

                        <div className="space-y-2">
                          <Label>Have you experienced any hypoglycemic episodes?</Label>
                          <RadioGroup defaultValue="no">
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
                          <RadioGroup defaultValue="3">
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
                          <RadioGroup defaultValue="always">
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
                          <Textarea id="missed-doses" placeholder="E.g., forgot, side effects, etc." />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Lab Results</h3>

                        <div className="space-y-2">
                          <Label htmlFor="hba1c">HbA1c (%)</Label>
                          <Input id="hba1c" type="number" step="0.1" />
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
                              Your next data submission (8-week follow-up) will be due on April 15, 2025. You'll receive
                              a reminder email one week before the due date.
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
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Submission Complete</CardTitle>
                  <CardDescription>Thank you for submitting your 4-week follow-up data</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full bg-green-100 p-3 mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Data Submitted Successfully</h3>
                  <p className="text-center text-muted-foreground mb-6 max-w-md">
                    Your 4-week follow-up data has been successfully submitted. Your deposit refund of $
                    {trialData.refundAmount} will be processed within 3 business days.
                  </p>

                  <div className="w-full max-w-md rounded-lg border p-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Updated Trial Progress</span>
                        <span>{trialData.progress + 33}% complete</span>
                      </div>
                      <Progress value={trialData.progress + 33} className="h-2" />
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Next milestone: 8-week follow-up (Due April 15, 2025)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                  <Link href="/patient/dashboard">
                    <Button>Return to Dashboard</Button>
                  </Link>
                  <Link href={`/patient/trial-details/${trialData.id}`}>
                    <Button variant="outline">
                      View Trial Details
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

