import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageForm } from "@/components/instance/PageForm"
import { createPageAction } from "@/lib/actions/instance-pages"
import { requireOwnedInstance } from "@/lib/programs/owner"

export const metadata: Metadata = { title: "New page" }

export default async function NewPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { instance } = await requireOwnedInstance(slug)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <Link href={`/instances/${instance.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {instance.name}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New page</h1>
        <p className="max-w-2xl text-muted-foreground">
          A page of text on your site, such as what you measure, how your service works, or an FAQ. Everyone who
          visits your site can read it.
        </p>
      </header>
      <PageForm
        action={createPageAction.bind(null, instance.slug)}
        initial={{ title: "", slug: "", body: "", inMenu: false }}
        submitLabel="Create page"
      />
    </div>
  )
}
