import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login?callbackUrl=/user/profile")
  }

  const supabase = await createClient()

  // Fetch user profile data
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialData={profile} />
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

