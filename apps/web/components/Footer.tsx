import { InternalLink } from "./internal-link"
import { BrandMark } from "./BrandMark"

interface FooterProps {
  siteName: string
}

export function Footer({ siteName }: FooterProps) {
  return (
    <footer className="w-full border-t py-6">
      <div className="container px-4 md:px-6 mx-auto flex flex-col items-center gap-4">
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <InternalLink navKey="terms" className="text-sm font-medium hover:underline">
            Terms of Service
          </InternalLink>
          <InternalLink navKey="privacy" className="text-sm font-medium hover:underline">
            Privacy Policy
          </InternalLink>
          <InternalLink navKey="developers" className="text-sm font-medium hover:underline">
            Developers
          </InternalLink>
          <InternalLink navKey="contact" className="text-sm font-medium hover:underline">
            Contact
          </InternalLink>
        </nav>
        <div className="flex items-center gap-2">
          <BrandMark className="h-6 w-6" />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </div>
        <p className="max-w-2xl text-center text-xs text-muted-foreground">
          {siteName} is an independent project. It is not affiliated with,
          endorsed by, or acting on behalf of the U.S. Food and Drug Administration.
        </p>
      </div>
    </footer>
  )
}

