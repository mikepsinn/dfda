"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  user: any
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name || "Patient"}</h1>
          <p className="text-muted-foreground mt-1">Manage your clinical trials and health data</p>
        </div>
        <Link href="/patient/find-trials">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Find New Trials
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

