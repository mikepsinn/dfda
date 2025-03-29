import { CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, FileText, Download, BookOpen, Users, Stethoscope, BarChart3, ClipboardList } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getServerUser } from "@/lib/server-auth"

export default async function ProviderResourcesPage() {
  const user = await getServerUser()

  return (
    <div className="flex min-h-screen flex-col">
      <Header initialUser={user} />
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/outcome-labels" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Provider Resources</h1>
            </div>

            <div className="space-y-8">
              <div className="rounded-lg bg-primary/5 p-8">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Resources for Healthcare Providers
                  </h2>
                  <p className="mt-4 text-muted-foreground md:text-xl">
                    Tools, guides, and resources to help healthcare providers leverage FDA.gov v2 in clinical practice
                  </p>
                </div>
              </div>

              <Tabs defaultValue="clinical-tools">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="clinical-tools">Clinical Tools</TabsTrigger>
                  <TabsTrigger value="educational">Educational Resources</TabsTrigger>
                  <TabsTrigger value="integration">EHR Integration</TabsTrigger>
                </TabsList>

                <TabsContent value="clinical-tools" className="space-y-6 pt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        <CardTitle>Point-of-Care Decision Support</CardTitle>
                      </div>
                      <CardDescription>
                        Tools to help you make evidence-based treatment decisions during patient visits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium">Comparative Effectiveness Dashboard</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Interactive tool showing treatment comparisons for specific conditions
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <ClipboardList className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium">Treatment Selection Wizard</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Step-by-step guide to selecting optimal treatments based on patient factors
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium">Printable Outcome Labels</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Patient-friendly handouts explaining treatment effects
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium">Patient Discussion Guide</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Framework for discussing treatment options using outcome labels
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="educational" className="space-y-6 pt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle>Educational Resources</CardTitle>
                      </div>
                      <CardDescription>
                        Materials to help you understand and utilize FDA.gov v2 in your practice
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium">CME Courses</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Earn continuing medical education credits while learning about evidence-based prescribing
                        </p>
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                          <Button variant="outline" size="sm">
                            Introduction to Outcome Labels (1.0 CME)
                          </Button>
                          <Button variant="outline" size="sm">
                            Comparative Effectiveness in Practice (2.0 CME)
                          </Button>
                          <Button variant="outline" size="sm">
                            Shared Decision Making (1.5 CME)
                          </Button>
                          <Button variant="outline" size="sm">
                            Deprescribing Using Evidence (1.0 CME)
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium">Webinars and Videos</h3>
                        <p className="text-sm text-muted-foreground mt-1">On-demand educational content</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                            <span className="text-sm">Using Outcome Labels in Primary Care</span>
                            <Button variant="ghost" size="sm">
                              Watch
                            </Button>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                            <span className="text-sm">Explaining Risk Reduction to Patients</span>
                            <Button variant="ghost" size="sm">
                              Watch
                            </Button>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                            <span className="text-sm">Case Studies in Evidence-Based Prescribing</span>
                            <Button variant="ghost" size="sm">
                              Watch
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium">Quick Reference Guides</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Downloadable PDF guides for common clinical scenarios
                        </p>
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Hypertension Treatment Guide
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Diabetes Management Guide
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Pain Management Guide
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Mental Health Guide
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="integration" className="space-y-6 pt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle>EHR Integration</CardTitle>
                      </div>
                      <CardDescription>
                        Tools to integrate FDA.gov v2 data into your electronic health record system
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium">API Documentation</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Technical documentation for integrating outcome labels into your EHR
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm">
                            View API Documentation
                          </Button>
                          <Link href="/developers">
                            <Button variant="outline" size="sm">
                              Developer Portal
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium">EHR-Specific Modules</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pre-built integration modules for popular EHR systems
                        </p>
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                          <Button variant="outline" size="sm">
                            Epic Integration Module
                          </Button>
                          <Button variant="outline" size="sm">
                            Cerner Integration Module
                          </Button>
                          <Button variant="outline" size="sm">
                            Allscripts Integration Module
                          </Button>
                          <Button variant="outline" size="sm">
                            athenahealth Integration Module
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium">Implementation Support</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Resources to help your IT team implement FDA.gov v2 integration
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                            <span className="text-sm">Implementation Guide</span>
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                            <span className="text-sm">Technical Support</span>
                            <Button variant="ghost" size="sm">
                              Contact
                            </Button>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                            <span className="text-sm">Integration Webinar</span>
                            <Button variant="ghost" size="sm">
                              Register
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card>
                <CardHeader>
                  <CardTitle>Join Our Provider Network</CardTitle>
                  <CardDescription>
                    Become part of our network of healthcare providers using evidence-based tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Join thousands of healthcare providers who are using FDA.gov v2 to improve patient care through
                    evidence-based decision making. Network members receive:
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
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
                          className="h-3 w-3 text-primary"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>Early access to new outcome labels and clinical tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
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
                          className="h-3 w-3 text-primary"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>Quarterly newsletter with the latest evidence updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
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
                          className="h-3 w-3 text-primary"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>Opportunity to contribute to the development of new outcome labels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
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
                          className="h-3 w-3 text-primary"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>Invitations to exclusive webinars and educational events</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Join Provider Network</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

