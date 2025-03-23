"use client"

import Link from "next/link"
import { ArrowLeft, Calendar, Check, MapPin, Shield, Star, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TrialDetailsParams {
  params: {
    id: string
  }
}

export default function TrialDetails({ params }: TrialDetailsParams) {
  const trialId = params.id

  // Mock trial data
  const trial = {
    id: trialId,
    name: "Efficacy of Treatment A for Rheumatoid Arthritis",
    sponsor: "Innovative Therapeutics Inc.",
    phase: "Phase 2",
    status: "Recruiting",
    participants: {
      target: 500,
      enrolled: 342,
      progress: 68,
    },
    location: "Decentralized (Remote)",
    duration: "12 weeks",
    description:
      "This trial evaluates the efficacy and safety of Treatment A in adults with moderate to severe rheumatoid arthritis who have had an inadequate response to conventional therapies.",
    eligibility: [
      "Adults aged 18-75 years",
      "Diagnosed with rheumatoid arthritis for at least 6 months",
      "Inadequate response to at least one conventional therapy",
      "No participation in other clinical trials within the past 30 days",
    ],
    requirements: [
      "Complete baseline questionnaires and lab tests",
      "Take study medication as directed",
      "Complete weekly symptom tracking",
      "Participate in virtual check-ins at weeks 4, 8, and 12",
      "Complete final assessment at week 12",
    ],
    compensation: {
      price: 0,
      deposit: 100,
      refundSchedule: [
        { milestone: "4-week follow-up", amount: 25 },
        { milestone: "8-week follow-up", amount: 25 },
        { milestone: "12-week completion", amount: 50 },
      ],
    },
    rating: 4.7,
    reviews: 86,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/patient/find-trials" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to search</span>
              </Link>
              <h1 className="text-2xl font-bold">Trial Details</h1>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{trial.name}</CardTitle>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {trial.status}
                        </span>
                      </div>
                      <CardDescription>
                        Sponsored by {trial.sponsor} • {trial.phase}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{trial.rating}</span>
                      <span className="text-sm text-muted-foreground">({trial.reviews} reviews)</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-sm text-muted-foreground">{trial.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Duration</div>
                        <div className="text-sm text-muted-foreground">{trial.duration}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Enrollment</div>
                        <div className="flex items-center gap-2">
                          <Progress value={trial.participants.progress} className="h-2 w-20" />
                          <span className="text-xs text-muted-foreground">
                            {trial.participants.enrolled}/{trial.participants.target}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="mt-1 text-sm">{trial.description}</p>
                  </div>

                  <Tabs defaultValue="eligibility">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                      <TabsTrigger value="requirements">Requirements</TabsTrigger>
                      <TabsTrigger value="compensation">Compensation</TabsTrigger>
                    </TabsList>
                    <TabsContent value="eligibility" className="space-y-2 pt-4">
                      <ul className="space-y-1">
                        {trial.eligibility.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="requirements" className="space-y-2 pt-4">
                      <ul className="space-y-1">
                        {trial.requirements.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="compensation" className="space-y-2 pt-4">
                      <div className="rounded-lg border p-4">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <div className="text-sm font-medium">Participation Cost</div>
                            <div className="text-lg font-bold">${trial.compensation.price}</div>
                            <div className="text-xs text-muted-foreground">This trial is free to join</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Refundable Deposit</div>
                            <div className="text-lg font-bold">${trial.compensation.deposit}</div>
                            <div className="text-xs text-muted-foreground">Returned upon completion of follow-ups</div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div>
                          <div className="text-sm font-medium">Refund Schedule</div>
                          <ul className="mt-2 space-y-2">
                            {trial.compensation.refundSchedule.map((item, i) => (
                              <li key={i} className="flex items-center justify-between text-sm">
                                <span>{item.milestone}</span>
                                <span className="font-medium">${item.amount}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="rounded-lg border p-4 bg-primary/5">
                    <div className="flex items-start gap-4">
                      <Shield className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <h4 className="font-medium">Patient Benefits & Protection</h4>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Comprehensive Insurance:</strong> $2M liability coverage per participant,
                              exceeding industry standards.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Data Privacy:</strong> HIPAA-compliant anonymized data with advanced encryption.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Personalized Insights:</strong> Receive n-of-1 studies showing how treatments
                              affect your specific health patterns.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Refundable Deposits:</strong> Earn back your deposit by completing follow-ups,
                              incentivizing better data collection.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/patient/trial-payment/${trialId}`} className="w-full">
                    <Button className="w-full">Join This Trial</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

