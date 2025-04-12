import Link from "next/link"
import { ArrowLeft, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { TrialResultsTabs } from "./components/trial-results-tabs"

// Mock trial data (Ideally fetched in Server Component)
const getTrialData = (trialId: string) => {
  // In a real scenario, fetch data based on trialId here
  // For now, return the mock data structure
  return {
    id: trialId,
    name: "Efficacy of Treatment A for Type 2 Diabetes",
    research_partner: "Innovative Therapeutics Inc.",
    status: "Active",
    startDate: "Jan 15, 2025",
    endDate: "Jul 15, 2025",
    participants: {
      total: 342,
      active: 325,
      withdrawn: 17,
      completedFollowUp: 298,
    },
    demographics: {
      gender: { male: 45, female: 55 },
      ageGroups: { "18-30": 15, "31-45": 35, "46-60": 30, "61+": 20 },
      ethnicity: {
        White: 60,
        Black: 15,
        Hispanic: 12,
        Asian: 8,
        Other: 5,
      },
    },
    efficacy: {
      primaryEndpoint: {
        name: "HbA1c Reduction",
        treatmentGroup: -1.8,
        controlGroup: -0.4,
        pValue: 0.001,
      },
      secondaryEndpoints: [
        {
          name: "Fasting Plasma Glucose",
          treatmentGroup: -38,
          controlGroup: -12,
          pValue: 0.003,
          unit: "mg/dL",
        },
        {
          name: "Weight Change",
          treatmentGroup: -2.1,
          controlGroup: +0.3,
          pValue: 0.01,
          unit: "kg",
        },
      ],
    },
    safety: {
      adverseEvents: [
        { name: "Nausea", treatment: 18, control: 5 },
        { name: "Headache", treatment: 12, control: 10 },
        { name: "Dizziness", treatment: 8, control: 4 },
        { name: "Fatigue", treatment: 7, control: 6 },
      ],
      seriousEvents: [
        { name: "Hypoglycemia", treatment: 2, control: 0 },
        { name: "Allergic Reaction", treatment: 1, control: 0 },
      ],
    },
    // Add engagement data if needed
  }
}

export default async function TrialResultsPage({ params }: { params: { id: string } }) {
  const trialId = params.id
  const trialData = getTrialData(trialId) // Fetch or get mock data

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href={`/app/(protected)/research-partner/trials/${trialId}`} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to trial</span>
              </Link>
              <h1 className="text-2xl font-bold">Trial Results & Analytics</h1>
            </div>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/public">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/app/(protected)/research-partner/trials/${trialId}`} className="text-muted-foreground hover:text-foreground">
                    Trial Details
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink>Results</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>{trialData.name}</CardTitle>
                    <CardDescription>
                      {trialData.startDate} - {trialData.endDate}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-sm text-muted-foreground">Total Participants</div>
                    <div className="text-2xl font-bold">{trialData.participants.total}</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-sm text-muted-foreground">Active Participants</div>
                    <div className="text-2xl font-bold">{trialData.participants.active}</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-sm text-muted-foreground">Withdrawn</div>
                    <div className="text-2xl font-bold">{trialData.participants.withdrawn}</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-sm text-muted-foreground">Data Completion</div>
                    <div className="text-2xl font-bold">
                      {Math.round((trialData.participants.completedFollowUp / trialData.participants.total) * 100)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TrialResultsTabs trialData={trialData} />
          </div>
        </div>
      </main>
    </div>
  )
}

