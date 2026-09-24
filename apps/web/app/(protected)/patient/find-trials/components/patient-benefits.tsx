import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BenefitProps {
  icon: LucideIcon
  title: string
  description: string
}

interface PatientBenefitsProps {
  benefits: BenefitProps[]
}

export function PatientBenefits({ benefits }: PatientBenefitsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
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
            className="h-5 w-5 text-primary"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Patient Benefits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon

            return (
              <div key={index} className="flex items-start space-x-3 rounded-lg border p-3">
                <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

