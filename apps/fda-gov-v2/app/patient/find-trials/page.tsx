"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Beaker,
  ChevronRight,
  Search,
  ThumbsUp,
  Zap,
  MapPin,
  BarChart,
  Clock,
  FileText,
  Star,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Example comparative effectiveness data for various conditions
const comparativeEffectivenessData: ComparativeEffectivenessData = {
  "Type 2 Diabetes": [
    { name: "Metformin", effectiveness: 87, trials: 245, participants: 35000 },
    { name: "GLP-1 Receptor Agonists", effectiveness: 82, trials: 178, participants: 28000 },
    { name: "SGLT2 Inhibitors", effectiveness: 79, trials: 156, participants: 24000 },
    { name: "DPP-4 Inhibitors", effectiveness: 72, trials: 189, participants: 30000 },
    { name: "Sulfonylureas", effectiveness: 68, trials: 210, participants: 32000 },
  ],
  "Rheumatoid Arthritis": [
    { name: "TNF Inhibitors", effectiveness: 85, trials: 156, participants: 22000 },
    { name: "JAK Inhibitors", effectiveness: 81, trials: 98, participants: 15000 },
    { name: "Methotrexate", effectiveness: 76, trials: 178, participants: 25000 },
    { name: "IL-6 Inhibitors", effectiveness: 74, trials: 87, participants: 12000 },
    { name: "Hydroxychloroquine", effectiveness: 65, trials: 134, participants: 18000 },
  ],
  Hypertension: [
    { name: "ACE Inhibitors", effectiveness: 88, trials: 267, participants: 40000 },
    { name: "ARBs", effectiveness: 86, trials: 234, participants: 35000 },
    { name: "Calcium Channel Blockers", effectiveness: 83, trials: 198, participants: 30000 },
    { name: "Thiazide Diuretics", effectiveness: 79, trials: 176, participants: 27000 },
    { name: "Beta Blockers", effectiveness: 75, trials: 210, participants: 32000 },
  ],
  Depression: [
    { name: "SSRIs", effectiveness: 80, trials: 289, participants: 45000 },
    { name: "SNRIs", effectiveness: 78, trials: 176, participants: 28000 },
    { name: "Bupropion", effectiveness: 75, trials: 145, participants: 22000 },
    { name: "Mirtazapine", effectiveness: 72, trials: 98, participants: 15000 },
    { name: "Tricyclic Antidepressants", effectiveness: 68, trials: 134, participants: 20000 },
  ],
  Asthma: [
    { name: "Inhaled Corticosteroids", effectiveness: 89, trials: 234, participants: 35000 },
    { name: "Long-Acting Beta Agonists", effectiveness: 85, trials: 198, participants: 30000 },
    { name: "Leukotriene Modifiers", effectiveness: 78, trials: 156, participants: 24000 },
    { name: "Short-Acting Beta Agonists", effectiveness: 76, trials: 178, participants: 27000 },
    { name: "Anticholinergics", effectiveness: 72, trials: 123, participants: 18000 },
  ],
  "Chronic Pain": [
    { name: "Gabapentinoids", effectiveness: 76, trials: 187, participants: 28000 },
    { name: "SNRIs", effectiveness: 74, trials: 156, participants: 24000 },
    { name: "Topical NSAIDs", effectiveness: 71, trials: 134, participants: 20000 },
    { name: "Opioids", effectiveness: 70, trials: 210, participants: 32000 },
    { name: "Acetaminophen", effectiveness: 65, trials: 178, participants: 27000 },
  ],
}

const platformBenefits = [
  {
    icon: Zap,
    title: "80X Cost Reduction",
    description: "Our platform dramatically reduces trial costs through automation and decentralization.",
  },
  {
    icon: MapPin,
    title: "93% Less Travel",
    description: "Participate from home with remote monitoring and virtual check-ins.",
  },
  {
    icon: BarChart,
    title: "40% Better Data Quality",
    description: "Real-time data collection and advanced analytics improve trial outcomes.",
  },
  {
    icon: Clock,
    title: "85% Faster Setup",
    description: "Streamlined processes get trials up and running in days, not months.",
  },
]

