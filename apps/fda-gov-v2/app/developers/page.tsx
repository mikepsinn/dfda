import Link from "next/link"
import {
  ArrowLeft,
  Key,
  Code,
  Lock,
  Database,
  Zap,
  Copy,
  ExternalLink,
  ChevronDown,
  FileText,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiKeyRequestForm } from "@/components/developers/ApiKeyRequestForm"
import { OAuthApplicationForm } from "@/components/developers/OAuthApplicationForm"
import { CodeExampleTabs } from "@/components/developers/CodeExampleTabs"

export default function DeveloperPortal() {
  return (
    <main className="py-6 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-2">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
            <h1 className="text-2xl font-bold">Developer Portal</h1>
          </div>

          <div className="space-y-8">
            <div className="rounded-lg bg-primary/5 p-8">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">FDA.gov v2 API</h2>
                <p className="mt-4 text-muted-foreground md:text-xl">
                  Access clinical trial data, comparative effectiveness information, and outcome labels programmatically
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <Button size="lg">
                    <Key className="mr-2 h-4 w-4" /> Get API Key
                  </Button>
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
                  <CardTitle>Comprehensive Data</CardTitle>
                  <CardDescription>Access data from thousands of clinical trials</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our API provides access to data from over 50,000 clinical trials, including comparative
                    effectiveness metrics, patient outcomes, and side effect profiles.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-2">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Secure Access</CardTitle>
                  <CardDescription>Enterprise-grade security and authentication</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our API uses OAuth 2.0 and API keys for authentication, with HTTPS encryption for all requests.
                    Patient data is anonymized and protected.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-2">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>High Performance</CardTitle>
                  <CardDescription>Fast, reliable API with 99.9% uptime</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our API is built for performance, with response times under 100ms and a 99.9% uptime SLA for
                    enterprise customers.
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
                      <h3 className="text-lg font-medium">1. Request an API Key</h3>
                      <p className="text-sm text-muted-foreground">
                        Fill out the form below to request an API key. We'll review your request and send your API key
                        to the provided email address.
                      </p>
                      <div className="rounded-lg border p-4 mt-4">
                        <ApiKeyRequestForm />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">1.5. Register an OAuth2 Application (Optional)</h3>
                      <p className="text-sm text-muted-foreground">
                        If you need to access user-specific data or perform actions on behalf of users, register your
                        application for OAuth2 access.
                      </p>
                      <div className="rounded-lg border p-4 mt-4">
                        <OAuthApplicationForm />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">2. Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        Once you receive your API key, you'll need to include it in the header of all your API requests.
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
          </div>
        </div>
      </div>
    </main>
  )
}

