import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TrialPaymentForm } from "./components/trial-payment-form"

// Keep this a Server Component
export default function TrialPaymentPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href={`/app/(protected)/patient/trial-details/${params.id}`} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to trial details</span>
              </Link>
              <h1 className="text-2xl font-bold">Trial Enrollment Payment</h1>
            </div>
            <TrialPaymentForm trialId={params.id} />
          </div>
        </div>
      </main>
    </div>
  )
}

