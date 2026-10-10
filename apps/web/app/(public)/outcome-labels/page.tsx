import Link from "next/link"
import { ArrowLeft, ArrowRight, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OutcomeLabelsTabsWrapper } from "@/components/OutcomeLabelsTabsWrapper"
import { Button } from "@/components/ui/button"
import { OutcomeLabelSearch } from "@/components/OutcomeLabelSearch"
import type { Metadata } from 'next';
import { getMetadataFromNavKey } from '@/lib/metadata';
import { medicalSnapshot } from '@/lib/demo/treatment-estimates';
import { getTreatmentVariables, getFoodVariables } from "@/lib/actions/global-variables"; // Import the actions

// Generate metadata using the helper function
export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey('outcome_labels');
}

// Make page component async
export default async function OutcomeLabels() {

  // Fetch data here
  const [treatmentData, foodData] = await Promise.all([
    getTreatmentVariables(9), // Fetch 9 items
    getFoodVariables(9)
  ]);

  return (
    <div className="py-6 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 space-y-2">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Outcome Labels</h1>
            </div>
            <p className="text-muted-foreground">
              An Outcome Label shows the estimated effects of a treatment, food or supplement on health outcomes,
              including side effects.
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Explore Outcome Labels</CardTitle>
                <CardDescription>Browse by category or search for specific interventions</CardDescription>
              </CardHeader>
              <CardContent>
                <OutcomeLabelSearch />
                {/* Pass fetched data as props */}
                <OutcomeLabelsTabsWrapper treatmentData={treatmentData} foodData={foodData} />
              </CardContent>
            </Card>

            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">Explore treatment rankings and Outcome Labels</h2>
              <p className="mt-2 text-sm text-muted-foreground">{medicalSnapshot.counts.treatmentComparisons.toLocaleString("en-US")} treatment comparisons across {medicalSnapshot.counts.conditions} conditions, with estimated benefits and side effects.</p>
              <Button asChild className="mt-4 gap-2"><Link href="/treatment-rankings">Compare treatments <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
            </div>

            <div className="rounded-lg border bg-card p-8 shadow-sm">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Contribute to Outcome Labels</h3>
                <p className="text-muted-foreground max-w-2xl">
                  Outcome Labels are continuously improved through new clinical trials, real-world evidence, and
                  patient-reported outcomes. Join us to contribute data and help create the most
                  comprehensive health information resource available.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="inline-block">
                    <Button size="lg">Join as a Patient</Button>
                  </div>
                  <div className="inline-block">
                    <Button size="lg" variant="outline">
                      Join as a Provider
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

