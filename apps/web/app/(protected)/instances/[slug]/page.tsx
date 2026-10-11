import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ExternalLink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstanceForm } from "@/components/instance/InstanceForm"
import { updateInstanceAction } from "@/lib/actions/instances"
import { getUserDb } from "@/lib/db/server"
import { env } from "@/lib/env"
import { dnsRecordFor, isDomainConfigured } from "@/lib/instance/vercel-domains"
import { listPrograms } from "@/lib/programs/data"
import { siteOrigin } from "@/lib/oauth-resources"
import { getServerUser } from "@/lib/server-auth"

export const metadata: Metadata = { title: "Your instance" }

const domainMessages: Record<string, string> = {
  added: "The domain is added to the hosting. It works as soon as its DNS record points here.",
  pending: "The domain is added to the hosting. Add the DNS records below to confirm that it is yours.",
  manual: "Add the domain to the Vercel project of this site, and add the DNS record below.",
  error: "The hosting did not accept the domain. Check the name, or add it in Vercel by hand.",
}

function Address({ label, url, note }: { label: string; url: string; note: string }) {
  return (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="break-all text-sm text-muted-foreground">{url}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <Button asChild variant="outline" size="sm" className="gap-2 self-start sm:self-center">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </Button>
    </li>
  )
}

export default async function InstancePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ created?: string; saved?: string; domain?: string }>
}) {
  const [{ slug }, query, user] = await Promise.all([params, searchParams, getServerUser()])
  if (!user) notFound()
  const db = await getUserDb()
  const row = await db.instances.findFirst({ where: { slug, owner_id: user.id } })
  if (!row) notFound()

  const instance = {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    products: row.products,
    customDomain: row.custom_domain,
  }
  const site = siteOrigin()
  const [domainConnected, programs] = await Promise.all([
    instance.customDomain ? isDomainConfigured(instance.customDomain) : null,
    listPrograms(instance.slug),
  ])
  const dns = instance.customDomain ? dnsRecordFor(instance.customDomain) : null

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="space-y-3">
        {(query.created || query.saved) && (
          <p role="status" className="flex items-center gap-2 font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            {query.created ? "Your instance is live." : "Your changes are saved."}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{instance.name}</h1>
      </header>

      <section aria-labelledby="addresses-heading" className="space-y-3">
        <h2 id="addresses-heading" className="text-xl font-semibold">Addresses</h2>
        <ul className="divide-y rounded-xl border">
          <Address
            label="Preview link"
            url={`${site}/i/${instance.slug}`}
            note="Works now. It shows this site with your branding in the browser that opens it."
          />
          {env.INSTANCE_ROOT_DOMAIN && (
            <Address label="Subdomain" url={`https://${instance.slug}.${env.INSTANCE_ROOT_DOMAIN}`} note="Works now, for everyone." />
          )}
          {instance.customDomain && (
            <Address
              label="Your domain"
              url={`https://${instance.customDomain}`}
              note={
                domainConnected === true
                  ? "Connected."
                  : domainConnected === false
                    ? "Waiting for the DNS record below."
                    : "Works when the DNS record below points here."
              }
            />
          )}
        </ul>
        {query.domain && domainMessages[query.domain] && (
          <p className="text-sm text-muted-foreground">{domainMessages[query.domain]}</p>
        )}
        {dns && domainConnected !== true && (
          <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
            <p className="font-medium">DNS record for {instance.customDomain}</p>
            <table className="w-full text-left">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="pr-4 font-medium">Type</th>
                  <th className="pr-4 font-medium">Name</th>
                  <th className="font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pr-4">{dns.type}</td>
                  <td className="pr-4">{dns.name}</td>
                  <td className="break-all">{dns.value}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="programs-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="programs-heading" className="text-xl font-semibold">Programs</h2>
          <Button asChild size="sm" className="gap-1">
            <Link href={`/instances/${instance.slug}/programs/new`}>
              <Plus aria-hidden="true" className="h-4 w-4" /> New program
            </Link>
          </Button>
        </div>
        {programs.length === 0 ? (
          <p className="text-muted-foreground">
            A program says what your customers track while they use your product, such as their dose, weight, side
            effects and blood markers. Each person gets a before/after report, and you see totals.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {programs.map((program) => (
              <li key={program.id}>
                <Link
                  href={`/instances/${instance.slug}/programs/${program.slug}`}
                  className="flex flex-col gap-1 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{program.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {program.items.length} things to track · follow-up at week {program.followUpWeeks}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="branding-heading" className="space-y-4">
        <h2 id="branding-heading" className="text-xl font-semibold">Branding</h2>
        <InstanceForm
          action={updateInstanceAction.bind(null, instance.slug)}
          instance={instance}
          submitLabel="Save changes"
          siteHost={new URL(site).host}
        />
      </section>
    </div>
  )
}
