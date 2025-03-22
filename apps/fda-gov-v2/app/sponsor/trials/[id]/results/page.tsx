"use client"
import Link from "next/link"
import { ArrowLeft, BarChart, Download, FileText, LineChart, PieChart, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TrialResultsParams {
  params: {
    id: string
  }
}

export default function TrialResults({ params }: TrialResultsParams) {
  const trialId = params.id

  // Mock trial data
  const trialData = {
    id: trialId,
    name: "Efficacy of Treatment A for Type 2 Diabetes",
    sponsor: "Innovative Therapeutics Inc.",
    status: "Active",
    startDate: "Jan 15, 2025",
    endDate: "Jul 15, 2025",
    participants: {
      total: 342,
      active: 325,
      withdrawn: 17,
      completedFollowUp: 298,
    },
    demographics: {
      gender: { male: 45, female: 55 },
      ageGroups: { "18-30": 15, "31-45": 35, "46-60": 30, "61+": 20 },
      ethnicity: {
        White: 60,
        Black: 15,
        Hispanic: 12,
        Asian: 8,
        Other: 5,
      },
    },
    efficacy: {
      primaryEndpoint: {
        name: "HbA1c Reduction",
        treatmentGroup: -1.8,
        controlGroup: -0.4,
        pValue: 0.001,
      },
      secondaryEndpoints: [
        {
          name: "Fasting Plasma Glucose",
          treatmentGroup: -38,
          controlGroup: -12,
          pValue: 0.003,
          unit: "mg/dL",
        },
        {
          name: "Weight Change",
          treatmentGroup: -2.1,
          controlGroup: +0.3,
          pValue: 0.01,
          unit: "kg",
        },
      ],
    },
    safety: {
      adverseEvents: [
        { name: "Nausea", treatment: 18, control: 5 },
        { name: "Headache", treatment: 12, control: 10 },
        { name: "Dizziness", treatment: 8, control: 4 },
        { name: "Fatigue", treatment: 7, control: 6 },
      ],
      seriousEvents: [
        { name: "Hypoglycemia", treatment: 2, control: 0 },
        { name: "Allergic Reaction", treatment: 1, control: 0 },
      ],
    },
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href={`/sponsor/trials/${trialId}`} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to trial</span>
              </Link>
              <h1 className="text-2xl font-bold">Trial Results & Analytics</h1>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>{trialData.name}</CardTitle>
                    <CardDescription>
                      {trialData.startDate} - {trialData.endDate}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-sm text-muted-foreground">Total Participants</div>
                    <div className="text-2xl font-bold">{trialData.participants.total}</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-sm text-muted-foreground">Active Participants</div>
                    <div className="text-2xl font-bold">{trialData.participants.active}</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-sm text-muted-foreground">Withdrawn</div>
                    <div className="text-2xl font-bold">{trialData.participants.withdrawn}</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-sm text-muted-foreground">Data Completion</div>
                    <div className="text-2xl font-bold">
                      {Math.round((trialData.participants.completedFollowUp / trialData.participants.total) * 100)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="efficacy" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="efficacy">Efficacy</TabsTrigger>
                <TabsTrigger value="safety">Safety</TabsTrigger>
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
              </TabsList>

              <TabsContent value="efficacy" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Primary Endpoint</CardTitle>
                    <CardDescription>{trialData.efficacy.primaryEndpoint.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Primary Endpoint Results</h3>
                        <div className="mt-4 grid grid-cols-2 gap-8 max-w-md mx-auto">
                          <div className="rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">Treatment Group</div>
                            <div className="text-2xl font-bold text-primary">
                              {trialData.efficacy.primaryEndpoint.treatmentGroup > 0 ? "+" : ""}
                              {trialData.efficacy.primaryEndpoint.treatmentGroup}%
                            </div>
                          </div>
                          <div className="rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">Control Group</div>
                            <div className="text-2xl font-bold">
                              {trialData.efficacy.primaryEndpoint.controlGroup > 0 ? "+" : ""}
                              {trialData.efficacy.primaryEndpoint.controlGroup}%
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-sm">
                          <span className="font-medium">p-value:</span> {trialData.efficacy.primaryEndpoint.pValue}
                          <span className="ml-2 text-green-600 font-medium">(Statistically Significant)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Secondary Endpoints</CardTitle>
                    <CardDescription>Additional efficacy measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {trialData.efficacy.secondaryEndpoints.map((endpoint, index) => (
                        <div key={index} className="rounded-lg border p-4">
                          <h3 className="font-medium mb-4">{endpoint.name}</h3>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="rounded-lg bg-muted p-3 text-center">
                              <div className="text-sm text-muted-foreground">Treatment Group</div>
                              <div className="text-xl font-bold text-primary">
                                {endpoint.treatmentGroup > 0 ? "+" : ""}
                                {endpoint.treatmentGroup} {endpoint.unit}
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted p-3 text-center">
                              <div className="text-sm text-muted-foreground">Control Group</div>
                              <div className="text-xl font-bold">
                                {endpoint.controlGroup > 0 ? "+" : ""}
                                {endpoint.controlGroup} {endpoint.unit}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">p-value:</span> {endpoint.pValue}
                            {endpoint.pValue < 0.05 && (
                              <span className="ml-2 text-green-600 font-medium">(Statistically Significant)</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="safety" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Adverse Events</CardTitle>
                    <CardDescription>Reported side effects and adverse events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Adverse Events Comparison</h3>
                        <div className="mt-6 space-y-4 max-w-2xl mx-auto">
                          {trialData.safety.adverseEvents.map((event, index) => (
                            <div key={index} className="grid grid-cols-3 items-center gap-4">
                              <div className="text-sm font-medium text-right">{event.name}</div>
                              <div className="col-span-2 flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-primary h-2.5 rounded-full"
                                    style={{ width: `${(event.treatment / 100) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm">{event.treatment}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Serious Adverse Events</CardTitle>
                    <CardDescription>Serious adverse events reported during the trial</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trialData.safety.seriousEvents.length > 0 ? (
                        trialData.safety.seriousEvents.map((event, index) => (
                          <div key={index} className="rounded-lg border p-4">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium">{event.name}</h3>
                              <div className="flex gap-4">
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Treatment Group</div>
                                  <div className="font-bold">{event.treatment} cases</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Control Group</div>
                                  <div className="font-bold">{event.control} cases</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No serious adverse events reported</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="demographics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Participant Demographics</CardTitle>
                    <CardDescription>Demographic breakdown of trial participants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-4">Gender Distribution</h3>
                        <div className="h-[200px] flex items-center justify-center">
                          <PieChart className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-sm text-muted-foreground">Male</div>
                            <div className="font-bold">{trialData.demographics.gender.male}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Female</div>
                            <div className="font-bold">{trialData.demographics.gender.female}%</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-4">Age Distribution</h3>
                        <div className="h-[200px] flex items-center justify-center">
                          <BarChart className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                          {Object.entries(trialData.demographics.ageGroups).map(([range, percentage]) => (
                            <div key={range}>
                              <div className="text-sm text-muted-foreground">{range}</div>
                              <div className="font-bold">{percentage}%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border p-4 md:col-span-2">
                        <h3 className="font-medium mb-4">Ethnicity Distribution</h3>
                        <div className="h-[200px] flex items-center justify-center">
                          <BarChart className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="mt-4 grid grid-cols-5 gap-2 text-center">
                          {Object.entries(trialData.demographics.ethnicity).map(([group, percentage]) => (
                            <div key={group}>
                              <div className="text-sm text-muted-foreground">{group}</div>
                              <div className="font-bold">{percentage}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Participant Engagement</CardTitle>
                    <CardDescription>Metrics on participant engagement and retention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-4">Data Completion Rate</h3>
                        <div className="h-[200px] flex items-center justify-center">
                          <LineChart className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="mt-4 text-center">
                          <div className="text-sm text-muted-foreground">Overall Completion Rate</div>
                          <div className="text-2xl font-bold text-primary">87%</div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-4">Retention Rate</h3>
                        <div className="h-[200px] flex items-center justify-center">
                          <Users className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="mt-4 text-center">
                          <div className="text-sm text-muted-foreground">Participant Retention</div>
                          <div className="text-2xl font-bold text-primary">95%</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {trialData.participants.withdrawn} withdrawals out of {trialData.participants.total}{" "}
                            participants
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4 md:col-span-2">
                        <h3 className="font-medium mb-4">Follow-up Completion by Milestone</h3>
                        <div className="h-[200px] flex items-center justify-center">
                          <BarChart className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-sm text-muted-foreground">Baseline</div>
                            <div className="font-bold">100%</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">4-Week</div>
                            <div className="font-bold">92%</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">8-Week</div>
                            <div className="font-bold">87%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

