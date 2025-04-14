"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { NavItem } from "@/lib/navigation"
import { Button } from "@/components/ui/button"

interface MobileNavProps {
  navItems: NavItem[]
}

export function MobileNav({ navItems }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden" // Only show on mobile
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
                <Image
                  src="/images/dfda-logo.png"
                  alt="dFDA Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
                <span>FDA.gov v2</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium py-2 hover:text-primary"
                onClick={() => setIsOpen(false)} // Close sheet on item click
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
} 