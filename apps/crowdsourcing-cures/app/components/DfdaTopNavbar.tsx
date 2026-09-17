"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "next-auth"
import { useSession } from "next-auth/react"
import { ChevronDown, Menu } from "lucide-react"

import type { NavItem } from "@/types"
import { getNavigationForDomain } from "@/config/navigation"
import { Icons } from "@/components/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { UserNavDisplay } from "@/components/user/user-nav-display"
import { cn } from "@/lib/utils"

import { DfdaLogoNavMenu } from "./dfda-logo-nav"

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  user?: Pick<User, "name" | "image" | "email">
  domain?: string
  logoNavItems?: NavItem[]
  topNavItems?: NavItem[]
  exploreNavItems?: NavItem[]
  avatarNavItems?: NavItem[]
}

function isExternalLink(item: NavItem) {
  return item.external || item.href.startsWith("http")
}

function isActiveLink(pathname: string, href: string) {
  if (href.startsWith("http")) return false
  if (href === "/") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

type MenuLinkProps = Omit<
  React.ComponentPropsWithoutRef<typeof Link>,
  "href"
> & {
  item: NavItem
  pathname: string
}

const MenuLink = React.forwardRef<HTMLAnchorElement, MenuLinkProps>(
  ({ item, pathname, className, ...props }, ref) => {
    const active = isActiveLink(pathname, item.href)
    const Icon = item.icon ? Icons[item.icon] : null

    return (
      <Link
        ref={ref}
        {...props}
        href={item.disabled ? "/" : item.href}
        aria-current={active ? "page" : undefined}
        title={item.tooltip}
        className={cn(
          "group flex items-center gap-2 font-black outline-none transition-transform focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          className,
          active && "bg-black text-white"
        )}
        {...(isExternalLink(item)
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
        <span>{item.title}</span>
      </Link>
    )
  }
)
MenuLink.displayName = "MenuLink"

export default function DfdaTopNavbar({
  user,
  domain = "dfda.earth",
  logoNavItems,
  topNavItems,
  exploreNavItems,
  avatarNavItems,
  className,
  ...props
}: NavbarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const displayedUser = user?.email ? user : session?.user
  const navigation = getNavigationForDomain(domain)
  const primaryItems = topNavItems ?? navigation.topNav
  const exploreItems =
    exploreNavItems ??
    navigation.exploreNav ??
    navigation.sidebarNav.filter(
      (item) =>
        !primaryItems.some((primaryItem) => primaryItem.href === item.href)
    )
  const accountItems = avatarNavItems ?? navigation.avatarNav

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 -mx-4 mb-8 select-none border-y-4 border-black bg-yellow-300/95 px-4 shadow-[0_6px_0_0_#000] backdrop-blur md:-mx-8 md:px-8",
        className
      )}
      {...props}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3"
      >
        <div className="shrink-0 [&_img]:h-auto [&_img]:w-[150px] sm:[&_img]:w-[190px] lg:[&_img]:w-[175px] xl:[&_img]:w-[220px]">
          <DfdaLogoNavMenu navItems={logoNavItems} />
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 xl:flex">
          {primaryItems.map((item) => (
            <MenuLink
              key={item.href}
              item={item}
              pathname={pathname}
              className="rounded-md px-2 py-2 text-sm hover:-translate-y-0.5 hover:bg-white"
            />
          ))}

          {exploreItems.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1 flex items-center gap-1 rounded-md border-2 border-black bg-pink-400 px-3 py-1.5 text-sm font-black shadow-[2px_2px_0_0_#000] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Explore
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[34rem] max-w-[calc(100vw-2rem)] border-4 border-black bg-yellow-100 p-2 text-black shadow-[6px_6px_0_0_#000]"
              >
                <DropdownMenuLabel className="px-3 py-2 text-base font-black">
                  More ways to explore
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-black" />
                <div className="grid grid-cols-2 gap-1 py-1">
                  {exploreItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild className="p-0">
                      <MenuLink
                        item={item}
                        pathname={pathname}
                        className="rounded-sm px-3 py-2.5 text-sm text-black hover:bg-pink-200 focus:bg-pink-200"
                      />
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-black bg-pink-400 shadow-[3px_3px_0_0_#000] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 xl:hidden"
                aria-label="Open navigation menu"
              >
                <Menu aria-hidden="true" className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(90vw,24rem)] overflow-y-auto border-l-4 border-black bg-yellow-100 px-5 pb-8 pt-12 text-black shadow-[-6px_0_0_0_#000]"
            >
              <SheetHeader className="border-b-4 border-black pb-4 text-left">
                <SheetTitle className="text-2xl font-black text-black">
                  Explore the research
                </SheetTitle>
                <SheetDescription className="font-medium text-black/70">
                  Find evidence about conditions, treatments, outcomes, and what
                  works.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-black/60">
                  Research
                </p>
                <div className="grid gap-2">
                  {primaryItems.map((item) => (
                    <MenuLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:bg-yellow-200"
                    />
                  ))}
                </div>
              </div>

              {exploreItems.length ? (
                <div className="mt-7">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-black/60">
                    More ways to explore
                  </p>
                  <div className="grid gap-1">
                    {exploreItems.map((item) => (
                      <MenuLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2.5 hover:bg-pink-200"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>

          <UserNavDisplay
            user={{
              name: displayedUser?.name,
              image: displayedUser?.image,
              email: displayedUser?.email,
            }}
            avatarNavItems={accountItems}
          />
        </div>
      </nav>
    </header>
  )
}
