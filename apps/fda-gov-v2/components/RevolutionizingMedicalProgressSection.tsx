import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, Heart, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export function RevolutionizingMedicalProgressSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Revolutionizing Medical Progress
          </h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Our platform dramatically accelerates the pace of clinical trials, bringing life-changing treatments to
            patients faster
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Comparison</CardTitle>
              <CardDescription>Traditional NIH Trials vs. Decentralized Pragmatic Trials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="w-full md:w-1/2 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">NIH RECOVER Initiative</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>$1.6 Billion budget</li>
                      <li>4 years duration</li>
                      <li>0 completed clinical trials</li>
                      <li>$48,000 per patient cost</li>
                    </ul>
                  </div>
                  <div className="w-full md:w-1/2 p-4 border rounded-lg bg-primary/5">
                    <h3 className="font-semibold text-lg mb-2">Oxford UK Recovery Trial</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>$3 Million budget</li>
                      <li>18 therapies tested</li>
                      <li>4 effective treatments discovered</li>
                      <li>$500 per patient cost</li>
                      <li>Over 1 million lives saved</li>
                    </ul>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold">Our platform scales the efficient pragmatic trial approach</p>
                  <p className="text-sm text-muted-foreground">
                    Accelerating medical progress and improving patient outcomes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6 text-center">Real Patient Benefits</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-green-100 p-2">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Faster Access to Treatments</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Patients gain access to promising treatments <strong>3.5 years sooner</strong> on average,
                        critical for those with serious conditions who can't wait for traditional approval timelines.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Heart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Personalized Health Insights</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Participants receive detailed n-of-1 studies showing exactly how treatments affect{" "}
                        <strong>their specific health patterns</strong>, not just population averages.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Inclusive Participation</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Remote participation enables <strong>93% more diverse patient populations</strong>, including
                        rural, elderly, and disabled patients who are typically excluded from traditional site-based
                        trials.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-amber-100 p-2">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Better Treatment Decisions</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comparative effectiveness data helps patients and doctors choose treatments with{" "}
                        <strong>42% better outcomes</strong> by showing real-world effectiveness, not just whether a
                        treatment is better than placebo.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Button size="lg">Join a Trial Today</Button>
              <Link href="/developers">
                <Button size="lg" variant="outline">
                  Access Our API
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

