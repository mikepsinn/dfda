import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Filter, Search, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ConditionSearchInput } from "@/components/ConditionSearchInput"
import { TreatmentRankingList } from "@/components/TreatmentRankingList"
import { findTrialsForConditionsAction, TrialWithRelations } from "@/app/actions/trials"
import { logger } from "@/lib/logger"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FindTrialsClientProps {
  availableConditions: string[]
}

export function FindTrialsClient({ availableConditions }: FindTrialsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCondition, setSelectedCondition] = useState<{ id: string; name: string } | null>(null)
  const [showTreatments, setShowTreatments] = useState(false)
  const [isLoadingConditions, setIsLoadingConditions] = useState(false)

  // Handle condition selection
  const handleConditionSelect = (condition: { id: string; name: string }) => {
    setSelectedCondition(condition)
    setShowTreatments(true)
    logger.info("Condition selected:", { id: condition.id, name: condition.name });
  }

  // Placeholder data for now
  const trials = [
    {
      id: "1",
      name: "Trial 1",
      research_partner: "Sponsor 1",
      status: "Active",
      description: "Description 1",
      conditions: ["Condition 1"],
      specialties: ["Specialty 1"],
      phase: "Phase 1",
      duration: "6 months",
      visits: "10",
      compensation: "$1000",
      patientMatch: 5
    }
  ]

  const filteredTrials = trials.filter(
    (trial) =>
      trial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trial.research_partner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trial.conditions.some((condition) => condition.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/provider/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Find Clinical Trials</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Search by Condition</CardTitle>
                    <CardDescription>Find evidence-based treatments for your patients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-sm font-medium">
                      Available Conditions
                    </h3>
                    <ConditionSearchInput
                      onSelect={handleConditionSelect}
                      selected={selectedCondition}
                    />
                    <ScrollArea className="mt-4 h-[400px] rounded-md border p-4">
                      {isLoadingConditions ? (
                        <div>Loading conditions...</div>
                      ) : (
                        <div className="space-y-4">
                          {availableConditions.map((condition) => (
                            <div key={condition} className="flex items-center space-x-2">
                              <Checkbox id={`condition-${condition.replace(/\s+/g, '-').toLowerCase()}`} />
                              <Label htmlFor={`condition-${condition.replace(/\s+/g, '-').toLowerCase()}`}>{condition}</Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {showTreatments && selectedCondition && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Treatments for {selectedCondition.name}</CardTitle>
                          <CardDescription>Ranked by comparative effectiveness</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCondition(null)
                            setShowTreatments(false)
                          }}
                        >
                          Clear Results
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TreatmentRankingList
                        treatments={[]}
                        condition={selectedCondition.name}
                        baseUrl="/provider/trials/"
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by condition, treatment, or research_partner..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                        <span className="sr-only">Filter</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filter Trials</SheetTitle>
                      </SheetHeader>
                      <div className="py-4 space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Specialty</h3>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="specialty-neuro" defaultChecked />
                              <Label htmlFor="specialty-neuro">Neurology</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="specialty-movement" />
                              <Label htmlFor="specialty-movement">Movement Disorders</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="specialty-geriatrics" />
                              <Label htmlFor="specialty-geriatrics">Geriatrics</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="specialty-neuroimmunology" />
                              <Label htmlFor="specialty-neuroimmunology">Neuroimmunology</Label>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Condition</h3>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="condition-alzheimers" defaultChecked />
                              <Label htmlFor="condition-alzheimers">Alzheimer's Disease</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="condition-parkinsons" defaultChecked />
                              <Label htmlFor="condition-parkinsons">Parkinson's Disease</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="condition-ms" />
                              <Label htmlFor="condition-ms">Multiple Sclerosis</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="condition-epilepsy" />
                              <Label htmlFor="condition-epilepsy">Rare Epilepsy Syndromes</Label>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Trial Phase</h3>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="phase-2" />
                              <Label htmlFor="phase-2">Phase 2</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="phase-3" defaultChecked />
                              <Label htmlFor="phase-3">Phase 3</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="phase-4" />
                              <Label htmlFor="phase-4">Phase 4</Label>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Duration</h3>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="duration-6" defaultChecked />
                              <Label htmlFor="duration-6">Up to 6 months</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="duration-12" defaultChecked />
                              <Label htmlFor="duration-12">6-12 months</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="duration-24" />
                              <Label htmlFor="duration-24">12-24 months</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="duration-36" />
                              <Label htmlFor="duration-36">Over 24 months</Label>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline">Reset</Button>
                          <Button>Apply Filters</Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">{filteredTrials.length} trials found</h2>
                    <div className="text-sm text-muted-foreground">Sorted by: Patient Match</div>
                  </div>

                  {filteredTrials.map((trial) => (
                    <Card key={trial.id}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <CardTitle>{trial.name}</CardTitle>
                            <CardDescription>{trial.research_partner}</CardDescription>
                          </div>
                          <Badge className="w-fit">{trial.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4">{trial.description}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {trial.conditions.map((condition, index) => (
                            <Badge key={index} variant="outline">
                              {condition}
                            </Badge>
                          ))}
                          {trial.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="rounded-lg bg-muted p-3 text-center">
                            <div className="text-sm text-muted-foreground">Phase</div>
                            <div className="font-medium">{trial.phase}</div>
                          </div>
                          <div className="rounded-lg bg-muted p-3 text-center">
                            <div className="text-sm text-muted-foreground">Duration</div>
                            <div className="font-medium">{trial.duration}</div>
                          </div>
                          <div className="rounded-lg bg-muted p-3 text-center">
                            <div className="text-sm text-muted-foreground">Visits</div>
                            <div className="font-medium">{trial.visits}</div>
                          </div>
                          <div className="rounded-lg bg-muted p-3 text-center">
                            <div className="text-sm text-muted-foreground">Compensation</div>
                            <div className="font-medium">{trial.compensation}</div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {trial.patientMatch} potential patient matches
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline">View Details</Button>
                          <Link href={`/provider/trials/${trial.id}/join`}>
                            <Button>Join Trial</Button>
                          </Link>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="md:w-1/3">
                <Card>
                  <CardHeader>
                    <CardTitle>Why Join Clinical Trials?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Improve Patient Care</h3>
                        <p className="text-sm text-muted-foreground">
                          Offer your patients access to innovative treatments and closer monitoring.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Advance Medical Knowledge</h3>
                        <p className="text-sm text-muted-foreground">
                          Contribute to the development of new treatments and clinical guidelines.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Additional Revenue</h3>
                        <p className="text-sm text-muted-foreground">
                          Receive compensation for your participation and patient referrals.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Pragmatic Design</h3>
                        <p className="text-sm text-muted-foreground">
                          The Decentralized FDA trials integrate with your existing workflow and clinical practice.
                        </p>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="rounded-lg bg-muted p-4">
                      <h3 className="font-medium mb-2">How It Works</h3>
                      <ol className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="font-medium">1.</span>
                          <span>Browse and join trials relevant to your practice</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium">2.</span>
                          <span>Identify eligible patients from your practice</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium">3.</span>
                          <span>Enroll patients and assign interventions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium">4.</span>
                          <span>Monitor outcomes through your regular care</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium">5.</span>
                          <span>Access insights and receive compensation</span>
                        </li>
                      </ol>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Schedule a Consultation</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 