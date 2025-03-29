"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Filter, Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ConditionSearch } from "@/components/condition-search"
import { TreatmentRankingList } from "@/components/TreatmentRankingList"
import { comparativeEffectivenessData } from "@/lib/treatment-data"
import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Database } from "@/lib/database.types"

// Neurological condition trials data
const trials = [
  {
    id: 1,
    name: "Lecanemab (Anti-Amyloid Antibody) for Early Alzheimer's Disease",
    sponsor: "Eisai/Biogen Collaborative Research",
    phase: "Phase 3",
    duration: "18 months",
    visits: 12,
    compensation: "$750 per patient",
    patientMatch: 8,
    specialties: ["Neurology", "Geriatrics"],
    conditions: ["Early Alzheimer's Disease", "Mild Cognitive Impairment"],
    description:
      "This pragmatic trial evaluates Lecanemab, a monoclonal antibody targeting amyloid beta, in patients with early Alzheimer's disease. The trial aims to assess cognitive decline reduction in real-world clinical settings with less intensive monitoring than traditional trials.",
    status: "Recruiting",
  },
  {
    id: 2,
    name: "Donanemab vs Standard of Care in Mild Alzheimer's Disease",
    sponsor: "Eli Lilly Neuroscience Foundation",
    phase: "Phase 3",
    duration: "24 months",
    visits: 14,
    compensation: "$850 per patient",
    patientMatch: 12,
    specialties: ["Neurology", "Geriatrics"],
    conditions: ["Mild Alzheimer's Disease"],
    description:
      "This trial compares Donanemab, an antibody targeting N3pG amyloid beta, to standard of care in patients with mild Alzheimer's disease. The study focuses on real-world effectiveness with integration into routine clinical care.",
    status: "Recruiting",
  },
  {
    id: 3,
    name: "ABBV-951 (Foslevodopa/Foscarbidopa) Subcutaneous Infusion for Advanced Parkinson's Disease",
    sponsor: "AbbVie Parkinson's Research Consortium",
    phase: "Phase 3",
    duration: "12 months",
    visits: 10,
    compensation: "$700 per patient",
    patientMatch: 15,
    specialties: ["Neurology", "Movement Disorders"],
    conditions: ["Advanced Parkinson's Disease"],
    description:
      "This study evaluates ABBV-951, a 24-hour subcutaneous infusion of foslevodopa/foscarbidopa, for patients with advanced Parkinson's disease experiencing motor fluctuations. The trial aims to assess its effectiveness in reducing 'off' time in everyday clinical settings.",
    status: "Recruiting",
  },
  {
    id: 4,
    name: "NLY01 (GLP-1R Agonist) for Early-Stage Parkinson's Disease",
    sponsor: "Neuraly Therapeutics",
    phase: "Phase 2",
    duration: "18 months",
    visits: 8,
    compensation: "$650 per patient",
    patientMatch: 9,
    specialties: ["Neurology", "Movement Disorders"],
    conditions: ["Early-Stage Parkinson's Disease"],
    description:
      "This trial investigates NLY01, a novel GLP-1R agonist designed to target neuroinflammation, in patients with early-stage Parkinson's disease. The study aims to determine if NLY01 can slow disease progression when integrated into standard clinical care.",
    status: "Recruiting",
  },
  {
    id: 5,
    name: "Tolebrutinib (BTK Inhibitor) for Relapsing Multiple Sclerosis",
    sponsor: "Sanofi Genzyme MS Research Initiative",
    phase: "Phase 3",
    duration: "24 months",
    visits: 10,
    compensation: "$800 per patient",
    patientMatch: 11,
    specialties: ["Neurology", "Neuroimmunology"],
    conditions: ["Relapsing Multiple Sclerosis"],
    description:
      "This pragmatic trial evaluates Tolebrutinib, an oral Bruton's tyrosine kinase (BTK) inhibitor, in patients with relapsing multiple sclerosis. The study focuses on real-world effectiveness in reducing relapses and disability progression with integration into routine neurological care.",
    status: "Recruiting",
  },
  {
    id: 6,
    name: "Fenfluramine for Dravet Syndrome and Lennox-Gastaut Syndrome",
    sponsor: "Zogenix Rare Epilepsy Consortium",
    phase: "Phase 4",
    duration: "12 months",
    visits: 6,
    compensation: "$600 per patient",
    patientMatch: 4,
    specialties: ["Neurology", "Pediatric Neurology", "Epileptology"],
    conditions: ["Dravet Syndrome", "Lennox-Gastaut Syndrome"],
    description:
      "This post-approval study evaluates the real-world effectiveness and safety of Fenfluramine in reducing seizure frequency in patients with Dravet syndrome and Lennox-Gastaut syndrome, two devastating forms of childhood-onset epilepsy.",
    status: "Recruiting",
  },
]

export default async function FindTrialsPage() {
  const user = await getServerUser()
  const supabase = await createClient()

  if (!user) {
    redirect("/login")
  }

  // Get all available conditions
  const { data: conditions } = await supabase
    .from("conditions")
    .select("id, name")
    .order("name")

  const availableConditions = conditions?.map(c => c.name) || []

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCondition, setSelectedCondition] = useState("")
  const [showTreatments, setShowTreatments] = useState(false)

  // Handle condition selection
  const handleConditionSelect = (condition: string) => {
    setSelectedCondition(condition)
    setShowTreatments(true)
  }

  const interventions = comparativeEffectivenessData[selectedCondition] || []

  const filteredTrials = trials.filter(
    (trial) =>
      trial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trial.sponsor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trial.conditions.some((condition) => condition.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/doctor/dashboard" className="text-muted-foreground hover:text-foreground">
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
                    <ConditionSearch
                      onConditionSelect={handleConditionSelect}
                      availableConditions={availableConditions}
                      placeholder="Search for a medical condition..."
                    />
                  </CardContent>
                </Card>

                {showTreatments && selectedCondition && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Treatments for {selectedCondition}</CardTitle>
                          <CardDescription>Ranked by comparative effectiveness</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCondition("")
                            setShowTreatments(false)
                          }}
                        >
                          Clear Results
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TreatmentRankingList
                        treatments={interventions}
                        condition={selectedCondition}
                        baseUrl="/doctor/trials/"
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by condition, treatment, or sponsor..."
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
                            <CardDescription>{trial.sponsor}</CardDescription>
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
                          <Link href={`/doctor/trials/${trial.id}/join`}>
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

