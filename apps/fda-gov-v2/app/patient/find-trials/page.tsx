import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Shield, Wallet, Percent, Home } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchContainer } from "./components/search-container"
import { PatientBenefits } from "./components/patient-benefits"
import { HealthJourney } from "./components/health-journey"
import { getConditions } from "@/lib/api/conditions"

export const metadata: Metadata = {
  title: "Find Clinical Trials | Decentralized FDA",
  description:
    "Search for clinical trials by condition and discover evidence-based treatments ranked by effectiveness.",
}

// Updated patient-focused benefits
const patientBenefits = [
  {
    icon: Percent,
    title: "80% Lower Cost",
    description: "Access treatments at a fraction of traditional healthcare costs.",
  },
  {
    icon: Home,
    title: "100% Decentralized",
    description: "Participate entirely from home with no travel or clinic visits required.",
  },
  {
    icon: Shield,
    title: "Enhanced Monitoring",
    description: "Receive closer health monitoring and personalized medical attention.",
  },
  {
    icon: Wallet,
    title: "Transparent Pricing",
    description: "Clear, upfront pricing with no hidden fees or surprise costs.",
  },
]

export default async function FindTrials() {
  // Fetch conditions for search suggestions
  const conditions = await getConditions()

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Find Clinical Trials</h1>
            </div>

            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Search Interventions by Condition</CardTitle>
                <CardDescription>Find evidence-based treatments ranked by effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <SearchContainer initialConditions={conditions} />
              </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <PatientBenefits benefits={patientBenefits} />
              <HealthJourney />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

