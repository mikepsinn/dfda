import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProfilePage() {
  const user = await getServerUser()
  const supabase = await createClient()

  // Fetch user profile data
  const { data: profile } = await supabase.from("users").select("*").eq("id", user?.id).single()

  return (
    <main className="flex-1 py-6 md:py-10">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

        <div className="space-y-8">
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
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user?.email_confirmed_at ? "Verified" : "Not verified"}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Google Account</h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.app_metadata?.provider === "google" ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

