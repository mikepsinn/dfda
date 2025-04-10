"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Example comparative effectiveness data for various conditions
const comparativeEffectivenessData = {
  "Type 2 Diabetes": [
    {
      name: "Metformin",
      effectiveness: 87,
      trials: 245,
      participants: 35000,
      sideEffects: [
        { name: "Gastrointestinal", percentage: 25 },
        { name: "B12 deficiency", percentage: 6 },
      ],
    },
    {
      name: "GLP-1 Receptor Agonists",
      effectiveness: 82,
      trials: 178,
      participants: 28000,
      sideEffects: [
        { name: "Nausea", percentage: 28 },
        { name: "Vomiting", percentage: 10 },
      ],
    },
    {
      name: "SGLT2 Inhibitors",
      effectiveness: 79,
      trials: 156,
      participants: 24000,
      sideEffects: [
        { name: "UTI", percentage: 8 },
        { name: "Genital infection", percentage: 5 },
      ],
    },
    {
      name: "DPP-4 Inhibitors",
      effectiveness: 72,
      trials: 189,
      participants: 30000,
      sideEffects: [
        { name: "Headache", percentage: 5 },
        { name: "Nasopharyngitis", percentage: 4 },
      ],
    },
    {
      name: "Sulfonylureas",
      effectiveness: 68,
      trials: 210,
      participants: 32000,
      sideEffects: [
        { name: "Hypoglycemia", percentage: 20 },
        { name: "Weight gain", percentage: 15 },
      ],
    },
  ],
  "Rheumatoid Arthritis": [
    {
      name: "TNF Inhibitors",
      effectiveness: 85,
      trials: 156,
      participants: 22000,
      sideEffects: [
        { name: "Injection site reactions", percentage: 18 },
        { name: "Increased infection risk", percentage: 12 },
      ],
    },
    {
      name: "JAK Inhibitors",
      effectiveness: 81,
      trials: 98,
      participants: 15000,
      sideEffects: [
        { name: "Upper respiratory infections", percentage: 14 },
        { name: "Headache", percentage: 9 },
      ],
    },
    {
      name: "Methotrexate",
      effectiveness: 76,
      trials: 178,
      participants: 25000,
      sideEffects: [
        { name: "Nausea", percentage: 17 },
        { name: "Liver enzyme elevation", percentage: 10 },
      ],
    },
    {
      name: "IL-6 Inhibitors",
      effectiveness: 74,
      trials: 87,
      participants: 12000,
      sideEffects: [
        { name: "Neutropenia", percentage: 8 },
        { name: "Elevated lipids", percentage: 15 },
      ],
    },
    {
      name: "Hydroxychloroquine",
      effectiveness: 65,
      trials: 134,
      participants: 18000,
      sideEffects: [
        { name: "Retinopathy", percentage: 2 },
        { name: "GI disturbance", percentage: 11 },
      ],
    },
  ],
  Hypertension: [
    {
      name: "ACE Inhibitors",
      effectiveness: 88,
      trials: 267,
      participants: 40000,
      sideEffects: [
        { name: "Dry cough", percentage: 15 },
        { name: "Dizziness", percentage: 7 },
      ],
    },
    {
      name: "ARBs",
      effectiveness: 86,
      trials: 234,
      participants: 35000,
      sideEffects: [
        { name: "Headache", percentage: 6 },
        { name: "Dizziness", percentage: 5 },
      ],
    },
    {
      name: "Calcium Channel Blockers",
      effectiveness: 83,
      trials: 198,
      participants: 30000,
      sideEffects: [
        { name: "Peripheral edema", percentage: 12 },
        { name: "Constipation", percentage: 8 },
      ],
    },
    {
      name: "Thiazide Diuretics",
      effectiveness: 79,
      trials: 176,
      participants: 27000,
      sideEffects: [
        { name: "Hypokalemia", percentage: 9 },
        { name: "Hyperuricemia", percentage: 7 },
      ],
    },
    {
      name: "Beta Blockers",
      effectiveness: 75,
      trials: 210,
      participants: 32000,
      sideEffects: [
        { name: "Fatigue", percentage: 14 },
        { name: "Bradycardia", percentage: 10 },
      ],
    },
  ],
  Depression: [
    {
      name: "SSRIs",
      effectiveness: 80,
      trials: 289,
      participants: 45000,
      sideEffects: [
        { name: "Sexual dysfunction", percentage: 35 },
        { name: "Insomnia", percentage: 15 },
      ],
    },
    {
      name: "SNRIs",
      effectiveness: 78,
      trials: 176,
      participants: 28000,
      sideEffects: [
        { name: "Nausea", percentage: 22 },
        { name: "Increased blood pressure", percentage: 8 },
      ],
    },
    {
      name: "Bupropion",
      effectiveness: 75,
      trials: 145,
      participants: 22000,
      sideEffects: [
        { name: "Insomnia", percentage: 18 },
        { name: "Dry mouth", percentage: 14 },
      ],
    },
    {
      name: "Mirtazapine",
      effectiveness: 72,
      trials: 98,
      participants: 15000,
      sideEffects: [
        { name: "Weight gain", percentage: 25 },
        { name: "Sedation", percentage: 30 },
      ],
    },
    {
      name: "Tricyclic Antidepressants",
      effectiveness: 68,
      trials: 134,
      participants: 20000,
      sideEffects: [
        { name: "Anticholinergic effects", percentage: 28 },
        { name: "Orthostatic hypotension", percentage: 15 },
      ],
    },
  ],
}

