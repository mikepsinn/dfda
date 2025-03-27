"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, ChevronRight, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

interface Trial {
  id: number
  name: string
  status: string
  progress?: number
  enrolled: number
  target: number
  startDate: string
  endDate: string
  results?: string
  submittedDate?: string
}

interface TrialManagementProps {
  activeTrials: Trial[]
  completedTrials: Trial[]
  pendingApproval: Trial[]
}

export function TrialManagement({ activeTrials, completedTrials, pendingApproval }: TrialManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">My Trials</h2>
          <p className="text-sm text-muted-foreground">Manage and monitor all your clinical trials</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search trials..."
            className="w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
          <TabsTrigger value="active">Active ({activeTrials.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTrials.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingApproval.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTrials
            .filter((trial) => trial.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((trial) => (
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
          {completedTrials
            .filter((trial) => trial.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((trial) => (
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
          {pendingApproval
            .filter((trial) => trial.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((trial) => (
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
                      Your trial is currently under review. This process typically takes 3-5 business days. You'll be
                      notified once the review is complete.
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
    </div>
  )
}

