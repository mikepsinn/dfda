"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, ChevronDown, ChevronUp, User as UserIcon, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { createClient } from '../lib/supabase/client'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from '@supabase/supabase-js'

interface NavItem {
  title: string
  href: string
}

interface HeaderProps {
  initialUser: User | null
}

export function Header({ initialUser }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const supabase = createClient()

  const userInitials = initialUser?.user_metadata?.name
    ? initialUser.user_metadata.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : initialUser?.email?.[0].toUpperCase() ?? 'U'

  const userType = initialUser?.user_metadata?.user_type ?? 'patient'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = []

    // Patient dashboard is accessible to all logged-in users
    if (initialUser) {
      items.push({
        title: "Patient Dashboard",
        href: "/patient/dashboard",
      })
      if (userType === 'patient') {
        items.push({
          title: "Treatments",
          href: "/patient/treatments",
        })
      }
    }

    // Doctor-specific items
    if (userType === 'doctor') {
      items.push({
        title: "Provider Dashboard",
        href: "/doctor/dashboard",
      })
    }

    // Sponsor-specific items
    if (userType === 'sponsor') {
      items.push({
        title: "Sponsor Dashboard",
        href: "/sponsor",
      })
    }

    return items
  }

  // Secondary navigation items (in the "More" dropdown)
  const secondaryNavItems: NavItem[] = [
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

  const primaryNavItems = getNavItems()
  const allNavItems = [...primaryNavItems, ...secondaryNavItems]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container px-4 md:px-6 mx-auto flex h-16 items-center justify-between">
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

          {initialUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                  <Link href="/user/profile" className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
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
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
