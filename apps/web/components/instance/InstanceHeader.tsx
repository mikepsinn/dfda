"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useProfileTimezone } from "@/components/layout/use-profile-timezone"
import type { Profile } from "@/lib/actions/profiles"
import type { AuthUser as User } from "@/lib/auth"
import { pagePath, type PageLink } from "@/lib/instance/pages"
import { authClient } from "@/lib/auth-client"
import { SiteLogo } from "./SiteLogo"

/**
 * The header of a company instance: its logo and name, its programs, its menu
 * pages on wide screens (the footer links every page), and sign-in. No links
 * to the network's pages.
 */
export function InstanceHeader({
  brand,
  pages,
  initialUser,
  initialProfile,
}: {
  brand: { name: string; logoUrl: string | null }
  pages: PageLink[]
  initialUser: User | null
  initialProfile: Profile | null
}) {
  const router = useRouter()
  useProfileTimezone(initialUser, initialProfile)

  async function signOut() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <SiteLogo brand={brand} className="flex h-8 w-8 shrink-0" />
          <span className="truncate font-bold sm:text-lg">{brand.name}</span>
        </Link>
        <nav aria-label="Main" className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/programs">Programs</Link>
          </Button>
          {pages
            .filter((page) => page.inMenu)
            .map((page) => (
              <Button key={page.slug} asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link href={pagePath(page.slug)}>{page.title}</Link>
              </Button>
            ))}
          {initialUser ? (
            <Button type="button" variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
