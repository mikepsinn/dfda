'use client'

import React, { useState /*, useEffect */ } from 'react'
// Remove unused redirect
// import { redirect } from "next/navigation"
// Removed unused Card component imports
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HeartPulse, Pill /*, Loader2 */ } from "lucide-react"
import { TrackingInbox } from "@/components/patient/TrackingInbox"
import { logger } from "@/lib/logger"
import { ImageAnalysisCapture } from '@/components/shared/ImageAnalysisCapture'
// Import necessary types (adjust paths if needed)
import type { User } from '@supabase/supabase-js' // Assuming User type from Supabase
// Use Tables helper for view type
import type { Tables } from '@/lib/database.types' 
// Import the correct type for the tracking inbox data
import type { PendingNotificationTask } from '@/lib/actions/reminder-schedules'

// Define types using the Tables helper
type PatientConditionRow = Tables<'patient_conditions_view'>
// Removed unused type alias: type ReminderNotificationRow = Tables<'reminder_notifications'>

interface PatientDashboardClientProps {
  initialUser: User | null;
  initialConditions: PatientConditionRow[];
  initialNotifications: PendingNotificationTask[]; // Changed type here
}

export default function PatientDashboardClient({ 
  initialUser, 
  initialConditions, 
  initialNotifications 
}: PatientDashboardClientProps) {
  // Remove unused state setters and dataKey
  const [user /*, setUser*/] = useState(initialUser)
  const [/*conditions*/] = useState(initialConditions) // Remove unused `conditions` state
  const [notifications /*, setNotifications*/] = useState(initialNotifications)
  // const [dataKey, setDataKey] = useState(Date.now()) // Remove unused state

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
    </div>
  )
} 