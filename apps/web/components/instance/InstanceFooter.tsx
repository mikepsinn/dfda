import Link from "next/link"
import { InternalLink } from "@/components/internal-link"
import { isLegalPage, pagePath, type PageLink } from "@/lib/instance/pages"
import { SiteLogo } from "./SiteLogo"

/**
 * The footer of a company instance: its programs, its content pages and the
 * legal pages (the company's own when it has them). The site is the company's
 * own, so it names no one else.
 */
export function InstanceFooter({ brand, pages }: { brand: { name: string; logoUrl: string | null }; pages: PageLink[] }) {
  const title = (slug: string, fallback: string) => pages.find((page) => page.slug === slug)?.title ?? fallback
  return (
    <footer className="w-full border-t py-6">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 md:px-6">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <Link href="/programs" className="text-sm font-medium hover:underline">
            Programs
          </Link>
          {pages
            .filter((page) => !isLegalPage(page.slug))
            .map((page) => (
              <Link key={page.slug} href={pagePath(page.slug)} className="text-sm font-medium hover:underline">
                {page.title}
              </Link>
            ))}
          <InternalLink navKey="terms" className="text-sm font-medium hover:underline">
            {title("terms", "Terms of Service")}
          </InternalLink>
          <InternalLink navKey="privacy" className="text-sm font-medium hover:underline">
            {title("privacy", "Privacy Policy")}
          </InternalLink>
        </nav>
        <div className="flex items-center gap-2">
          <SiteLogo brand={brand} className="flex h-6 w-6 text-xs" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
