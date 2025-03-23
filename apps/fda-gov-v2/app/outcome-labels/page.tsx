import Link from "next/link"
import { ArrowLeft, Beaker, FileText, BarChart, Search, Download, Share2, Code } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export default function OutcomeLabels() {
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
              <h1 className="text-2xl font-bold">Outcome Labels</h1>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>What are Outcome Labels?</CardTitle>
                  <CardDescription>
                    Comprehensive, evidence-based information about the effects of interventions on health
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Outcome Labels provide standardized, quantitative information about how foods, drugs, supplements,
                    and other interventions affect all measurable aspects of human health. They go beyond traditional
                    drug labels by showing:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Comprehensive effects</strong> - Not just the primary outcome, but all measurable effects
                      on health
                    </li>
                    <li>
                      <strong>Comparative effectiveness</strong> - How interventions compare to alternatives, not just
                      to placebo
                    </li>
                    <li>
                      <strong>Absolute risk reduction</strong> - Real-world impact expressed in ways patients can
                      understand
                    </li>
                    <li>
                      <strong>Side effect profiles</strong> - Detailed information about potential negative effects and
                      their frequency
                    </li>
                    <li>
                      <strong>Evidence quality</strong> - Transparency about the strength of evidence behind each claim
                    </li>
                  </ul>
                  <div className="rounded-lg bg-primary/5 p-4 mt-4">
                    <div className="flex items-start gap-4">
                      <FileText className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <h4 className="font-medium">Why Outcome Labels Matter</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Traditional drug labels focus primarily on whether a treatment is better than placebo for a
                          single outcome. Outcome Labels provide a complete picture of all health effects, helping
                          patients and doctors make truly informed decisions based on what matters most to them.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>For Patients</CardTitle>
                    <CardDescription>Make informed health decisions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Search className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Find What Works</h3>
                        <p className="text-sm text-muted-foreground">
                          Compare treatments based on outcomes that matter most to you
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <BarChart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Understand Trade-offs</h3>
                        <p className="text-sm text-muted-foreground">
                          See both benefits and risks in clear, quantitative terms
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Share2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Share with Providers</h3>
                        <p className="text-sm text-muted-foreground">
                          Facilitate better conversations with your healthcare team
                        </p>
                      </div>
                    </div>
                    <Button className="w-full mt-4">Browse Outcome Labels</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>For Healthcare Providers</CardTitle>
                    <CardDescription>Evidence-based clinical decision support</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Comprehensive Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Access aggregated trial data and real-world evidence in one place
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Download className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Integration Tools</h3>
                        <p className="text-sm text-muted-foreground">
                          Download or integrate with EHR systems for point-of-care access
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Beaker className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Contribute Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Help improve labels by contributing clinical observations
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      Provider Resources
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Explore Outcome Labels</CardTitle>
                  <CardDescription>Browse by category or search for specific interventions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search for a medication, supplement, or food..." className="pl-8" />
                    </div>
                  </div>

                  <Tabs defaultValue="medications">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="medications">Medications</TabsTrigger>
                      <TabsTrigger value="supplements">Supplements</TabsTrigger>
                      <TabsTrigger value="foods">Foods</TabsTrigger>
                      <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                    </TabsList>
                    <TabsContent value="medications" className="space-y-4 pt-4">
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        <Button variant="outline" className="justify-start">
                          Statins
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Antidepressants
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Blood Pressure Medications
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Diabetes Medications
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Pain Relievers
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Sleep Aids
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Antihistamines
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Antibiotics
                        </Button>
                        <Button variant="outline" className="justify-start">
                          View All →
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="supplements" className="space-y-4 pt-4">
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        <Button variant="outline" className="justify-start">
                          Vitamin D
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Omega-3
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Probiotics
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Magnesium
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Zinc
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Melatonin
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Turmeric/Curcumin
                        </Button>
                        <Button variant="outline" className="justify-start">
                          Vitamin B Complex
                        </Button>
                        <Button variant="outline" className="justify-start">
                          View All →
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="foods" className="pt-4">
                      <p className="text-center text-muted-foreground py-8">Food outcome labels coming soon</p>
                    </TabsContent>
                    <TabsContent value="lifestyle" className="pt-4">
                      <p className="text-center text-muted-foreground py-8">
                        Lifestyle intervention outcome labels coming soon
                      </p>
                    </TabsContent>
                  </Tabs>
                  <div className="mt-6 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Data updated: June 2025</p>
                    <Link href="/developers">
                      <Button variant="outline" size="sm">
                        <Code className="mr-2 h-4 w-4" /> Access via API
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">Contribute to Outcome Labels</h3>
                  <p className="text-muted-foreground max-w-2xl">
                    Outcome Labels are continuously improved through new clinical trials, real-world evidence, and
                    patient-reported outcomes. Join our platform to contribute data and help create the most
                    comprehensive health information resource available.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button size="lg">Join as a Patient</Button>
                    <Button size="lg" variant="outline">
                      Join as a Provider
                    </Button>
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

