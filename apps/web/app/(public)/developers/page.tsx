import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getMetadataFromNavKey } from "@/lib/metadata"
import { getBaseUrl } from "@/lib/url"

export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey("developers")
}

// The OAuth 2.1 / OpenID Connect provider endpoints (see lib/auth.ts). Clients find the others in the metadata.
const oauthEndpoints = [
  { name: "Metadata", path: "/.well-known/oauth-authorization-server/api/auth" },
  { name: "Authorization", path: "/api/auth/oauth2/authorize" },
  { name: "Token", path: "/api/auth/oauth2/token" },
  { name: "Client registration", path: "/api/auth/oauth2/register" },
]

const notBuilt = [
  "Data access with an access token. A token from our sign-in does not give access to health data yet.",
  "An MCP server for AI assistants.",
  "API endpoints for measurements, reminders, notifications and variables.",
  "An API for Treatment Rankings and Outcome Labels.",
]

export default function DevelopersPage() {
  const siteUrl = getBaseUrl().replace(/\/$/, "")

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Developers</h1>
        <p className="text-muted-foreground sm:text-lg">
          We plan an API for Treatment Rankings, Outcome Labels and the health data that people choose to share. Most of
          it is not built yet. This page lists what you can use today.
        </p>
      </header>

      <section aria-labelledby="available-heading" className="space-y-6">
        <h2 id="available-heading" className="text-2xl font-semibold tracking-tight">Available today</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Sign-in with OAuth 2.1 and OpenID Connect</h3>
          <p className="text-muted-foreground">
            Your app can let people sign in with their account on our site. Each person approves each app on a consent
            page. Register your app in the developer dashboard, or let it register itself with dynamic client
            registration (RFC 7591). Apps that cannot keep a client secret use PKCE.
          </p>
          <table className="w-full text-sm">
            <caption className="sr-only">OAuth endpoints</caption>
            <tbody className="divide-y">
              {oauthEndpoints.map(endpoint => (
                <tr key={endpoint.path}>
                  <th scope="row" className="py-2 pr-4 text-left align-top font-medium">{endpoint.name}</th>
                  <td className="py-2">
                    <code className="break-all text-muted-foreground">{siteUrl + endpoint.path}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button asChild variant="outline">
            <Link href="/developer">Open the developer dashboard</Link>
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">OpenAPI description</h3>
          <p className="text-muted-foreground">
            <code className="break-all">{siteUrl}/api/openapi</code> returns an OpenAPI description of our database
            tables.
          </p>
        </div>
      </section>

      <section aria-labelledby="not-built-heading" className="space-y-3">
        <h2 id="not-built-heading" className="text-2xl font-semibold tracking-tight">Not built yet</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          {notBuilt.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="text-muted-foreground">
        Questions, or want to help build the API?{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  )
}
