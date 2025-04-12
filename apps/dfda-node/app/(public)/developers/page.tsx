import Link from "next/link"
import { Key, Code, Database, Copy, ExternalLink, ChevronDown, FileText, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeExampleTabs } from "@/components/developers/CodeExampleTabs"

export default function DeveloperPortal() {
  return (
    <main className="py-6 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-5xl">

          <div className="space-y-8">
            <div className="rounded-lg bg-primary/5 p-8">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Supercharge Your Health App with FDA.gov v2 API
                </h2>
                <p className="mt-4 text-muted-foreground md:text-xl">
                  Integrate real-world clinical data, personalized insights, and trial access directly into your health
                  applications
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/register?role=developer">
                    <Button size="lg">
                      <Key className="mr-2 h-4 w-4" /> Sign Up for API Access
                    </Button>
                  </Link>
                  <Link href="/developers/documentation">
                    <Button variant="outline" size="lg">
                      <Code className="mr-2 h-4 w-4" /> View Documentation
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-2">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Real-World Clinical Data</CardTitle>
                  <CardDescription>Access comprehensive patient outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Integrate real-world data from over 50,000 clinical trials, including patient-reported outcomes,
                    side effect profiles, and comparative effectiveness metrics that aren&apos;t available anywhere else.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-2">
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
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </div>
                  <CardTitle>Personalized Health Insights</CardTitle>
                  <CardDescription>Deliver tailored recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Leverage our AI-powered outcome labels and comparative effectiveness data to provide your users with
                    personalized treatment insights based on their specific health profile and preferences.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-2">
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <CardTitle>Seamless Trial Integration</CardTitle>
                  <CardDescription>Connect patients to cutting-edge treatments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Enable your users to discover, apply for, and participate in clinical trials directly through your
                    app with our OAuth2 integration, creating new revenue streams and improving health outcomes.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="get-started">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="get-started">Get Started</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="examples">Code Examples</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>

              <TabsContent value="get-started" className="space-y-6 pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started with the FDA.gov v2 API</CardTitle>
                    <CardDescription>Follow these steps to start using our API in your applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">1. Sign Up</h3>
                      <p className="text-sm text-muted-foreground">
                        Sign up to get an API key. Optionally, you can also register an OAuth2 application if you need to access user-specific data.
                      </p>
                      <Link href="/developer">
                        <Button variant="outline" className="mt-2">
                          <Key className="mr-2 h-4 w-4" /> Sign Up for Access
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">2. Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        Once you receive your API key, you&apos;ll need to include it in the header of all your API
                        requests.
                      </p>
                      <div className="rounded-lg bg-muted p-4 mt-2">
                        <div className="flex items-center justify-between">
                          <code className="text-sm">Authorization: Bearer YOUR_API_KEY</code>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">3. Make Your First API Call</h3>
                      <p className="text-sm text-muted-foreground">
                        Try making a simple API call to test your authentication.
                      </p>
                      <div className="rounded-lg bg-muted p-4 mt-2">
                        <div className="flex items-center justify-between">
                          <code className="text-sm">GET https://api.fdav2.gov/v1/trials</code>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">4. Explore the Documentation</h3>
                      <p className="text-sm text-muted-foreground">
                        Check out our comprehensive documentation to learn about all available endpoints and parameters.
                      </p>
                      <Link href="/developers/documentation">
                        <Button variant="outline" className="mt-2">
                          <ExternalLink className="mr-2 h-4 w-4" /> View Full Documentation
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documentation" className="space-y-6 pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Documentation</CardTitle>
                    <CardDescription>Comprehensive documentation for the FDA.gov v2 API</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                      Our detailed documentation covers everything you need to know about using the FDA.gov v2 API,
                      including authentication, endpoints, error handling, and more.
                    </p>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Getting Started</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Learn the basics of the API and how to make your first request.
                        </p>
                        <Link href="/developers/documentation#getting-started">
                          <Button variant="outline" size="sm">
                            View Section
                          </Button>
                        </Link>
                      </div>
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Authentication</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Learn about API keys and OAuth 2.0 authentication.
                        </p>
                        <Link href="/developers/documentation#auth">
                          <Button variant="outline" size="sm">
                            View Section
                          </Button>
                        </Link>
                      </div>
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Endpoints</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Explore all available API endpoints and their parameters.
                        </p>
                        <Link href="/developers/documentation#endpoints">
                          <Button variant="outline" size="sm">
                            View Section
                          </Button>
                        </Link>
                      </div>
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Error Handling</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Learn how to handle errors and troubleshoot issues.
                        </p>
                        <Link href="/developers/documentation#error-handling">
                          <Button variant="outline" size="sm">
                            View Section
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <Link href="/developers/documentation">
                      <Button className="w-full">View Full Documentation</Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="examples" className="space-y-6 pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                    <CardDescription>Sample code for using the FDA.gov v2 API in different languages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeExampleTabs />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-6 pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Pricing</CardTitle>
                    <CardDescription>Choose the plan that fits your needs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle>Free</CardTitle>
                          <CardDescription>For developers and small projects</CardDescription>
                          <div className="mt-4">
                            <span className="text-3xl font-bold">$0</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>100 requests/hour</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Access to public trial data</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Basic outcome labels</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Community support</span>
                            </li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">
                            Get Started
                          </Button>
                        </CardFooter>
                      </Card>

                      <Card className="border-2 border-primary">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle>Basic</CardTitle>
                            <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                              Popular
                            </div>
                          </div>
                          <CardDescription>For startups and growing companies</CardDescription>
                          <div className="mt-4">
                            <span className="text-3xl font-bold">$99</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>1,000 requests/hour</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Full access to trial data</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Complete outcome labels</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Email support</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Comparative effectiveness data</span>
                            </li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full">Subscribe</Button>
                        </CardFooter>
                      </Card>

                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle>Enterprise</CardTitle>
                          <CardDescription>For large organizations and healthcare systems</CardDescription>
                          <div className="mt-4">
                            <span className="text-3xl font-bold">Custom</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Custom request limits</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Premium data access</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Advanced analytics</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Dedicated support</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>SLA guarantees</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
                              <span>Custom integrations</span>
                            </li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">
                            Contact Sales
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>Our developer support team is here to help you integrate with our API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-3">
                        <Code className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Developer Forum</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Join our community forum to ask questions and share solutions
                      </p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Visit Forum
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-3">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Documentation</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Browse our comprehensive API documentation and guides
                      </p>
                      <Link href="/developers/documentation">
                        <Button variant="outline" size="sm" className="mt-4">
                          View Docs
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-3">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Contact Support</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Get in touch with our developer support team</p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Email Support
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-12">
              <h2 className="text-2xl font-bold text-center mb-6">What You Can Build</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">EHR Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Securely connect patient health records to clinical trials with user consent, streamlining data
                      collection and improving trial matching.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Treatment Comparison Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Build interactive tools that help patients and providers compare treatment options based on
                      real-world effectiveness data.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Personalized Health Dashboards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Create customized health dashboards that combine user data with aggregated insights from similar
                      patients.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Trial Matching Platforms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Develop sophisticated matching algorithms that connect patients to the most promising trials for
                      their specific condition.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-16 bg-primary/5 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-8">Trusted by Leading Health Tech Companies</h2>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-bold text-blue-600">HC</span>
                    </div>
                    <div>
                      <h3 className="font-medium">HealthConnect</h3>
                      <p className="text-sm text-muted-foreground">Digital Health Platform</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "The FDA.gov v2 API has been transformative for our patient engagement platform. We&apos;ve seen a
                    43% increase in clinical trial participation and significantly improved patient outcomes."
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="font-bold text-green-600">MR</span>
                    </div>
                    <div>
                      <h3 className="font-medium">MedRecord</h3>
                      <p className="text-sm text-muted-foreground">EHR Solutions</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "Integrating with the FDA.gov v2 API allowed us to offer our providers real-time access to
                    comparative effectiveness data, improving clinical decision-making and patient care."
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-bold text-purple-600">TM</span>
                    </div>
                    <div>
                      <h3 className="font-medium">TrialMatch</h3>
                      <p className="text-sm text-muted-foreground">Clinical Trial Platform</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "The OAuth2 integration with FDA.gov v2 has streamlined our trial enrollment process, reducing
                    patient onboarding time by 67% and dramatically improving our data collection capabilities."
                  </p>
                </div>
              </div>
            </div>

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
          </div>
        </div>
      </div>
    </main>
  )
}
