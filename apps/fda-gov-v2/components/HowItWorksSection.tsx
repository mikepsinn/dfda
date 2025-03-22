import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Our platform connects trial sponsors with patients, streamlining the entire clinical trial process
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:gap-12">
          <Card>
            <CardHeader>
              <CardTitle>For Trial Sponsors</CardTitle>
              <CardDescription>Researchers, pharmaceutical companies, and other organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Create a Trial</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload protocols, pre/post-clinical data, and register your supply chain
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">Get Insurance</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically receive and select liability insurance quotes per subject
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Set Parameters</h3>
                  <p className="text-sm text-muted-foreground">
                    Define patient pricing, required data collection, and refundable deposits
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-lg font-bold text-primary">4</span>
                </div>
                <div>
                  <h3 className="font-semibold">Manage Your Trial</h3>
                  <p className="text-sm text-muted-foreground">
                    Track enrollment, monitor data collection, and analyze results
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/sponsor/create-trial" className="w-full">
                <Button className="w-full">Create a Trial</Button>
              </Link>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>For Patients</CardTitle>
              <CardDescription>
                Individuals seeking innovative treatments and contributing to medical research
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Find Relevant Trials</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your condition to see ranked interventions based on effectiveness
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">Join a Trial</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete an informed consent quiz and easily enroll in promising trials
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Track Your Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Record diet, treatment, and symptom data through various convenient methods
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-lg font-bold text-primary">4</span>
                </div>
                <div>
                  <h3 className="font-semibold">Gain Personal Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    View personalized n-of-1 studies showing how treatments affect your health
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/patient/find-trials" className="w-full">
                <Button className="w-full" variant="outline">
                  Find a Trial
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}

