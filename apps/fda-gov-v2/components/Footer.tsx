import Link from "next/link"
import { Beaker } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex items-center gap-2">
          <Beaker className="h-6 w-6 text-primary" />
          <p className="text-sm text-muted-foreground">© 2025 FDA.gov v2. All rights reserved.</p>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-sm font-medium hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm font-medium hover:underline">
            Privacy
          </Link>
          <Link href="/developers" className="text-sm font-medium hover:underline">
            Developers
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:underline">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  )
}

