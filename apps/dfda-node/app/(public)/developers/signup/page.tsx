import { ApiKeyRequestForm } from "@/components/developers/ApiKeyRequestForm"
import { OAuthApplicationForm } from "@/components/developers/OAuthApplicationForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DeveloperSignupPage() {
  return (
    <main className="py-6 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-2xl space-y-8">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Developer Signup</h1>

          <Card>
            <CardHeader>
              <CardTitle>Request an API Key</CardTitle>
              <CardDescription>
                Fill out the form below to request an API key. We'll review your request and send your API
                key to the provided email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeyRequestForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Register an OAuth2 Application (Optional)</CardTitle>
              <CardDescription>
                If you need to access user-specific data or perform actions on behalf of users, register your
                application for OAuth2 access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OAuthApplicationForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 