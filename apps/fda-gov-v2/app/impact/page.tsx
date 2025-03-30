import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Our Impact | Decentralized FDA",
  description:
    "See how the Decentralized FDA platform is transforming healthcare through accessible clinical trials and data-driven insights.",
}

export default function ImpactPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Impact</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The Decentralized FDA platform is transforming healthcare by making clinical trials more accessible,
            efficient, and patient-centered.
          </p>
        </div>

        <Tabs defaultValue="patients" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patients">For Patients</TabsTrigger>
            <TabsTrigger value="providers">For Providers</TabsTrigger>
            <TabsTrigger value="research-partners">For Research Partners</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Empowering Patient Choice</h2>
                <p className="text-muted-foreground mb-4">
                  Our platform has enabled over 50,000 patients to access treatments that would otherwise be unavailable
                  through traditional clinical trials.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>97% reduction in geographic barriers to trial participation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>85% of patients report better understanding of treatment options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>73% cost reduction for patients participating in trials</span>
                  </li>
                </ul>
                <Link href="/patient">
                  <Button>Learn More</Button>
                </Link>
              </div>
              <div className="rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="Patient using the dFDA platform"
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="providers" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Transforming Clinical Practice</h2>
                <p className="text-muted-foreground mb-4">
                  Healthcare providers using our platform report significant improvements in patient outcomes and
                  practice efficiency.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>68% reduction in administrative burden for trial management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>92% of providers report better treatment decision-making</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>45% increase in patient enrollment in appropriate trials</span>
                  </li>
                </ul>
                <Link href="/provider-resources">
                  <Button>Learn More</Button>
                </Link>
              </div>
              <div className="rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="Healthcare provider using the dFDA platform"
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="research-partners" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Accelerating Medical Innovation</h2>
                <p className="text-muted-foreground mb-4">
                  Trial research partners have experienced dramatic improvements in efficiency, cost, and data quality.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>63% reduction in trial costs compared to traditional methods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>41% faster time-to-market for new treatments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>87% more diverse patient populations in trials</span>
                  </li>
                </ul>
                <Link href="/research-partner">
                  <Button>Learn More</Button>
                </Link>
              </div>
              <div className="rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="Sponsor analyzing trial data on the dFDA platform"
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Impact by the Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">50,000+</div>
                <div className="text-lg font-medium">Patients Enrolled</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Patients who have gained access to treatments through our platform
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">1,200+</div>
                <div className="text-lg font-medium">Active Trials</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Clinical trials currently running on our decentralized platform
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">78%</div>
                <div className="text-lg font-medium">Cost Reduction</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Average reduction in trial costs compared to traditional methods
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">3.5x</div>
                <div className="text-lg font-medium">Faster Enrollment</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Speed increase in patient enrollment compared to traditional trials
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Join the Healthcare Revolution</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Whether you're a patient looking for treatment options, a provider seeking better outcomes for your
            patients, or a research partner wanting to run more efficient trials, the Decentralized FDA platform can help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/patient">
              <Button variant="default">For Patients</Button>
            </Link>
            <Link href="/provider-resources">
              <Button variant="outline">For Providers</Button>
            </Link>
            <Link href="/research-partner">
              <Button variant="outline">For Research Partners</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

