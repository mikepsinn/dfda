import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

interface PatientStepProps {
  stepNumber: number
  title: string
  icon: ReactNode
  description: string
  benefits: string[]
  preview: ReactNode
  reverse: boolean
}

export function PatientStep({ stepNumber, title, icon, description, benefits, preview, reverse }: PatientStepProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
      <div className={`order-2 ${reverse ? "md:order-2" : "md:order-1"}`}>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">{icon}</div>
            <h4 className="text-xl font-semibold">{title}</h4>
          </div>
          <p className="text-muted-foreground mb-4">{description}</p>
          <ul className="space-y-2 text-sm">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={`order-1 ${reverse ? "md:order-1" : "md:order-2"} flex justify-center`}>
        <div className="relative">
          <div
            className={`absolute ${reverse ? "-right-4" : "-left-4"} top-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center font-bold text-sm z-10 hidden md:flex`}
          >
            {stepNumber}
          </div>
          {preview}
        </div>
      </div>
    </div>
  )
}

