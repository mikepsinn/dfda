import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getMetadataFromNavKey } from "@/lib/metadata"
import { resourceUrl, siteOrigin } from "@/lib/oauth-resources"
import { trackingOperations } from "@/lib/tracking/operations"

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
  "An API for Treatment Rankings and Outcome Labels.",
  "API access to your conditions, treatments and treatment ratings.",
]

function Address({ children }: { children: string }) {
  return <code className="block break-all rounded-md bg-muted px-3 py-2 text-sm">{children}</code>
}

export default function DevelopersPage() {
  const siteUrl = siteOrigin()

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Developers</h1>
        <p className="text-muted-foreground sm:text-lg">
          Apps and AI assistants can read and record a person&apos;s own health tracking data, with that
          person&apos;s permission. This page lists what you can use today.
        </p>
      </header>

      <section aria-labelledby="available-heading" className="space-y-8">
        <h2 id="available-heading" className="text-2xl font-semibold tracking-tight">Available today</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">MCP server for AI assistants</h3>
          <p className="text-muted-foreground">
            Add this address to an MCP client, for example Claude or ChatGPT. The client asks you to sign in and to
            approve its access. Then it can record your measurements, and manage and answer your reminders. A
            company&apos;s site has the same server at its own address, with sign-in on that site.
          </p>
          <Address>{resourceUrl("mcp")}</Address>
          <ul aria-label="MCP tools" className="flex flex-wrap gap-2">
            {Object.values(trackingOperations).map(operation => (
              <li key={operation.name}>
                <code title={operation.title} className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {operation.name}
                </code>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">REST API</h3>
          <p className="text-muted-foreground">
            The same operations over HTTP: measurements, variables, reminders and their notifications. The OpenAPI
            document describes each endpoint.
          </p>
          <Address>{resourceUrl("rest")}</Address>
          <p className="text-sm">
            <a href="/api/v1/openapi.json" className="font-medium text-primary hover:underline">
              OpenAPI document
            </a>
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Sign-in with OAuth 2.1 and OpenID Connect</h3>
          <p className="text-muted-foreground">
            Your app can let people sign in with their account on our site. Each person approves each app on a consent
            page. Register your app in the developer dashboard, or let it register itself with dynamic client
            registration (RFC 7591). Apps that cannot keep a client secret use PKCE.
          </p>
          <p className="text-muted-foreground">
            For a token for the MCP server or the REST API, send its address as the <code>resource</code> parameter,
            and ask for the scopes <code>tracking:read</code> (read the data) and <code>tracking:write</code> (record
            and change it). MCP clients do this for you.
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
