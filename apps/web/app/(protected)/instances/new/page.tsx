import type { Metadata } from "next"
import { InstanceForm } from "@/components/instance/InstanceForm"
import { createInstanceAction } from "@/lib/actions/instances"
import { siteOrigin } from "@/lib/oauth-resources"

export const metadata: Metadata = { title: "Create your instance" }

export default function NewInstancePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create your instance</h1>
        <p className="max-w-2xl text-muted-foreground">
          Your customers track their treatments and outcomes on a site with your name, logo and color. It is live as
          soon as you save it.
        </p>
      </header>
      <InstanceForm action={createInstanceAction} submitLabel="Create instance" siteHost={new URL(siteOrigin()).host} />
    </div>
  )
}
