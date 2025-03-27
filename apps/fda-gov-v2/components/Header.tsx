"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, ChevronDown, ChevronUp, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [userInitials, setUserInitials] = useState("")
  const supabase = createClient()

  useEffect(() => {
    // Get initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user?.user_metadata?.name) {
        const name = session.user.user_metadata.name
        setUserInitials(name.split(' ').map(n => n[0]).join('').toUpperCase())
      } else {
        setUserInitials(session?.user?.email?.[0].toUpperCase() ?? 'U')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user?.user_metadata?.name) {
        const name = session.user.user_metadata.name
        setUserInitials(name.split(' ').map(n => n[0]).join('').toUpperCase())
      } else {
        setUserInitials(session?.user?.email?.[0].toUpperCase() ?? 'U')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

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
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 pl-2">
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

          {user ? (
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
                    <User className="mr-2 h-4 w-4" />
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
            <div className="border-t my-2 pt-4">
              {user ? (
                <>
                  <Link href="/user/profile" className="block mb-3">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Button 
                    className="w-full flex items-center justify-center gap-2 text-red-600" 
                    variant="outline"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block mb-3">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}

