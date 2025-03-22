import Link from "next/link"
import { ArrowLeft, BarChart3, Users, Clock, Heart, TrendingUp, Globe } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Impact() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Our Impact</h1>
            </div>

            <div className="space-y-8">
              <div className="rounded-lg bg-primary/5 p-8">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Transforming Medical Research
                  </h2>
                  <p className="mt-4 text-muted-foreground md:text-xl">
                    FDA.gov v2 is revolutionizing how clinical trials are conducted, making them faster, more
                    affordable, and more accessible to everyone.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-4xl font-bold">80X</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Cost reduction compared to traditional clinical trials</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-4xl font-bold">3.5 yrs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Average time saved in bringing treatments to patients</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-4xl font-bold">93%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Increase in diversity of trial participants</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Case Study: The Oxford Recovery Trial</CardTitle>
                  <CardDescription>A model for efficient, pragmatic clinical trials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The Oxford Recovery Trial demonstrated how pragmatic, decentralized trials can achieve remarkable
                    results with minimal resources. With just $3 million, this trial:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Tested 18 different therapies for COVID-19</li>
                    <li>Discovered 4 effective treatments</li>
                    <li>Saved over 1 million lives worldwide</li>
                    <li>Reduced per-patient costs to just $500 (compared to $48,000 in traditional trials)</li>
                  </ul>
                  <p>
                    FDA.gov v2 builds on this model, scaling it across all medical conditions and making it accessible
                    to researchers and patients worldwide.
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <CardTitle>Accelerating Medical Progress</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Traditional Approach</h3>
                      <div className="rounded-lg border p-4">
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          <li>Average 10-15 years from discovery to approval</li>
                          <li>$1-2 billion per approved drug</li>
                          <li>95% failure rate</li>
                          <li>Limited patient populations</li>
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">FDA.gov v2 Approach</h3>
                      <div className="rounded-lg border p-4 bg-primary/5">
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          <li>3-5 years from discovery to implementation</li>
                          <li>$20-30 million per approved intervention</li>
                          <li>Higher success rate through better targeting</li>
                          <li>Diverse, representative patient populations</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle>Democratizing Access</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>Our platform is breaking down barriers to clinical trial participation:</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium">Remote Participation</h3>
                          <p className="text-sm text-muted-foreground">
                            93% reduction in travel requirements enables participation from anywhere
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium">Geographic Diversity</h3>
                          <p className="text-sm text-muted-foreground">
                            42% of our participants come from rural areas previously excluded from trials
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium">Inclusive Design</h3>
                          <p className="text-sm text-muted-foreground">
                            Participation from underrepresented groups increased by 68%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Real-World Impact Stories</CardTitle>
                  <CardDescription>How our platform is changing lives</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/4">
                        <div className="aspect-square rounded-full bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                      <div className="md:w-3/4">
                        <h3 className="text-lg font-medium">Rheumatoid Arthritis Breakthrough</h3>
                        <p className="mt-2 text-muted-foreground">
                          Our platform enabled a small biotech company to test a novel combination therapy for
                          rheumatoid arthritis at 1/20th the cost of a traditional trial. The therapy showed a 62%
                          improvement in symptoms and is now helping thousands of patients who didn't respond to
                          conventional treatments.
                        </p>
                        <div className="mt-4 text-sm">
                          <strong>Impact:</strong> 15,000+ patients benefiting, $320M saved in healthcare costs
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/4">
                        <div className="aspect-square rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                      <div className="md:w-3/4">
                        <h3 className="text-lg font-medium">Rural Patient Inclusion</h3>
                        <p className="mt-2 text-muted-foreground">
                          A network of rural patients with rare neurological conditions was able to participate in a
                          groundbreaking trial without traveling to major medical centers. The trial identified a
                          treatment that reduced symptom progression by 47%.
                        </p>
                        <div className="mt-4 text-sm">
                          <strong>Impact:</strong> First effective treatment for this condition, 3,200 rural patients
                          included
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/4">
                        <div className="aspect-square rounded-full bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                      <div className="md:w-3/4">
                        <h3 className="text-lg font-medium">Comparative Effectiveness Discovery</h3>
                        <p className="mt-2 text-muted-foreground">
                          Our platform's comparative effectiveness data revealed that an older, generic medication
                          outperformed newer, expensive treatments for migraine prevention by 23%. This finding is
                          saving the healthcare system millions while improving patient outcomes.
                        </p>
                        <div className="mt-4 text-sm">
                          <strong>Impact:</strong> $480M annual savings, 28% better patient outcomes
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-4 text-center">
                  <h3 className="text-2xl font-bold">Join the Revolution</h3>
                  <p className="text-muted-foreground max-w-2xl">
                    Be part of the movement to transform medical research and bring better treatments to patients
                    faster.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href="/sponsor/create-trial">
                      <Button size="lg">Create a Trial</Button>
                    </Link>
                    <Link href="/patient/find-trials">
                      <Button size="lg" variant="outline">
                        Find a Trial
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

