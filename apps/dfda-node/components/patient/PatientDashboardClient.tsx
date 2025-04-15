'use client'

import React, { useState, useEffect } from 'react'
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HeartPulse, Pill, Loader2 } from "lucide-react"
import { TrackingInbox } from "@/components/patient/TrackingInbox"
import { logger } from "@/lib/logger"
import { ImageAnalysisCapture } from '@/components/shared/ImageAnalysisCapture'
// Import necessary types (adjust paths if needed)
import type { User } from '@supabase/supabase-js' // Assuming User type from Supabase
import type { PatientCondition } from '@/lib/database.types' // Assuming PatientCondition type
import type { ReminderNotification } from '@/app/actions/reminder-schedules' // Assuming ReminderNotification type

interface PatientDashboardClientProps {
  initialUser: User | null;
  initialConditions: PatientCondition[];
  initialNotifications: ReminderNotification[];
}

export default function PatientDashboardClient({ 
  initialUser, 
  initialConditions, 
  initialNotifications 
}: PatientDashboardClientProps) {
  // Use state to manage data, initialized by props
  // We might not need useState for props if they don't change client-side without a full refresh
  // But let's keep the structure similar for now, especially for potentially refreshing parts later
  const [user, setUser] = useState(initialUser)
  const [conditions, setConditions] = useState(initialConditions)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [dataKey, setDataKey] = useState(Date.now()) // Keep client-side refresh key if needed

  // This useEffect might be redundant if all initial data is fetched server-side
  // We'll keep it commented out for now, might be needed if we add client-side re-fetching later
  /*
  useEffect(() => {
    // Logic to potentially re-fetch data client-side based on dataKey or other triggers
    // For now, rely on server-fetched initial props
    setUser(initialUser);
    setConditions(initialConditions);
    setNotifications(initialNotifications);
  }, [initialUser, initialConditions, initialNotifications, dataKey])
  */

  // Handler to refresh data after successful save - might need adjustment
  // Option 1: Trigger server refresh (e.g., router.refresh())
  // Option 2: Update client state directly (less ideal if server state changed significantly)
  const handleSaveSuccess = () => {
    logger.info('Item saved, client component notified...')
    // Simplest approach for now: trigger a page refresh to get new server props
    // This might not be the most efficient, consider alternatives later if needed
    // window.location.reload(); 
    // Or use Next.js router refresh if available
    // For now, we'll just log, assuming the server component handles revalidation
    // setDataKey(Date.now()) // This only triggers client-side effect if used
  }

  // If initial user is null, this component shouldn't render (handled by server component redirect)
  if (!user) {
      // Should not happen if server component redirects correctly
      logger.error("PatientDashboardClient rendered without a user.")
      return <div className="container py-8 text-center text-red-600">Error: User not found.</div>;
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Header Area with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Patient Dashboard</h1>
        {/* Pass user ID and the adjusted handleSaveSuccess */}
        <ImageAnalysisCapture userId={user.id} onSaveSuccess={handleSaveSuccess} />
      </div>

      {/* Tracking Inbox (conditionally rendered based on state) */}
      {notifications && notifications.length > 0 && (
        <TrackingInbox userId={user.id} initialNotifications={notifications} />
      )}

      {/* Existing Conditions & Treatments Card */}
      <Card>
        <CardHeader className="pb-4">
          <div>
            <CardTitle>Your Conditions & Treatments</CardTitle>
            <CardDescription>View and manage your health data</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/patient/conditions">
              <Button variant="outline" size="lg" className="w-full h-24 flex flex-col justify-center items-center gap-2">
                <HeartPulse className="h-6 w-6" />
                <span>Conditions</span>
              </Button>
            </Link>
            <Link href="/patient/treatments">
              <Button variant="outline" size="lg" className="w-full h-24 flex flex-col justify-center items-center gap-2">
                <Pill className="h-6 w-6" />
                <span>Treatments</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 