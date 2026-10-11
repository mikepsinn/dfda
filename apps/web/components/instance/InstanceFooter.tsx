import Link from "next/link"
import { InternalLink } from "@/components/internal-link"
import { SiteLogo } from "./SiteLogo"

/** The footer of a company instance: its programs, the legal pages, and the network that runs it. */
export function InstanceFooter({
  brand,
  network,
}: {
  brand: { name: string; logoUrl: string | null }
  network: { name: string; url: string }
}) {
  return (
    <footer className="w-full border-t py-6">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 md:px-6">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <Link href="/programs" className="text-sm font-medium hover:underline">
            Programs
          </Link>
          <InternalLink navKey="terms" className="text-sm font-medium hover:underline">
            Terms of Service
          </InternalLink>
          <InternalLink navKey="privacy" className="text-sm font-medium hover:underline">
            Privacy Policy
          </InternalLink>
        </nav>
        <div className="flex items-center gap-2">
          <SiteLogo brand={brand} className="flex h-6 w-6 text-xs" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a href={network.url} className="font-medium hover:underline">
            {network.name}
          </a>
        </p>
      </div>
    </footer>
  )
}
