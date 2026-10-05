import Link from "next/link"
import { Button } from "@/components/ui/button"

// The institute's page (/institute) is a draft of the acceleratedmedicine.org home page, so it has
// its own header and footer instead of the app's sign-in navigation. The header matches the app's.
export const donateUrl = "https://acceleratedmedicine.org/donate"
export const instituteEmail = "hello@acceleratedmedicine.org"

const sections = [
  { href: "#how-it-works", label: "Your doctor's visit" },
  { href: "#benefits", label: "Benefits" },
  { href: "#partners", label: "Partners" },
]

const relatedProjects = [
  { href: "https://warondisease.org", label: "1% Treaty" },
  { href: "https://wishocracy.org", label: "Wishocracy" },
  { href: "https://courtofhumanity.org", label: "Court of Humanity" },
  { href: "https://manual.warondisease.org", label: "How to End War and Disease" },
]

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
]

export function InstituteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/institute"
          className="max-w-[9.5rem] text-sm font-bold leading-tight sm:max-w-none sm:text-base 2xl:text-xl">
          Institute for Accelerated Medicine
        </Link>
        <nav aria-label="Page sections" className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {sections.map(section => (
            <a key={section.href} href={section.href} className="hover:text-primary">{section.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href={donateUrl}>Donate</a>
          </Button>
          <Button asChild size="sm">
            <a href="#partner-form">Partner with us</a>
          </Button>
        </div>
      </div>
    </header>
  )
}

export function InstituteFooter() {
  return (
    <footer className="w-full border-t py-10">
      <div className="container mx-auto grid gap-8 px-4 text-sm sm:grid-cols-3 md:px-6">
        <div className="space-y-2">
          <p className="font-bold">Institute for Accelerated Medicine</p>
          <a href={`mailto:${instituteEmail}`} className="text-primary hover:underline">{instituteEmail}</a>
        </div>
        <FooterLinks title="Related projects" links={relatedProjects} />
        <FooterLinks title="Legal" links={legalLinks} />
      </div>
    </footer>
  )
}

function FooterLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold">{title}</p>
      <ul className="space-y-1">
        {links.map(link => (
          <li key={link.href}>
            <a href={link.href} className="text-muted-foreground hover:text-foreground hover:underline">{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
