import Link from "next/link"
import { ArrowRight, Clock, DollarSign, LineChart, Users } from "lucide-react"

// Goals of the planned platform. The only figures are the sourced RECOVERY
// comparison shown on /impact; do not add unsourced performance claims here.
const benefits = [
  {
    title: "Improved Patient Experience",
    icon: Users,
    intro: "Designed to make participation easier and more rewarding:",
    points: [
      "Take part from home instead of traveling to a trial site",
      "Personalized health insights for every participant",
      "Open to patients whom standard trials exclude",
    ],
    link: { href: "/find-trials", label: "Find a trial" },
  },
  {
    title: "Lower Cost per Patient",
    icon: DollarSign,
    intro: "Pragmatic trials show what is possible:",
    points: [
      "The RECOVERY trial cost about $500 per patient, compared with about $41,000 for a typical trial",
      "Data collection runs inside routine care",
      "Automated analysis replaces manual site work",
    ],
    link: { href: "/impact", label: "View cost analysis" },
  },
  {
    title: "Better Data Quality",
    icon: LineChart,
    intro: "Designed for data that researchers can check and reuse:",
    points: [
      "Continuous data from apps and wearables, not only clinic visits",
      "Every number shows where it came from",
      "An open API for independent analysis",
    ],
    link: { href: "/developers", label: "Explore our API" },
  },
  {
    title: "Faster Access to Treatments",
    icon: Clock,
    intro: "Reduce the wait for life-changing treatments:",
    points: [
      "Outcome data from the first patients, not only at the end of a multi-year trial",
      "Rankings update as new evidence arrives",
    ],
    link: { href: "/impact", label: "Learn about our impact" },
  },
]

export function KeyBenefitsSection() {
  return (
    <section id="key-benefits" className="band-fade w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="text-primary">Why It Matters</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Benefits</h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            What dFDA is designed to deliver for patients, clinicians and researchers
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col h-full rounded-lg border bg-background p-6 shadow-sm">
              <div className="mb-4 rounded-full bg-primary/10 p-4 w-fit">
                <benefit.icon aria-hidden="true" className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{benefit.title}</h3>
              <div className="mt-2 text-muted-foreground flex-grow">
                <p className="mb-4">{benefit.intro}</p>
                <ul className="space-y-2">
                  {benefit.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <div aria-hidden="true" className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <svg width="8" height="8" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                          <circle cx="3" cy="3" r="3" fill="currentColor" />
                        </svg>
                      </div>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t">
                <Link
                  href={benefit.link.href}
                  className="text-primary text-sm font-medium inline-flex items-center hover:underline"
                >
                  {benefit.link.label} <ArrowRight aria-hidden="true" className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
