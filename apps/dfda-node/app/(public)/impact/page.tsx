import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Clock, Users, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: "Impact of Efficient Trials: Lessons from RECOVERY | dFDA",
  description:
    "Learn how the RECOVERY trial demonstrates the potential for faster, cheaper, and more accessible clinical research.",
}

export default function ImpactPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Impact of Efficient Trials: Lessons from RECOVERY</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The groundbreaking RECOVERY trial showcases how pragmatic, decentralized approaches can revolutionize
            medical research, aligning with the dFDA vision.
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
                <h2 className="text-2xl font-bold mb-4">Easier Participation, Faster Access</h2>
                <p className="text-muted-foreground mb-4">
                  The RECOVERY trial prioritized patient access and convenience. By using local hospitals instead of
                  specialized centers and integrating with routine care, it drastically reduced the burden on
                  participants.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Reduced travel time and costs for trial visits.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Enabled participation for a massive scale of 49,000+ patients.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Led to rapid discovery of effective treatments (like dexamethasone), speeding access.</span>
                  </li>
                </ul>
                <Link href="/patient/find-trials">
                  <Button>Find a Trial</Button>
                </Link>
              </div>
              {/* Placeholder removed */}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Streamlined Research in Practice</h2>
                <p className="text-muted-foreground mb-4">
                  RECOVERY demonstrated that complex research can be efficiently conducted within existing healthcare
                  infrastructure, empowering providers at 186 hospitals.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Simplified data collection using existing hospital systems.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Reduced administrative burden through pragmatic design and streamlined forms.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Allowed local hospitals to contribute significantly to globally impactful research.</span>
                  </li>
                </ul>
                <Link href="/provider-resources">
                  <Button>Provider Resources</Button>
                </Link>
              </div>
              {/* Placeholder removed */}
            </div>
          </TabsContent>

          <TabsContent value="research-partners" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Faster, Cheaper, High-Impact Results</h2>
                <p className="text-muted-foreground mb-4">
                  For researchers and sponsors, RECOVERY proved the immense value of efficient, pragmatic trial
                  design.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Achieved ~750x cost reduction per patient (~$500 vs ~$41k traditional).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Delivered first major results in under 100 days.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Successfully evaluated 12 potential treatments, identifying 4 effective ones.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Generated globally impactful data saving an estimated 1M+ lives.</span>
                  </li>
                </ul>
                <Link href="/research-partner/create-trial">
                  <Button>Create a Trial</Button>
                </Link>
              </div>
              {/* Placeholder removed */}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">RECOVERY Trial: Impact by the Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <DollarSign className="h-8 w-8 text-primary mb-3" />
                <div className="text-4xl font-bold text-primary mb-2">~$500</div>
                <div className="text-lg font-medium">Cost Per Patient</div>
                <p className="text-sm text-muted-foreground mt-2">vs. ~$41k for traditional trials (Source: NCBI)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Clock className="h-8 w-8 text-primary mb-3" />
                <div className="text-4xl font-bold text-primary mb-2">&lt;100 Days</div>
                <div className="text-lg font-medium">To First Results</div>
                <p className="text-sm text-muted-foreground mt-2">Time to identify life-saving treatments.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Users className="h-8 w-8 text-primary mb-3" />
                <div className="text-4xl font-bold text-primary mb-2">49,000+</div>
                <div className="text-lg font-medium">Patients Enrolled</div>
                <p className="text-sm text-muted-foreground mt-2">Demonstrating massive scale and accessibility.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Globe className="h-8 w-8 text-primary mb-3" />
                <div className="text-4xl font-bold text-primary mb-2">1M+</div>
                <div className="text-lg font-medium">Global Lives Saved</div>
                <p className="text-sm text-muted-foreground mt-2">Estimated impact by March 2021 (Source: UKRI).</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Optional: Add Key Success Factors Section here if desired */}

        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Building on Proven Success</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            The RECOVERY trial demonstrates that faster, cheaper, more accessible clinical research is achievable.
            The dFDA aims to scale these principles globally, empowering patients, providers, and researchers to accelerate
            medical progress together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/patient/find-trials">
              <Button variant="default">Find Trials</Button>
            </Link>
            <Link href="/research-partner/create-trial">
              <Button variant="outline">Create a Trial</Button>
            </Link>
            <Link href="/developers">
              <Button variant="outline">Explore Platform</Button> { /* Example link */ }
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

