import { ApiKeyRequestForm } from "@/components/developers/ApiKeyRequestForm"
import { OAuthApplicationForm } from "@/components/developers/OAuthApplicationForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getServerUser } from "@/lib/server-auth" // Assuming this function exists
import { createClient } from "@/lib/supabase/server" // Assuming this function exists
import { redirect } from 'next/navigation'
import { logger } from "@/lib/logger"

// Server Action to update profile
async function updateDeveloperProfile(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const user = await getServerUser()

  if (!user) {
    return redirect('/login')
  }

  const firstName = formData.get('developer-first-name') as string
  const lastName = formData.get('developer-last-name') as string

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', user.id)

    if (error) {
      logger.error('Error updating developer profile:', error)
      // TODO: Add user-facing error handling (e.g., toast notification)
    } else {
      logger.info('Developer profile updated successfully for user:', user.id)
      // Optionally revalidate path or redirect if needed
    }
  } catch (err) {
    logger.error('Unexpected error updating developer profile:', err)
    // TODO: Add user-facing error handling
  }
}

export default async function DeveloperDashboardPage() { // Renamed and made async
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch existing profile data
  const supabase = await createClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', user.id)
    .single()

  if (profileError) {
    logger.error('Error fetching developer profile:', profileError)
    // Handle error appropriately, maybe show a message
  }

  return (
    <main className="py-6 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-2xl space-y-8">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Developer Dashboard</h1>
          <p className="text-muted-foreground">Manage your profile, API keys, and OAuth applications.</p>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Keep your contact information up to date.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Updated form to use Server Action */}
              <form action={updateDeveloperProfile} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="developer-first-name">First name</Label>
                     <Input id="developer-first-name" name="developer-first-name" defaultValue={profile?.first_name ?? ''} />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="developer-last-name">Last name</Label>
                     <Input id="developer-last-name" name="developer-last-name" defaultValue={profile?.last_name ?? ''} />
                   </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="developer-email">Email</Label>
                    <Input id="developer-email" name="developer-email" type="email" value={profile?.email ?? ''} readOnly />
                  </div>
                 <Button type="submit">Update Profile</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Manage your API keys.
                {/* TODO: Logic to show request form or existing key */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Display existing API key or show request form */}
              {/* <ApiKeyRequestForm /> Placeholder */}
               <p className="text-sm text-muted-foreground">API Key management coming soon.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OAuth2 Applications</CardTitle>
              <CardDescription>
                Manage your registered OAuth2 applications.
                 {/* TODO: Logic to show list or registration form */}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {/* TODO: Display list of registered OAuth apps or show form */}
               {/* <OAuthApplicationForm /> Placeholder */}
               <p className="text-sm text-muted-foreground">OAuth Application management coming soon.</p>
            </CardContent>
          </Card>

          {/* Placeholder for future developer dashboard features */}
          {/* <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>Monitor your API usage statistics.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">[Usage charts and data will appear here]</p>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </main>
  )
}
