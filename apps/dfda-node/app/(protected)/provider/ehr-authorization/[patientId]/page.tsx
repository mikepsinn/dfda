import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EhrAuthorizationForm } from "./components/ehr-authorization-form"

// Keep this a Server Component
export default function EhrAuthorizationPage({ params }: { params: { patientId: string } }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/app/(protected)/provider/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">EHR Data Authorization</h1>
            </div>
            <EhrAuthorizationForm patientId={params.patientId} />
          </div>
        </div>
      </main>
    </div>
  )
}