export function ComparativeEffectivenessSection() {
  const [selectedCondition, setSelectedCondition] = useState("Type 2 Diabetes")
  const [searchQuery, setSearchQuery] = useState("")
  const conditions = Object.keys(comparativeEffectivenessData)

  // Filter conditions based on search query
  const filteredConditions = conditions.filter((condition) =>
    condition.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Comparative Effectiveness Rankings
          </h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Explore evidence-based rankings of interventions for various conditions
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl">
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="text-center">
                <CardTitle>Interventions by Condition</CardTitle>
                <CardDescription>
                  Ranked by effectiveness based on clinical trials and real-world evidence
                </CardDescription>
              </div>

              {/* Search box */}
              <div className="relative w-full max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Search conditions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-full border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery("")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span className="sr-only">Clear search</span>
                  </button>
                )}
              </div>

              {filteredConditions.length > 0 ? (
                <div className="w-full flex flex-wrap gap-2 justify-center">
                  {filteredConditions.map((condition) => (
                    <Button
                      key={condition}
                      variant={selectedCondition === condition ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setSelectedCondition(condition)}
                    >
                      {condition}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-2">
                  No conditions found matching "{searchQuery}"
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {comparativeEffectivenessData[selectedCondition].map((intervention, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{intervention.name}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{intervention.effectiveness}%</div>
                        <p className="text-xs text-muted-foreground">Effectiveness</p>
                      </div>
                    </div>
                    <div className="relative h-2 w-full bg-gray-200 rounded-full mb-4">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                        style={{ width: `${intervention.effectiveness}%` }}
                      ></div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                      <p className="text-muted-foreground">
                        Based on {intervention.trials} trials with {intervention.participants.toLocaleString()}{" "}
                        participants
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {intervention.sideEffects.map((effect, effectIndex) => (
                          <TooltipProvider key={effectIndex}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {effect.name}: {effect.percentage}%
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {effect.percentage}% of patients experienced {effect.name}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        <Link
                          href={`/app/(protected)/patient/join-trial/${encodeURIComponent(intervention.name)}/${encodeURIComponent(selectedCondition)}`}
                          className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 border border-purple-300 hover:bg-purple-200 transition-colors ml-auto sm:ml-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <path d="M12 5v14"></path>
                            <path d="M5 12h14"></path>
                          </svg>
                          Join Trial
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">Data updated: June 2025</p>
              <Link href="/app/(protected)/patient/find-trials">
                <Button variant="outline">
                  Explore More Conditions <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}

