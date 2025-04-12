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
import Link from "next/link"
import { ExternalLink, FileText, Mail } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeExampleTabs } from "@/components/developers/CodeExampleTabs" // Import CodeExampleTabs

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
        <div className="mx-auto max-w-5xl space-y-8"> {/* Increased max-width */} 
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Developer Dashboard</h1>
          <p className="text-muted-foreground">Manage your profile, API keys, OAuth applications, and access documentation.</p>

          <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-3"> {/* Updated grid-cols */} 
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="examples">Code Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 pt-6">
              {/* Existing Dashboard Content START */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Keep your contact information up to date.</CardDescription>
                </CardHeader>
                <CardContent>
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
              {/* Existing Dashboard Content END */}
            </TabsContent>

            <TabsContent value="documentation" className="space-y-6 pt-6">
              {/* Copied Documentation Content START */}
              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                  <CardDescription>Comprehensive documentation for the FDA.gov v2 API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    Our detailed documentation covers everything you need to know about using the FDA.gov v2 API,
                    including authentication, endpoints, error handling, and more.
                  </p>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Getting Started</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Learn the basics of the API and how to make your first request.
                      </p>
                      <Link href="/developers/documentation#getting-started">
                        <Button variant="outline" size="sm">
                          View Section
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Authentication</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Learn about API keys and OAuth 2.0 authentication.
                      </p>
                      <Link href="/developers/documentation#auth">
                        <Button variant="outline" size="sm">
                          View Section
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Endpoints</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Explore all available API endpoints and their parameters.
                      </p>
                      <Link href="/developers/documentation#endpoints">
                        <Button variant="outline" size="sm">
                          View Section
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Error Handling</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Learn how to handle errors and troubleshoot issues.
                      </p>
                      <Link href="/developers/documentation#error-handling">
                        <Button variant="outline" size="sm">
                          View Section
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <Link href="/developers/documentation">
                    <Button variant="default" className="mt-4">
                      <ExternalLink className="mr-2 h-4 w-4" /> View Full Documentation
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              {/* Copied Documentation Content END */}
            </TabsContent>

            <TabsContent value="examples" className="space-y-6 pt-6">
              {/* Copied Examples Content START */}
              <Card>
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
                  <CardDescription>See how to integrate the API into your applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Explore code examples in various languages to quickly get started with the FDA.gov v2 API.
                  </p>
                  <CodeExampleTabs />
                </CardContent>
              </Card>
              {/* Copied Examples Content END */}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </main>
  )
}
