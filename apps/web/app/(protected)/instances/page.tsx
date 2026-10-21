import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { careTeamsOf } from "@/lib/care-team/data"
import { getUserDb } from "@/lib/db/server"
import { getServerUser } from "@/lib/server-auth"

export const metadata: Metadata = { title: "Your instances" }

export default async function InstancesPage() {
  const user = await getServerUser()
  const db = await getUserDb()
  const instances = user
    ? await db.instances.findMany({
        where: { owner_id: user.id },
        select: { slug: true, name: true, primary_color: true, custom_domain: true },
        orderBy: { created_at: "desc" },
      })
    : []
  const careTeams = user ? await careTeamsOf(user) : []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Your instances</h1>
        <Button asChild className="gap-2">
          <Link href="/instances/new">
            <Plus aria-hidden="true" className="h-4 w-4" /> Create an instance
          </Link>
        </Button>
      </div>
      {instances.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
          You have no instances yet. Create one to give your customers a site with your branding.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {instances.map((instance) => (
            <li key={instance.slug}>
              <Link href={`/instances/${instance.slug}`} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: instance.primary_color }} />
                <span className="font-medium">{instance.name}</span>
                <span className="ml-auto text-sm text-muted-foreground">{instance.custom_domain ?? `/i/${instance.slug}`}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {careTeams.length > 0 && (
        <section aria-labelledby="care-teams-heading" className="space-y-3">
          <h2 id="care-teams-heading" className="text-xl font-semibold">Care teams you are on</h2>
          <ul className="divide-y rounded-xl border">
            {careTeams.map((team) => (
              <li key={team.id}>
                <Link href={`/instances/${team.slug}/care`} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                  <span className="font-medium">{team.name}</span>
                  <span className="ml-auto text-sm text-muted-foreground">Patients</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
