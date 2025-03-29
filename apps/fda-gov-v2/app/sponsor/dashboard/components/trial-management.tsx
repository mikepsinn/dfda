"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, ChevronRight, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { Database } from "@/lib/database.types"

// Use the auto-generated database type and extend it with UI-specific properties
type Trial = Database["public"]["Tables"]["trials"]["Row"] & {
  progress?: number
  results?: string
  submittedDate?: string
  // UI-specific aliases for database fields
  enrolled?: number // current_enrollment
  target?: number // enrollment_target
}

interface TrialManagementProps {
  activeTrials: Trial[]
  completedTrials: Trial[]
  pendingApproval: Trial[]
}

export function TrialManagement({ activeTrials, completedTrials, pendingApproval }: TrialManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter trials based on search term
  const filterTrials = (trials: Trial[]) => {
    if (!searchTerm) return trials
    return trials.filter((trial) =>
      trial.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredActive = filterTrials(activeTrials)
  const filteredCompleted = filterTrials(completedTrials)
  const filteredPending = filterTrials(pendingApproval)

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Trial Management</CardTitle>
        <CardDescription>Manage and monitor your clinical trials</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <Input
            placeholder="Search trials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Link href="/sponsor/create-trial">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Trial
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Trials ({activeTrials.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTrials.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending Approval ({pendingApproval.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {filteredActive.length > 0 ? (
              <div className="space-y-4">
                {filteredActive.map((trial) => (
                  <div key={trial.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{trial.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(trial.start_date || "").toLocaleDateString()} - {new Date(trial.end_date || "").toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/sponsor/trials/${trial.id}`}>
                        <Button variant="outline" size="sm">
                          Manage
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>Enrollment: {trial.current_enrollment || 0} / {trial.enrollment_target || 0}</span>
                        <span>{Math.round(((trial.current_enrollment || 0) / (trial.enrollment_target || 1)) * 100)}%</span>
                      </div>
                      <Progress value={((trial.current_enrollment || 0) / (trial.enrollment_target || 1)) * 100} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="mb-2 text-lg font-medium">No active trials found</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {searchTerm ? "Try a different search term" : "Create a new trial to get started"}
                </p>
                <Link href="/sponsor/create-trial">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Trial
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {filteredCompleted.length > 0 ? (
              <div className="space-y-4">
                {filteredCompleted.map((trial) => (
                  <div key={trial.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{trial.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(trial.start_date || "").toLocaleDateString()} - {new Date(trial.end_date || "").toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Results
                        </Button>
                        <Link href={`/sponsor/trials/${trial.id}`}>
                          <Button variant="outline" size="sm">
                            View
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>Enrollment: {trial.current_enrollment || 0} / {trial.enrollment_target || 0}</span>
                        <span>Completed on {trial.submittedDate || "N/A"}</span>
                      </div>
                      <Progress value={100} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="mb-2 text-lg font-medium">No completed trials found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Try a different search term" : "Your completed trials will appear here"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {filteredPending.length > 0 ? (
              <div className="space-y-4">
                {filteredPending.map((trial) => (
                  <div key={trial.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{trial.title}</h3>
                        <p className="text-sm text-muted-foreground">Submitted for approval</p>
                      </div>
                      <Link href={`/sponsor/trials/${trial.id}`}>
                        <Button variant="outline" size="sm">
                          View
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="mb-2 text-lg font-medium">No pending trials</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Try a different search term" : "Trials awaiting approval will appear here"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
