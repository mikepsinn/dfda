import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ExternalLink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstanceForm } from "@/components/instance/InstanceForm"
import { ImportKeyForm, InviteClinicianForm } from "@/components/care-team/CareForms"
import {
  cancelInvitationAction,
  createImportKeyAction,
  inviteClinicianAction,
  removeClinicianAction,
  revokeImportKeyAction,
} from "@/lib/actions/care-team"
import { updateInstanceAction } from "@/lib/actions/instances"
import { careTeam, careTeamInvitations, invitationUrl } from "@/lib/care-team/data"
import { importKeys } from "@/lib/care-team/import"
import { getUserDb } from "@/lib/db/server"
import { env } from "@/lib/env"
import { companySiteOrigin, toBranding } from "@/lib/instance/hosts"
import { listPages } from "@/lib/instance/page-data"
import { isLegalPage } from "@/lib/instance/pages"
import { dnsRecordFor, isDomainConfigured } from "@/lib/instance/vercel-domains"
import { listPrograms } from "@/lib/programs/data"
import { formatDate } from "@/lib/programs/format"
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

  const instance = toBranding(row)
  const site = siteOrigin()
  const [domainConnected, programs, pages, team, invitations, keys] = await Promise.all([
    instance.customDomain ? isDomainConfigured(instance.customDomain, instance.slug) : null,
    listPrograms(instance.slug),
    listPages(instance.slug),
    careTeam(user, row.id),
    careTeamInvitations(user, row.id),
    importKeys(user, row.id),
  ])
  const endpoint = `${site}/api/v1/biomarker-reports`
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
                    ? "Not connected yet. It connects when the DNS record below points here and the domain answers as this site."
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
            <p className="text-muted-foreground">
              On Cloudflare, set the record&rsquo;s proxy status to &ldquo;DNS only&rdquo;. Behind the proxy, this page cannot
              see the record, and invitations use the preview link.
            </p>
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

      <section aria-labelledby="pages-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="pages-heading" className="text-xl font-semibold">Pages</h2>
          <Button asChild size="sm" variant="outline" className="gap-1">
            <Link href={`/instances/${instance.slug}/pages/new`}>
              <Plus aria-hidden="true" className="h-4 w-4" /> New page
            </Link>
          </Button>
        </div>
        {pages.length === 0 ? (
          <p className="text-muted-foreground">
            Pages of text on your site, such as what you measure, how your service works, an FAQ, or your own terms of
            service and privacy policy.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/instances/${instance.slug}/pages/${page.slug}`}
                  className="flex flex-col gap-1 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{page.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {isLegalPage(page.slug) ? `Replaces the network's /${page.slug}` : page.inMenu ? "In the top menu" : "In the footer"}{" "}
                    · changed {formatDate(page.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="care-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="care-heading" className="text-xl font-semibold">Care team</h2>
          {team.some((member) => member.userId === user.id) && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/instances/${instance.slug}/care`}>Open the care area</Link>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          The clinicians who review the lab reports of your members. In a program with care team review, every member
          shares their reports with the care team; in the other programs, each member chooses. The care team sees the
          name and reports of the members who share, adds new reports and signs them off. You see totals only. To review
          reports yourself, enter your own email.
        </p>
        {team.length > 0 && (
          <ul className="divide-y rounded-xl border">
            {team.map((member) => (
              <li key={member.userId} className="flex items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{member.name}</span>
                  <span className="block break-all text-sm text-muted-foreground">{member.email}</span>
                </span>
                <form action={removeClinicianAction.bind(null, instance.slug, member.userId)}>
                  <Button type="submit" variant="outline" size="sm">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {invitations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Open invitations</h3>
            <ul className="divide-y rounded-xl border" aria-label="Open invitations">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex items-center gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block break-all font-medium">{invitation.email}</span>
                    <span className="block text-sm text-muted-foreground">Invited {formatDate(invitation.createdAt)}</span>
                    <span className="block break-all text-xs text-muted-foreground">{invitationUrl(instance.slug, invitation.id, companySiteOrigin(instance, domainConnected))}</span>
                  </span>
                  <form action={cancelInvitationAction.bind(null, instance.slug, invitation.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      Cancel
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              The clinician joins when they open the link and sign in with the invited email.
            </p>
          </div>
        )}
        <InviteClinicianForm action={inviteClinicianAction.bind(null, instance.slug)} />
      </section>

      <section aria-labelledby="import-heading" className="space-y-3">
        <h2 id="import-heading" className="text-xl font-semibold">Report import</h2>
        <p className="text-sm text-muted-foreground">
          Your laboratory can send each biomarker report to the care team directly, with an import key. The report goes
          to the member with the email in the request, when that member shares their reports with the care team. The
          member and the care team then get an email, as when a clinician adds the report.
        </p>
        {keys.length > 0 && (
          <ul className="divide-y rounded-xl border" aria-label="Import keys">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{key.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{key.prefix}…</span>
                  <span className="block text-sm text-muted-foreground">
                    Created {formatDate(key.createdAt)} · {key.lastUsedAt ? `last used ${formatDate(key.lastUsedAt)}` : "not used yet"}
                  </span>
                </span>
                <form action={revokeImportKeyAction.bind(null, instance.slug, key.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    Revoke
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ImportKeyForm action={createImportKeyAction.bind(null, instance.slug)} endpoint={endpoint} />
        <details className="space-y-2 text-sm">
          <summary className="cursor-pointer font-medium">The request</summary>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{`POST ${endpoint}
Authorization: Bearer <key>
Content-Type: application/json

{
  "program": "${programs[0]?.slug ?? "glp-1"}",
  "email": "member@example.com",
  "externalId": "the laboratory's own id of the report",
  "report": { the report file }
}`}</pre>
          <p className="text-muted-foreground">
            The report file has the format of the{" "}
            <a href="/reports/example.json" className="font-medium text-primary underline">
              example report file
            </a>
            . The answer is 201 with the report&rsquo;s id for a new report, and 200 for a report sent again with the
            same externalId. It is 400 with the problems for a report that is not valid, and 404 when no member of the
            program with that email shares their reports.
          </p>
        </details>
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