interface ComparativeEffectivenessData {
  [key: string]: Array<{
    name: string
    effectiveness: number
    trials: number
    participants: number
  }>
}

export default function FindTrials() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCondition, setSelectedCondition] = useState("")
  const [showResults, setShowResults] = useState(false)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setShowResults(true)
  }

  const interventions = comparativeEffectivenessData[selectedCondition] || []

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Find Clinical Trials</h1>
            </div>

            {!showResults ? (
              <Card>
                <CardHeader>
                  <CardTitle>Search for Interventions</CardTitle>
                  <CardDescription>
                    Enter your condition to see ranked interventions based on effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Medical Condition</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="condition"
                          placeholder="e.g., Type 2 Diabetes, Rheumatoid Arthritis, etc."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Platform Benefits</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {platformBenefits.map((benefit, index) => (
                          <div key={index} className="flex items-start space-x-3 rounded-lg border p-3">
                            <benefit.icon className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium">{benefit.title}</h4>
                              <p className="text-sm text-muted-foreground">{benefit.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Personalized Insights</h3>
                      <div className="rounded-lg border p-4 bg-primary/5">
                        <div className="flex items-start gap-4">
                          <FileText className="h-6 w-6 text-primary shrink-0" />
                          <div>
                            <h4 className="font-medium">N-of-1 Studies</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Our platform generates personalized health insights based on your individual data.
                              Understand how treatments affect your specific health patterns.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {["Sleep Quality", "Pain Levels", "Energy", "Mood"].map((factor, index) => (
                                <TooltipProvider key={index}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                        {factor}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>See how treatments affect your {factor.toLowerCase()}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      Search Interventions
                    </Button>
                  </form>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Popular Conditions</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {Object.keys(comparativeEffectivenessData).map((condition) => (
                        <Button
                          key={condition}
                          variant="outline"
                          className="justify-start"
                          onClick={() => {
                            setSearchTerm(condition)
                            setSelectedCondition(condition)
                          }}
                        >
                          {condition}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Results for "{searchTerm || selectedCondition}"</CardTitle>
                        <CardDescription>Interventions ranked by comparative effectiveness</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowResults(false)}>
                        New Search
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border p-4 bg-muted/50 mb-6">
                      <div className="flex items-start gap-4">
                        <ThumbsUp className="h-6 w-6 text-primary" />
                        <div>
                          <h4 className="font-medium">Evidence-Based Rankings</h4>
                          <p className="text-sm text-muted-foreground">
                            Rankings are based on the aggregate of clinical trials and real-world evidence. Higher
                            percentages indicate better outcomes for patients with your condition.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {interventions.map((intervention, index) => (
                        <div key={index} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{intervention.name}</h3>
                                {index === 0 && (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    Top Rated
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Based on {intervention.trials} trials with {intervention.participants.toLocaleString()}{" "}
                                participants
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{intervention.effectiveness}%</div>
                              <p className="text-xs text-muted-foreground">Effectiveness</p>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <Link href={`/patient/trial-details/${index + 1}`}>
                              <Button size="sm">
                                View Available Trials <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Trial Participation Benefits</CardTitle>
                        <CardDescription>Joining a trial through our platform offers unique advantages</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex items-start space-x-3 rounded-lg border p-3">
                            <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Early Access to Treatments</h4>
                              <p className="text-sm text-muted-foreground">
                                Be among the first to benefit from innovative therapies
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 rounded-lg border p-3">
                            <Users className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium">Contribute to Medical Advances</h4>
                              <p className="text-sm text-muted-foreground">
                                Help improve treatments for your condition and others
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 rounded-lg border p-3">
                            <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Personalized Health Insights</h4>
                              <p className="text-sm text-muted-foreground">
                                Gain valuable data about your own health patterns
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 rounded-lg border p-3">
                            <Beaker className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Cutting-Edge Care</h4>
                              <p className="text-sm text-muted-foreground">
                                Access state-of-the-art medical technologies and expertise
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

