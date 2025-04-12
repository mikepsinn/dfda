import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DeveloperTechnicalAdvantages() {
  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-center mb-6">Technical Advantages</h2>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
            <h3 className="font-medium">HIPAA Compliant</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Built with privacy and security at its core, ensuring all patient data is handled according to
              healthcare regulations
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
            </div>
            <h3 className="font-medium">Standardized Health Data</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Access to FHIR-compatible data formats and standardized medical terminologies (SNOMED CT, ICD-11,
              etc.)
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
              </svg>
            </div>
            <h3 className="font-medium">Webhooks & Real-time Updates</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Receive instant notifications about trial updates, new outcome data, and patient activities
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 