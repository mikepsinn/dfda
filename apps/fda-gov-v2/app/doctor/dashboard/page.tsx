"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  AlertCircle,
  Brain,
  Calendar,
  ChevronRight,
  ClipboardList,
  FileText,
  Microscope,
  Pill,
  Search,
  User,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

export default function DoctorDashboard() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for active trials
  const activeTrials = [
    {
      id: 1,
      name: "Lecanemab for Early Alzheimer's Disease",
      sponsor: "Eisai/Biogen Collaborative Research",
      enrolledPatients: 8,
      targetPatients: 12,
      progress: 66,
      nextVisit: "May 15, 2025",
      pendingActions: 3,
    },
    {
      id: 2,
      name: "ABBV-951 for Advanced Parkinson's Disease",
      sponsor: "AbbVie Parkinson's Research Consortium",
      enrolledPatients: 5,
      targetPatients: 10,
      progress: 50,
      nextVisit: "May 18, 2025",
      pendingActions: 1,
    },
  ]

  // Mock data for eligible patients
  const eligiblePatients = [
    {
      id: 1,
      name: "Eleanor Thompson",
      age: 72,
      condition: "Early Alzheimer's Disease",
      eligibleTrials: [
        { id: 1, name: "Lecanemab for Early Alzheimer's Disease" },
        { id: 2, name: "Donanemab vs Standard of Care in Mild Alzheimer's Disease" },
      ],
      lastVisit: "April 28, 2025",
      status: "Eligible for enrollment",
    },
    {
      id: 2,
      name: "Robert Chen",
      age: 68,
      condition: "Advanced Parkinson's Disease",
      eligibleTrials: [{ id: 3, name: "ABBV-951 Subcutaneous Infusion for Advanced Parkinson's Disease" }],
      lastVisit: "May 2, 2025",
      status: "Pending consent",
    },
    {
      id: 3,
      name: "Sarah Williams",
      age: 42,
      condition: "Relapsing Multiple Sclerosis",
      eligibleTrials: [{ id: 5, name: "Tolebrutinib (BTK Inhibitor) for Relapsing Multiple Sclerosis" }],
      lastVisit: "April 30, 2025",
      status: "Eligible for enrollment",
    },
    {
      id: 4,
      name: "Michael Davis",
      age: 76,
      condition: "Mild Alzheimer's Disease",
      eligibleTrials: [{ id: 2, name: "Donanemab vs Standard of Care in Mild Alzheimer's Disease" }],
      lastVisit: "May 5, 2025",
      status: "Eligible for enrollment",
    },
  ]

  // Mock data for enrolled patients
  const enrolledPatients = [
    {
      id: 5,
      name: "James Wilson",
      age: 74,
      condition: "Early Alzheimer's Disease",
      trial: "Lecanemab for Early Alzheimer's Disease",
      enrollmentDate: "March 15, 2025",
      nextVisit: "May 15, 2025",
      pendingActions: [
        { type: "form", name: "Cognitive Assessment", due: "May 15, 2025" },
        { type: "intervention", name: "Lecanemab Administration", due: "May 15, 2025" },
      ],
    },
    {
      id: 6,
      name: "Patricia Moore",
      age: 71,
      condition: "Early Alzheimer's Disease",
      trial: "Lecanemab for Early Alzheimer's Disease",
      enrollmentDate: "March 18, 2025",
      nextVisit: "May 18, 2025",
      pendingActions: [{ type: "form", name: "Quality of Life Assessment", due: "May 10, 2025" }],
    },
    {
      id: 7,
      name: "David Johnson",
      age: 65,
      condition: "Advanced Parkinson's Disease",
      trial: "ABBV-951 for Advanced Parkinson's Disease",
      enrollmentDate: "April 2, 2025",
      nextVisit: "May 14, 2025",
      pendingActions: [{ type: "intervention", name: "ABBV-951 Infusion Setup", due: "May 14, 2025" }],
    },
  ]

  // Mock data for pending actions
  const pendingActions = [
    {
      id: 1,
      patient: "James Wilson",
      action: "Complete Cognitive Assessment",
      trial: "Lecanemab for Early Alzheimer's Disease",
      due: "May 15, 2025",
      type: "form",
    },
    {
      id: 2,
      patient: "James Wilson",
      action: "Administer Lecanemab Infusion",
      trial: "Lecanemab for Early Alzheimer's Disease",
      due: "May 15, 2025",
      type: "intervention",
    },
    {
      id: 3,
      patient: "Patricia Moore",
      action: "Complete Quality of Life Assessment",
      trial: "Lecanemab for Early Alzheimer's Disease",
      due: "May 10, 2025",
      type: "form",
    },
    {
      id: 4,
      patient: "David Johnson",
      action: "Setup ABBV-951 Subcutaneous Infusion",
      trial: "ABBV-951 for Advanced Parkinson's Disease",
      due: "May 14, 2025",
      type: "intervention",
    },
    {
      id: 5,
      patient: "Robert Chen",
      action: "Obtain Informed Consent",
      trial: "ABBV-951 for Advanced Parkinson's Disease",
      due: "May 12, 2025",
      type: "consent",
    },
  ]

  // Filter patients based on search query
  const filteredEligiblePatients = eligiblePatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredEnrolledPatients = enrolledPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.trial.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
                <p className="text-muted-foreground">Manage your clinical trials, patients, and interventions</p>
              </div>
              <div className="flex gap-2">
                <Link href="/doctor/find-trials">
                  <Button>
                    <Microscope className="mr-2 h-4 w-4" />
                    Find Trials
                  </Button>
                </Link>
                <Link href="/doctor/form-management/create">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Create Form
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
                  <Microscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeTrials.length}</div>
                  <p className="text-xs text-muted-foreground">{enrolledPatients.length} patients enrolled</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eligible Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eligiblePatients.length}</div>
                  <p className="text-xs text-muted-foreground">Across {activeTrials.length} active trials</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingActions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingActions.filter((a) => new Date(a.due) < new Date(Date.now() + 86400000 * 3)).length} due in
                    next 3 days
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Visits</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">3 this week, 5 next week</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Active Trials</CardTitle>
                  <CardDescription>Your current participation in clinical trials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activeTrials.map((trial) => (
                      <div key={trial.id} className="rounded-lg border p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Brain className="h-5 w-5 text-primary" />
                              <h3 className="font-medium">{trial.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{trial.sponsor}</p>
                          </div>
                          <Badge variant="outline">
                            {trial.enrolledPatients}/{trial.targetPatients} Patients
                          </Badge>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Enrollment Progress</span>
                            <span>{trial.progress}%</span>
                          </div>
                          <Progress value={trial.progress} className="h-2" />
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Next visit: {trial.nextVisit}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm">{trial.pendingActions} pending actions</span>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Link href={`/doctor/trials/${trial.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-center">
                      <Link href="/doctor/find-trials">
                        <Button variant="outline">
                          Find More Trials
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Actions</CardTitle>
                  <CardDescription>Tasks requiring your attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingActions.slice(0, 5).map((action) => (
                      <div key={action.id} className="flex items-start gap-4 rounded-lg border p-3">
                        {action.type === "form" && (
                          <div className="rounded-full bg-blue-100 p-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        {action.type === "intervention" && (
                          <div className="rounded-full bg-green-100 p-2">
                            <Pill className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                        {action.type === "consent" && (
                          <div className="rounded-full bg-amber-100 p-2">
                            <ClipboardList className="h-4 w-4 text-amber-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{action.action}</div>
                          <div className="text-sm text-muted-foreground">
                            {action.patient} • Due {action.due}
                          </div>
                        </div>
                        <Link
                          href={`/doctor/${action.type === "form" ? "forms" : action.type === "intervention" ? "intervention-assignment" : "patients"}/${action.id}`}
                        >
                          <Button size="sm" variant="ghost">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}

                    {pendingActions.length > 5 && (
                      <div className="flex justify-center">
                        <Button variant="link" size="sm">
                          View All {pendingActions.length} Actions
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>Manage patients eligible for or enrolled in clinical trials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search patients by name, condition, or trial..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Tabs defaultValue="eligible">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="eligible">Eligible Patients</TabsTrigger>
                    <TabsTrigger value="enrolled">Enrolled Patients</TabsTrigger>
                  </TabsList>

                  <TabsContent value="eligible" className="space-y-4 pt-4">
                    {filteredEligiblePatients.length > 0 ? (
                      filteredEligiblePatients.map((patient) => (
                        <div key={patient.id} className="rounded-lg border p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {patient.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">{patient.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {patient.age} years • {patient.condition}
                                </p>
                              </div>
                            </div>
                            <Badge variant={patient.status === "Pending consent" ? "outline" : "secondary"}>
                              {patient.status}
                            </Badge>
                          </div>

                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Eligible for trials:</h4>
                            <div className="space-y-2">
                              {patient.eligibleTrials.map((trial) => (
                                <div
                                  key={trial.id}
                                  className="flex items-center justify-between rounded-lg bg-muted p-2"
                                >
                                  <span className="text-sm">{trial.name}</span>
                                  <Link href={`/doctor/patients/${patient.id}/enroll?trial=${trial.id}`}>
                                    <Button size="sm">Enroll</Button>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">Last visit: {patient.lastVisit}</div>
                            <Link href={`/doctor/patients/${patient.id}`}>
                              <Button variant="outline" size="sm">
                                View Patient
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No eligible patients found matching your search.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="enrolled" className="space-y-4 pt-4">
                    {filteredEnrolledPatients.length > 0 ? (
                      filteredEnrolledPatients.map((patient) => (
                        <div key={patient.id} className="rounded-lg border p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {patient.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">{patient.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {patient.age} years • {patient.condition}
                                </p>
                              </div>
                            </div>
                            <Badge>Enrolled</Badge>
                          </div>

                          <div className="mt-4">
                            <div className="rounded-lg bg-muted p-3">
                              <div className="flex items-center gap-2">
                                <Microscope className="h-4 w-4 text-primary" />
                                <span className="font-medium">{patient.trial}</span>
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                Enrolled on {patient.enrollmentDate} • Next visit: {patient.nextVisit}
                              </div>
                            </div>
                          </div>

                          {patient.pendingActions.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Pending actions:</h4>
                              <div className="space-y-2">
                                {patient.pendingActions.map((action, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg bg-muted/50 p-2 border border-muted"
                                  >
                                    <div className="flex items-center gap-2">
                                      {action.type === "form" ? (
                                        <FileText className="h-4 w-4 text-blue-600" />
                                      ) : (
                                        <Pill className="h-4 w-4 text-green-600" />
                                      )}
                                      <span className="text-sm">{action.name}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">Due: {action.due}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex justify-end gap-2">
                            <Link href={`/doctor/ehr-authorization/${patient.id}`}>
                              <Button variant="outline" size="sm">
                                EHR Data
                              </Button>
                            </Link>
                            <Link href={`/doctor/intervention-assignment/${patient.id}`}>
                              <Button variant="outline" size="sm">
                                Assign Intervention
                              </Button>
                            </Link>
                            <Link href={`/doctor/patients/${patient.id}`}>
                              <Button size="sm">View Patient</Button>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No enrolled patients found matching your search.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Add Patient
                </Button>
                <Button variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  View All Patients
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

