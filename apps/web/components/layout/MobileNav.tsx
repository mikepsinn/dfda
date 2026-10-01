"use client"

import Link from "next/link"
import { useState } from "react"
import { Beaker, Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { NavItem } from "@/lib/types/navigation"
import { Button } from "@/components/ui/button"

interface MobileNavProps {
  navItems: NavItem[]
  siteName: string
}

export function MobileNav({ navItems, siteName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden" // Phones and tablets: the desktop links need about 1,000 px
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open menu</span>
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[250px] sm:w-[300px]">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle>
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setIsOpen(false)} // Close sheet on logo click
              >
                <Beaker aria-hidden="true" className="h-6 w-6 flex-shrink-0 text-primary" />
                <span>{siteName}</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              !item.hideInNav && (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium py-2 hover:text-primary flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  {item.emoji && <span className="mr-2">{item.emoji}</span>}
                  {item.title}
                </Link>
              )
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
