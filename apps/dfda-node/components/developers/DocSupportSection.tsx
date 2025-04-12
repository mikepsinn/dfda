import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function DocSupportSection() {
  return (
    <section id="support" className="mb-10">
      <h2 className="text-3xl font-bold mb-4">Support & Resources</h2>
      <p className="text-muted-foreground mb-4">
        Need help with the FDA.gov v2 API? Here are some resources to help you get started and resolve any issues you
        may encounter.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2">Developer Community</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Join our developer community to ask questions, share solutions, and connect with other developers.
          </p>
          <Button variant="outline" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" /> Join Community Forum
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2">GitHub Issues</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Report bugs, request features, or contribute to our open-source SDKs on GitHub.
          </p>
          <Button variant="outline" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" /> View GitHub Repository
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2">Email Support</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contact our developer support team for assistance with integration issues.
          </p>
          <Button variant="outline" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" /> Contact Support
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2">API Status</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Check the current status of the API and view any ongoing incidents.
          </p>
          <Button variant="outline" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" /> View API Status
          </Button>
        </div>
      </div>
    </section>
  )
} 