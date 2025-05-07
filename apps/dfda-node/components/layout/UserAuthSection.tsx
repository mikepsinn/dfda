"use client"

import Link from "next/link"
import {
  User as UserIcon,
  LogOut,
  Settings,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { NavItem } from "@/lib/types/navigation"
import { useRouter } from 'next/navigation'

interface UserAuthSectionProps {
  user: User | null
  primaryNavItems?: NavItem[]
  secondaryNavItems?: NavItem[]
}

export function UserAuthSection({ user, primaryNavItems = [], secondaryNavItems = [] }: UserAuthSectionProps) {
  const supabase = createClient()
  const router = useRouter()

  const userInitials = user?.user_metadata?.name
    ? user.user_metadata.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user?.email?.[0].toUpperCase() ?? "U"

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-background">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            {primaryNavItems.map((item) => (
              !item.hideInDropdown && (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-center w-full gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />} 
                    {item.emoji && <span>{item.emoji}</span>}
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              )
            ))}

            {(primaryNavItems.length > 0 || secondaryNavItems.length > 0) && <DropdownMenuSeparator />} 
            <DropdownMenuItem asChild>
              <Link href="/user/profile" className="flex items-center w-full gap-2">
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/user/settings" className="flex items-center w-full gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="flex items-center w-full gap-2 text-red-600">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  } else {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className="hidden sm:inline-flex">
          <Button variant="outline">Sign In</Button>
        </Link>
        <Link href="/register">
          <Button>Register</Button>
        </Link>
      </div>
    )
  }
} 