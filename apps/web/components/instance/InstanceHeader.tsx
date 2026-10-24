"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProfileTimezone } from "@/components/layout/use-profile-timezone"
import type { Profile } from "@/lib/actions/profiles"
import type { AuthUser as User } from "@/lib/auth"
import type { MenuLink } from "@/lib/instance/menu"
import { pagePath, type PageLink } from "@/lib/instance/pages"
import { authClient } from "@/lib/auth-client"
import { SiteLogo } from "./SiteLogo"

/**
 * The header of a company instance: its logo and name, the menu for the
 * person's roles on the site (lib/instance/menu.ts), its menu pages, and
 * sign-in. On a phone the links are in one list behind the menu icon, at the
 * right. No links to the network's pages.
 */
export function InstanceHeader({
  brand,
  links,
  pages,
  initialUser,
  initialProfile,
}: {
  brand: { name: string; logoUrl: string | null }
  links: MenuLink[]
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

  const items: MenuLink[] = [...links, ...pages.filter((page) => page.inMenu).map((page) => ({ href: pagePath(page.slug), label: page.title }))]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <SiteLogo brand={brand} className="flex h-8 w-8 shrink-0" />
          <span className="truncate font-bold sm:text-lg">{brand.name}</span>
        </Link>
        <nav aria-label="Main" className="flex shrink-0 items-center gap-1 sm:gap-2">
          {items.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href={item.href}>
                {item.label}
                {item.count ? <MenuCount count={item.count} /> : null}
              </Link>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Menu" className="md:hidden">
                <Menu aria-hidden="true" className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {items.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>
                    {item.label}
                    {item.count ? <MenuCount count={item.count} /> : null}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}

/** The number of things that wait, such as reports to review, next to a menu link. */
function MenuCount({ count }: { count: number }) {
  return (
    <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
      {count}
      <span className="sr-only"> to review</span>
    </span>
  )
}
