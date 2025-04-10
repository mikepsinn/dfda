"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Pill, ClipboardList, ChevronRight } from "lucide-react"

interface PendingAction {
  id: number
  patient: string
  action: string
  trial: string
  due: string
  type: string
}

interface PendingActionsProps {
  actions: PendingAction[]
  totalActions: number
}

export function PendingActions({ actions, totalActions }: PendingActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
        <CardDescription>Tasks requiring your attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action) => (
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
                href={`/app/(protected)/provider/${action.type === "form" ? "forms" : action.type === "intervention" ? "intervention-assignment" : "patients"}/${action.id}`}
              >
                <Button size="sm" variant="ghost">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}

          {totalActions > actions.length && (
            <div className="flex justify-center">
              <Button variant="link" size="sm">
                View All {totalActions} Actions
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

