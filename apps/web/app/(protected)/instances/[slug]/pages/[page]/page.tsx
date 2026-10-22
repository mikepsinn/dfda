import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageForm } from "@/components/instance/PageForm"
import { deletePageAction, updatePageAction } from "@/lib/actions/instance-pages"
import { findPage } from "@/lib/instance/page-data"
import { pagePath } from "@/lib/instance/pages"
import { previewPath, requireOwnedInstance } from "@/lib/programs/owner"

export const metadata: Metadata = { title: "Page" }

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; page: string }>
  searchParams: Promise<{ created?: string; saved?: string }>
}) {
  const [{ slug, page: pageSlug }, query] = await Promise.all([params, searchParams])
  const { instance } = await requireOwnedInstance(slug)
  const page = await findPage(instance.slug, pageSlug)
  if (!page) notFound()

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-3">
        <Link href={`/instances/${instance.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {instance.name}
        </Link>
        {(query.created || query.saved) && (
          <p role="status" className="flex items-center gap-2 font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            {query.created ? "The page is live on your site." : "Your changes are saved."}
          </p>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-2 self-start">
            <a href={previewPath(instance.slug, pagePath(page.slug))} target="_blank" rel="noopener noreferrer">
              Open on your site <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </header>
      <PageForm
        // A new key after each save, so the form shows the saved values.
        key={page.updatedAt.toISOString()}
        action={updatePageAction.bind(null, instance.slug, page.slug)}
        deleteAction={deletePageAction.bind(null, instance.slug, page.slug)}
        initial={{ title: page.title, slug: page.slug, body: page.body, inMenu: page.inMenu }}
        submitLabel="Save changes"
      />
    </div>
  )
}
