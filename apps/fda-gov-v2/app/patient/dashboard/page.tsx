"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity, Calendar, ClipboardList, FileText, LineChart, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Mock patient data
  const patientData = {
    name: "Alex Johnson",
    activeTrials: [
      {
        id: 1,
        name: "Treatment A for Rheumatoid Arthritis",
        sponsor: "Innovative Therapeutics Inc.",
        progress: 33,
        nextMilestone: "4-week follow-up",
        dueDate: "Mar 15, 2025",
        refundAmount: 25,
      },
    ],
    completedTrials: [
      {
        id: 2,
        name: "Novel Therapy for Hypertension",
        sponsor: "CardioHealth Research",
        completedDate: "Jan 10, 2025",
        outcome: "Positive response",
      },
    ],
    personalInsights: [
      {
        factor: "Diet",
        insight: "Correlation between dairy consumption and increased joint pain",
        confidence: 78,
      },
      {
        factor: "Sleep",
        insight: "Improved symptom control with 7+ hours of sleep",
        confidence: 85,
      },
      {
        factor: "Medication",
        insight: "Treatment A shows 42% reduction in morning stiffness",
        confidence: 92,
      },
    ],
    upcomingTasks: [
      {
        task: "Complete weekly symptom tracking",
        dueDate: "Feb 28, 2025",
        trial: "Treatment A Trial",
      },
      {
        task: "Virtual check-in with research team",
        dueDate: "Mar 15, 2025",
        trial: "Treatment A Trial",
      },
      {
        task: "Lab test at local facility",
        dueDate: "Mar 20, 2025",
        trial: "Treatment A Trial",
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-muted/40 lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">Patient Dashboard</h2>
              <p className="text-sm text-muted-foreground">Welcome back, {patientData.name}</p>
            </div>
            <nav className="flex-1 p-4">
              <div className="space-y-1">
                <Button
                  variant={activeTab === "overview" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("overview")}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === "trials" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("trials")}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  My Trials
                </Button>
                <Button
                  variant={activeTab === "insights" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("insights")}
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  Personal Insights
                </Button>
                <Button
                  variant={activeTab === "data" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("data")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  My Data
                </Button>
              </div>
            </nav>
            <div className="border-t p-4">
              <Link href="/patient/find-trials">
                <Button variant="outline" className="w-full">
                  Find New Trials
                </Button>
              </Link>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Patient Dashboard</h1>
              <div className="flex items-center gap-2 lg:hidden">
                <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(true)}>
                  <Menu className="h-4 w-4 mr-2" />
                  Menu
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:hidden">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trials">Trials</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Active Trials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{patientData.activeTrials.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {patientData.activeTrials.length === 1 ? "Trial" : "Trials"} in progress
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Completed Trials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{patientData.completedTrials.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Successfully completed {patientData.completedTrials.length === 1 ? "trial" : "trials"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Upcoming Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{patientData.upcomingTasks.length}</div>
                      <p className="text-xs text-muted-foreground">Tasks due in the next 30 days</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Active Trial Progress</CardTitle>
                      <CardDescription>Your current trial participation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {patientData.activeTrials.length > 0 ? (
                        <div className="space-y-4">
                          {patientData.activeTrials.map((trial) => (
                            <div key={trial.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{trial.name}</div>
                                <div className="text-sm text-muted-foreground">{trial.progress}% complete</div>
                              </div>
                              <Progress value={trial.progress} className="h-2" />
                              <div className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="text-muted-foreground">Next milestone: </span>
                                  {trial.nextMilestone}
                                </div>
                                <div className="font-medium">Due {trial.dueDate}</div>
                              </div>
                              <div className="rounded-lg border p-2 bg-muted/50">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">Refund upon completion:</div>
                                  <div className="font-medium">${trial.refundAmount}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border border-dashed">
                          <p className="text-sm text-muted-foreground">No active trials</p>
                          <Link href="/patient/find-trials" className="mt-2">
                            <Button variant="outline" size="sm">
                              Find Trials
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Upcoming Tasks</CardTitle>
                      <CardDescription>Tasks due in the next 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {patientData.upcomingTasks.map((task, index) => (
                          <div key={index} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                            <div className="flex items-start gap-3">
                              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{task.task}</div>
                                <div className="text-xs text-muted-foreground">{task.trial}</div>
                              </div>
                            </div>
                            <div className="text-sm font-medium">Due {task.dueDate}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View All Tasks
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Personal Insights</CardTitle>
                    <CardDescription>N-of-1 studies based on your data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patientData.personalInsights.map((insight, index) => (
                        <div key={index} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{insight.factor}</div>
                              <p className="text-sm">{insight.insight}</p>
                            </div>
                            <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {insight.confidence}% confidence
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Detailed Analysis
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="trials" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>My Clinical Trials</CardTitle>
                    <CardDescription>Manage your trial participation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-lg font-medium">Active Trials</h3>
                      {patientData.activeTrials.length > 0 ? (
                        <div className="space-y-4">
                          {patientData.activeTrials.map((trial) => (
                            <div key={trial.id} className="rounded-lg border p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{trial.name}</div>
                                  <p className="text-sm text-muted-foreground">Sponsored by {trial.sponsor}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </div>
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Progress</span>
                                  <span>{trial.progress}%</span>
                                </div>
                                <Progress value={trial.progress} className="h-2" />
                              </div>
                              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                <div className="rounded-lg bg-muted p-2 text-center">
                                  <div className="text-xs text-muted-foreground">Next Milestone</div>
                                  <div className="font-medium">{trial.nextMilestone}</div>
                                </div>
                                <div className="rounded-lg bg-muted p-2 text-center">
                                  <div className="text-xs text-muted-foreground">Due Date</div>
                                  <div className="font-medium">{trial.dueDate}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border border-dashed">
                          <p className="text-sm text-muted-foreground">No active trials</p>
                          <Link href="/patient/find-trials" className="mt-2">
                            <Button variant="outline" size="sm">
                              Find Trials
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="mt-6 mb-4 text-lg font-medium">Completed Trials</h3>
                      {patientData.completedTrials.length > 0 ? (
                        <div className="space-y-4">
                          {patientData.completedTrials.map((trial) => (
                            <div key={trial.id} className="rounded-lg border p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{trial.name}</div>
                                  <p className="text-sm text-muted-foreground">Sponsored by {trial.sponsor}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </div>
                              <div className="mt-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Completed Date</span>
                                  <span>{trial.completedDate}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Outcome</span>
                                  <span>{trial.outcome}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border border-dashed">
                          <p className="text-sm text-muted-foreground">No completed trials</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Insights</CardTitle>
                    <CardDescription>N-of-1 studies based on your data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patientData.personalInsights.map((insight, index) => (
                        <div key={index} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{insight.factor}</div>
                              <p className="text-sm">{insight.insight}</p>
                            </div>
                            <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {insight.confidence}% confidence
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Detailed Analysis
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>My Data</CardTitle>
                    <CardDescription>Access and manage your health data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This section will display your health data.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          {/* Mobile Menu Drawer */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle>Dashboard Menu</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <div className="space-y-1">
                  <Button
                    variant={activeTab === "overview" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("overview")
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Overview
                  </Button>
                  <Button
                    variant={activeTab === "trials" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("trials")
                      setMobileMenuOpen(false)
                    }}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    My Trials
                  </Button>
                  <Button
                    variant={activeTab === "insights" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("insights")
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    Personal Insights
                  </Button>
                  <Button
                    variant={activeTab === "data" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("data")
                      setMobileMenuOpen(false)
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    My Data
                  </Button>
                </div>
                <div className="border-t mt-4 pt-4">
                  <Link href="/patient/find-trials">
                    <Button variant="outline" className="w-full">
                      Find New Trials
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </main>
      </div>
    </div>
  )
}

