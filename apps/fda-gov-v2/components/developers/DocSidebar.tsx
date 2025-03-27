"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronRight, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SidebarItem {
  title: string
  id: string
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Getting Started",
    id: "getting-started",
    children: [
      { title: "Introduction", id: "introduction" },
      { title: "Authentication", id: "authentication" },
      { title: "Making Your First Request", id: "first-request" },
    ],
  },
  {
    title: "Core Concepts",
    id: "core-concepts",
    children: [
      { title: "Requests & Responses", id: "requests-responses" },
      { title: "Error Handling", id: "error-handling" },
      { title: "Pagination", id: "pagination" },
      { title: "Rate Limiting", id: "rate-limiting" },
    ],
  },
  {
    title: "Authentication",
    id: "auth",
    children: [
      { title: "API Keys", id: "api-keys" },
      { title: "OAuth 2.0", id: "oauth2" },
      { title: "Scopes", id: "scopes" },
      { title: "Token Management", id: "token-management" },
    ],
  },
  {
    title: "Endpoints",
    id: "endpoints",
    children: [
      { title: "Clinical Trials", id: "trials-endpoints" },
      { title: "Outcome Labels", id: "outcomes-endpoints" },
      { title: "Comparative Effectiveness", id: "effectiveness-endpoints" },
      { title: "User Data", id: "user-endpoints" },
    ],
  },
  {
    title: "Guides",
    id: "guides",
    children: [
      { title: "Integrating with EHR Systems", id: "ehr-integration" },
      { title: "Building a Trial Finder", id: "trial-finder" },
      { title: "Implementing OAuth Flow", id: "oauth-implementation" },
    ],
  },
  {
    title: "SDKs & Libraries",
    id: "sdks",
    children: [
      { title: "JavaScript SDK", id: "javascript-sdk" },
      { title: "Python SDK", id: "python-sdk" },
      { title: "Ruby SDK", id: "ruby-sdk" },
    ],
  },
  {
    title: "Reference",
    id: "reference",
    children: [
      { title: "API Status", id: "api-status" },
      { title: "Changelog", id: "changelog" },
      { title: "Support", id: "support" },
    ],
  },
]

export function DocSidebar() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    sidebarItems.reduce((acc, item) => ({ ...acc, [item.id]: true }), {}),
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filterItems = (items: SidebarItem[], query: string): SidebarItem[] => {
    if (!query.trim()) return items

    return items
      .map((section) => {
        // Check if section title matches
        const sectionMatches = section.title.toLowerCase().includes(query.toLowerCase())

        // Filter children that match
        const matchingChildren = section.children
          ? section.children.filter((child) => child.title.toLowerCase().includes(query.toLowerCase()))
          : []

        // Include section if its title matches or if it has matching children
        if (sectionMatches || matchingChildren.length > 0) {
          return {
            ...section,
            children: matchingChildren.length > 0 ? matchingChildren : section.children,
          }
        }

        return null
      })
      .filter(Boolean) as SidebarItem[]
  }

  // Handle smooth scrolling without ResizeObserver issues
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      // Use window.scrollTo instead of scrollIntoView to avoid ResizeObserver issues
      const yOffset = -80 // Adjust this value based on your header height
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset

      window.scrollTo({
        top: y,
        behavior: "smooth",
      })

      // Close mobile menu after navigation on small screens
      if (window.innerWidth < 1024) {
        setMobileMenuOpen(false)
      }
    }
  }

  // Set up event listener for mobile menu toggle button
  useEffect(() => {
    const toggleButton = document.getElementById("mobile-doc-menu-toggle")
    if (toggleButton) {
      const handleClick = () => setMobileMenuOpen(true)
      toggleButton.addEventListener("click", handleClick)
      return () => toggleButton.removeEventListener("click", handleClick)
    }
  }, [])

  // Clean up any potential observers on unmount
  useEffect(() => {
    return () => {
      // Explicitly clean up any potential observers
      if (sidebarRef.current) {
        // This forces any potential observers to disconnect
        sidebarRef.current.style.height = "auto"
      }
    }
  }, [])

  const filteredItems = filterItems(sidebarItems, searchQuery)

  const SidebarContent = () => (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>

      <nav className="space-y-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((section) => (
            <div key={section.id} className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-between font-medium"
                onClick={() => toggleSection(section.id)}
              >
                {section.title}
                <ChevronRight
                  className={cn("h-4 w-4 transition-transform", openSections[section.id] ? "rotate-90" : "")}
                />
              </Button>

              {openSections[section.id] && section.children && (
                <div className="ml-4 space-y-1 border-l pl-2">
                  {section.children.map((child) => (
                    <Button
                      key={child.id}
                      variant="ghost"
                      className="w-full justify-start text-sm font-normal"
                      onClick={() => scrollToSection(child.id)}
                    >
                      {child.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">No results found for "{searchQuery}"</div>
        )}
      </nav>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="w-full lg:w-64 shrink-0" ref={sidebarRef}>
        <div className="lg:sticky lg:top-20">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[350px] overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>Documentation</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

