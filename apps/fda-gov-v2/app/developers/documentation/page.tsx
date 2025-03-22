import Link from "next/link"
import { ArrowLeft, Menu } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { DocSidebar } from "@/components/developers/DocSidebar"
import { DocContent } from "@/components/developers/DocContent"
import { Button } from "@/components/ui/button"

export default function DeveloperDocumentation() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/developers" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Developer Portal</span>
              </Link>
              <h1 className="text-2xl font-bold">API Documentation</h1>
            </div>
            <div className="lg:hidden">
              <Button variant="outline" size="sm" id="mobile-doc-menu-toggle">
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Wrap DocSidebar in a div with fixed dimensions to prevent ResizeObserver issues */}
            <div className="w-full lg:w-64 shrink-0 hidden lg:block" id="doc-sidebar-container">
              <DocSidebar />
            </div>
            <div className="flex-1">
              <DocContent />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

