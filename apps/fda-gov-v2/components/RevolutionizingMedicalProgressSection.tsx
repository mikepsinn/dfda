import Link from "next/link"
import { ArrowRight, Users, Building, Stethoscope, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface StatisticsProps {
  trialsLaunched: number;
  patientsEnrolled: number;
  costSavings: number;
  successfulTreatments: number;
}

const defaultStats: StatisticsProps = {
  trialsLaunched: 245,
  patientsEnrolled: 18500,
  costSavings: 278000000,
  successfulTreatments: 37
};

interface RevolutionizingMedicalProgressSectionProps {
  stats?: StatisticsProps;
}

export function RevolutionizingMedicalProgressSection({ stats = defaultStats }: RevolutionizingMedicalProgressSectionProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="text-primary">Transforming Medical Research</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Revolutionizing Medical Progress
          </h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            FDA v2 is changing how medical research is conducted, making it more efficient, accessible, and
            patient-centered
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12 mt-12">
          {/* Testimonials */}
          <div className="space-y-6">
            <div className="rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Patient Testimonial</h3>
                  <p className="mt-2 text-muted-foreground">
                    "I was able to join a groundbreaking trial for my condition without traveling hundreds of miles. FDA
                    v2 made it easy to track my progress and I felt like a true partner in the research."
                  </p>
                  <p className="mt-2 text-sm font-medium">— Sarah K., Trial Participant</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Sponsor Testimonial</h3>
                  <p className="mt-2 text-muted-foreground">
                    "We reduced our per-patient costs by 78% and launched our trial in just 3 weeks. The quality of data
                    we received exceeded our expectations and led to faster regulatory approval."
                  </p>
                  <p className="mt-2 text-sm font-medium">— Dr. James R., BioInnovate Research</p>
                </div>
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6">FDA v2 Success Metrics</h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Trials Launched</span>
                  <span className="text-sm font-bold">{stats.trialsLaunched}+</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "85%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Patient Participants</span>
                  <span className="text-sm font-bold">{stats.patientsEnrolled.toLocaleString()}+</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "75%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Cost Savings Generated</span>
                  <span className="text-sm font-bold">${(stats.costSavings / 1000000).toFixed(0)}M+</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "92%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Successful Treatments</span>
                  <span className="text-sm font-bold">{stats.successfulTreatments}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "65%" }}></div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="text-sm">120+ Medical Conditions</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm">98% Data Compliance</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl mt-12">
          <div className="rounded-lg border bg-background p-8 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <h3 className="text-2xl font-bold">Ready to Transform Medical Research?</h3>
              <p className="text-muted-foreground">
                Join thousands of researchers and patients who are already benefiting from FDA v2's revolutionary
                approach.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/sponsor/create-trial">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start a Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/patient/find-trials">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Join as a Patient <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

