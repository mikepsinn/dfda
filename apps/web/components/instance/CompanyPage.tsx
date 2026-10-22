import type { InstancePage } from "@/lib/instance/page-data"
import { MarkdownContent } from "./MarkdownContent"

/** A content page of a company's site: its title and its text. */
export function CompanyPage({ page }: { page: Pick<InstancePage, "title" | "body"> }) {
  return (
    <article className="mx-auto max-w-3xl space-y-8 py-6 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
      <MarkdownContent>{page.body}</MarkdownContent>
    </article>
  )
}
