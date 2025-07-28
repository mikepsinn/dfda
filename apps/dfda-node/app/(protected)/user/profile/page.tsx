import { getServerUser } from "@/lib/server-auth"
// No longer need createClient directly here
// import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { getCurrentUserProfileAction } from "@/lib/actions/profiles" // Import the action

export default async function ProfilePage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login?callbackUrl=/user/profile")
  }

  // Fetch user profile data using the action
  const profile = await getCurrentUserProfileAction()

  // Handle case where profile fetch failed (though action logs errors)
  if (!profile) {
    // Optional: Add user-facing error handling or redirect
    console.error("ProfilePage: Failed to load profile data for user:", user.id) 
    // Potentially render an error state or return null/empty component
  }

  return (
    <div className="space-y-6"> {/* Added spacing between cards */} 

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass profile or an empty object if fetch failed */}
          <ProfileForm initialData={profile || {}} /> 
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account settings and linked services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium">Email Address</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {user.email_confirmed_at ? "Verified" : "Not verified"}
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium">Google Account</h3>
                <p className="text-sm text-muted-foreground">
                  {user.app_metadata?.provider === "google" ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

