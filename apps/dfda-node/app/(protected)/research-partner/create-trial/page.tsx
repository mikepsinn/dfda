import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CreateTrialWizard } from "./components/create-trial-wizard"

// Keep this a Server Component
export default function CreateTrialPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/research-partner/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Create a Decentralized Clinical Trial</h1>
            </div>

            <CreateTrialWizard />
          </div>
        </div>
      </main>
    </div>
  )
}

