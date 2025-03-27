"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // Primary navigation items (most important)
  const primaryNavItems = [
    {
      title: "Sponsors",
      href: "/sponsor",
    },
    {
      title: "Patients",
      href: "/patient",
    },
    {
      title: "Providers",
      href: "/doctor/dashboard",
    },
  ]

  // Secondary navigation items (in the "More" dropdown)
  const secondaryNavItems = [
    {
      title: "Developers",
      href: "/developers",
    },
    {
      title: "How It Works",
      href: "/#how-it-works",
    },
    {
      title: "About",
      href: "/#key-benefits",
    },
  ]

  // All navigation items for mobile menu
  const allNavItems = [...primaryNavItems, ...secondaryNavItems]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/dfda-logo.png" alt="dFDA Logo" width={28} height={28} className="h-7 w-7" />
            <span className="text-xl font-bold">FDA.gov v2</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          {/* Primary Nav Items */}
          {primaryNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium hover:underline">
              {item.title}
            </Link>
          ))}

          {/* More Dropdown */}
          <DropdownMenu open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-sm font-medium hover:underline">
                More {isMoreOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryNavItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.title}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(true)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>

          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Register</Button>
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[250px] sm:w-[300px]">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle>
              <div className="flex items-center gap-2">
                <Image src="/images/dfda-logo.png" alt="dFDA Logo" width={24} height={24} className="h-6 w-6" />
                <span>FDA.gov v2</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium py-2 hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {item.title}
              </Link>
            ))}
            <div className="border-t my-2 pt-4">
              <Link href="/login" className="block mb-3">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full">Register</Button>
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}

