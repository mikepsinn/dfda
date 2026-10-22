import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CompanyPage } from "@/components/instance/CompanyPage"
import { requireCurrentPage } from "@/lib/instance/page-data"
import { isLegalPage, pagePath } from "@/lib/instance/pages"

// A content page of the company instance of the request. The network's own site has none (404).

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const page = await requireCurrentPage((await params).page)
  return { title: page.title }
}

export default async function ContentPage({ params }: { params: Promise<{ page: string }> }) {
  const page = await requireCurrentPage((await params).page)
  // The company's terms and privacy policy have the network's addresses.
  if (isLegalPage(page.slug)) redirect(pagePath(page.slug))
  return <CompanyPage page={page} />
}
