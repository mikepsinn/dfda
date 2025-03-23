"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  Calendar,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  LineChart,
  Menu,
  Plus,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"

export default function SponsorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Mock sponsor data
  const sponsorData = {
    name: "Innovative Therapeutics Inc.",
    activeTrials: [
      {
        id: 1,
        name: "Efficacy of Treatment A for Type 2 Diabetes",
        status: "Recruiting",
        progress: 68,
        enrolled: 342,
        target: 500,
        startDate: "Jan 15, 2025",
        endDate: "Jul 15, 2025",
      },
      {
        id: 2,
        name: "Comparative Study of Treatments B and C for Rheumatoid Arthritis",
        status: "Recruiting",
        progress: 45,
        enrolled: 135,
        target: 300,
        startDate: "Feb 1, 2025",
        endDate: "Aug 1, 2025",
      },
    ],
    completedTrials: [
      {
        id: 3,
        name: "Safety Study of Treatment D for Hypertension",
        status: "Completed",
        enrolled: 250,
        target: 250,
        startDate: "Sep 10, 2024",
        endDate: "Dec 10, 2024",
        results: "Positive efficacy, minimal side effects",
      },
    ],
    pendingApproval: [
      {
        id: 4,
        name: "Novel Therapy for Depression",
        status: "Pending Approval",
        submittedDate: "Mar 1, 2025",
      },
    ],
    recentActivity: [
      {
        type: "enrollment",
        trial: "Efficacy of Treatment A for Type 2 Diabetes",
        date: "Mar 4, 2025",
        description: "5 new participants enrolled",
      },
      {
        type: "data",
        trial: "Comparative Study of Treatments B and C for Rheumatoid Arthritis",
        date: "Mar 3, 2025",
        description: "15 participants submitted 4-week follow-up data",
      },
      {
        type: "milestone",
        trial: "Efficacy of Treatment A for Type 2 Diabetes",
        date: "Mar 1, 2025",
        description: "Reached 300+ participants milestone",
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r bg-muted/40 lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">Sponsor Dashboard</h2>
              <p className="text-sm text-muted-foreground">Welcome, {sponsorData.name}</p>
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
                  variant={activeTab === "analytics" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("analytics")}
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button
                  variant={activeTab === "documents" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("documents")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </Button>
              </div>
            </nav>
            <div className="border-t p-4">
              <Link href="/sponsor/create-trial">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Trial
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Sponsor Dashboard</h1>
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
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Active Trials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{sponsorData.activeTrials.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {sponsorData.activeTrials.length === 1 ? "Trial" : "Trials"} in progress
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Total Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {sponsorData.activeTrials.reduce((sum, trial) => sum + trial.enrolled, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Across {sponsorData.activeTrials.length} active trials
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Pending Approval</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{sponsorData.pendingApproval.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {sponsorData.pendingApproval.length === 1 ? "Trial" : "Trials"} awaiting approval
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Trial Enrollment Progress</CardTitle>
                    <CardDescription>Current enrollment status for active trials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {sponsorData.activeTrials.map((trial) => (
                        <div key={trial.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{trial.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {trial.startDate} - {trial.endDate}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{trial.status}</span>
                              <span className="text-sm text-muted-foreground">
                                {trial.enrolled}/{trial.target} enrolled
                              </span>
                            </div>
                          </div>
                          <Progress value={trial.progress} className="h-2" />
                          <div className="flex justify-end">
                            <Link href={`/sponsor/trials/${trial.id}`}>
                              <Button variant="ghost" size="sm">
                                View Details <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from your trials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sponsorData.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4 rounded-lg border p-3">
                          {activity.type === "enrollment" && <Users className="mt-0.5 h-5 w-5 text-blue-500" />}
                          {activity.type === "data" && <FileText className="mt-0.5 h-5 w-5 text-green-500" />}
                          {activity.type === "milestone" && <Calendar className="mt-0.5 h-5 w-5 text-purple-500" />}
                          <div className="flex-1">
                            <div className="font-medium">{activity.trial}</div>
                            <p className="text-sm">{activity.description}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">{activity.date}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View All Activity
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="trials" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">My Trials</h2>
                    <p className="text-sm text-muted-foreground">Manage and monitor all your clinical trials</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search trials..." className="w-[200px]" />
                    <Link href="/sponsor/create-trial">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Trial
                      </Button>
                    </Link>
                  </div>
                </div>

                <Tabs defaultValue="active" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="active">Active ({sponsorData.activeTrials.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({sponsorData.completedTrials.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({sponsorData.pendingApproval.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="space-y-4">
                    {sponsorData.activeTrials.map((trial) => (
                      <Card key={trial.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle>{trial.name}</CardTitle>
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              {trial.status}
                            </span>
                          </div>
                          <CardDescription>
                            {trial.startDate} - {trial.endDate}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Enrollment Progress</span>
                                <span className="font-medium">
                                  {trial.enrolled}/{trial.target} participants ({trial.progress}%)
                                </span>
                              </div>
                              <Progress value={trial.progress} className="h-2 mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="rounded-lg bg-muted p-3 text-center">
                                <div className="text-sm text-muted-foreground">Data Completion</div>
                                <div className="text-lg font-medium">87%</div>
                              </div>
                              <div className="rounded-lg bg-muted p-3 text-center">
                                <div className="text-sm text-muted-foreground">Retention Rate</div>
                                <div className="text-lg font-medium">92%</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="flex w-full justify-between">
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Export Data
                            </Button>
                            <Link href={`/sponsor/trials/${trial.id}`}>
                              <Button size="sm">
                                Manage Trial
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4">
                    {sponsorData.completedTrials.map((trial) => (
                      <Card key={trial.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle>{trial.name}</CardTitle>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {trial.status}
                            </span>
                          </div>
                          <CardDescription>
                            {trial.startDate} - {trial.endDate}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Final Enrollment</span>
                                <span className="font-medium">
                                  {trial.enrolled}/{trial.target} participants (100%)
                                </span>
                              </div>
                              <Progress value={100} className="h-2 mt-1" />
                            </div>

                            <div className="rounded-lg border p-3">
                              <div className="font-medium">Results Summary</div>
                              <p className="text-sm text-muted-foreground mt-1">{trial.results}</p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="flex w-full justify-between">
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Download Report
                            </Button>
                            <Link href={`/sponsor/trials/${trial.id}/results`}>
                              <Button size="sm">
                                View Full Results
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-4">
                    {sponsorData.pendingApproval.map((trial) => (
                      <Card key={trial.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle>{trial.name}</CardTitle>
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              {trial.status}
                            </span>
                          </div>
                          <CardDescription>Submitted on {trial.submittedDate}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm">
                              Your trial is currently under review. This process typically takes 3-5 business days.
                              You'll be notified once the review is complete.
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="flex w-full justify-between">
                            <Button variant="outline" size="sm">
                              View Submission
                            </Button>
                            <Button variant="outline" size="sm">
                              Contact Support
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics & Reporting</CardTitle>
                    <CardDescription>Comprehensive analytics for your clinical trials</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Analytics Dashboard</h3>
                      <p className="mt-2 text-sm text-muted-foreground max-w-md">
                        View detailed analytics about enrollment rates, data completion, participant demographics, and
                        preliminary results for your active trials.
                      </p>
                      <Button className="mt-4">View Analytics</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & Files</CardTitle>
                    <CardDescription>Access and manage all your trial-related documents</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Document Repository</h3>
                      <p className="mt-2 text-sm text-muted-foreground max-w-md">
                        Access trial protocols, consent forms, regulatory documents, and data exports for all your
                        trials in one centralized location.
                      </p>
                      <Button className="mt-4">Browse Documents</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Mobile Menu Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle>Sponsor Dashboard</SheetTitle>
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
                  variant={activeTab === "analytics" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab("analytics")
                    setMobileMenuOpen(false)
                  }}
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button
                  variant={activeTab === "documents" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab("documents")
                    setMobileMenuOpen(false)
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </Button>
              </div>
              <div className="border-t mt-4 pt-4">
                <Link href="/sponsor/create-trial">
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Trial
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

