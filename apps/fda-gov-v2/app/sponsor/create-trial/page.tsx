"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronRight, FileText, Info, Shield, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function CreateTrial() {
  const [step, setStep] = useState(1)
  const [insuranceQuotes] = useState([
    { provider: "SafeTrial Insurance", pricePerSubject: 120, coverage: "$2M", rating: 4.8 },
    { provider: "MedSecure", pricePerSubject: 145, coverage: "$3M", rating: 4.9 },
    { provider: "TrialGuard", pricePerSubject: 95, coverage: "$1.5M", rating: 4.5 },
  ])
  const [selectedInsurance, setSelectedInsurance] = useState<string>("")

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

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
              <h1 className="text-2xl font-bold">Create a Decentralized Clinical Trial</h1>
            </div>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 1 ? "bg-primary text-primary-foreground" : "border bg-muted"}`}
                  >
                    {step > 1 ? <Check className="h-5 w-5" /> : "1"}
                  </div>
                  <div className={`h-0.5 w-12 ${step > 1 ? "bg-primary" : "bg-muted"}`}></div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 2 ? "bg-primary text-primary-foreground" : "border bg-muted"}`}
                  >
                    {step > 2 ? <Check className="h-5 w-5" /> : "2"}
                  </div>
                  <div className={`h-0.5 w-12 ${step > 2 ? "bg-primary" : "bg-muted"}`}></div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 3 ? "bg-primary text-primary-foreground" : "border bg-muted"}`}
                  >
                    {step > 3 ? <Check className="h-5 w-5" /> : "3"}
                  </div>
                  <div className={`h-0.5 w-12 ${step > 3 ? "bg-primary" : "bg-muted"}`}></div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 4 ? "bg-primary text-primary-foreground" : "border bg-muted"}`}
                  >
                    4
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Step {step} of 4</div>
              </div>
              <div className="mt-2 grid grid-cols-4 text-center text-sm">
                <div>Trial Details</div>
                <div>Insurance</div>
                <div>Parameters</div>
                <div>Review & Submit</div>
              </div>
            </div>

            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Trial Details</CardTitle>
                  <CardDescription>Provide information about your clinical trial</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="trial-name">Trial Name</Label>
                    <Input id="trial-name" placeholder="e.g., Efficacy of Treatment X for Condition Y" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trial-description">Trial Description</Label>
                    <Textarea
                      id="trial-description"
                      placeholder="Describe the purpose and goals of your clinical trial"
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="trial-type">Trial Type</Label>
                      <Select defaultValue="interventional">
                        <SelectTrigger id="trial-type">
                          <SelectValue placeholder="Select trial type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interventional">Interventional</SelectItem>
                          <SelectItem value="observational">Observational</SelectItem>
                          <SelectItem value="expanded-access">Expanded Access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trial-phase">Trial Phase</Label>
                      <Select defaultValue="phase2">
                        <SelectTrigger id="trial-phase">
                          <SelectValue placeholder="Select trial phase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phase1">Phase 1</SelectItem>
                          <SelectItem value="phase2">Phase 2</SelectItem>
                          <SelectItem value="phase3">Phase 3</SelectItem>
                          <SelectItem value="phase4">Phase 4</SelectItem>
                          <SelectItem value="na">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Target Condition</Label>
                    <Input id="condition" placeholder="e.g., Type 2 Diabetes, Hypertension, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intervention">Intervention/Treatment</Label>
                    <Input id="intervention" placeholder="e.g., Drug X, Device Y, Behavioral Therapy Z" />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Documentation</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Info</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Upload your trial protocol, pre-clinical data, and other relevant documentation
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <div className="mx-auto flex max-w-[180px] flex-col items-center justify-center gap-2">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Trial Protocol</p>
                            <p className="text-xs text-muted-foreground">
                              Upload your detailed trial protocol (PDF, DOCX)
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="mt-2">
                            Upload Protocol
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <div className="mx-auto flex max-w-[180px] flex-col items-center justify-center gap-2">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Pre-Clinical Data</p>
                            <p className="text-xs text-muted-foreground">
                              Upload your pre-clinical data and supporting evidence (PDF, XLSX)
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="mt-2">
                            Upload Data
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Supply Chain</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Info</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Register your supply chain for the trial intervention</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <Truck className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">Supply Chain Registration</h4>
                          <p className="text-sm text-muted-foreground">
                            Register manufacturers, distributors, and logistics partners
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                          Register
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" disabled>
                    Back
                  </Button>
                  <Button onClick={nextStep}>
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Selection</CardTitle>
                  <CardDescription>Choose liability insurance for your trial participants</CardDescription>
                  <div className="mt-4 rounded-lg bg-primary/5 p-4">
                    <div className="flex items-start gap-4">
                      <Shield className="h-8 w-8 text-primary shrink-0" />
                      <div>
                        <h3 className="font-medium">Insurance Benefits</h3>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>Instant quotes save 2-3 weeks of negotiation time</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>Pre-negotiated rates are 35-50% lower than market average</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>Automated claims processing reduces administrative burden</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Shield className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-medium">Automatic Insurance Quotes</h3>
                        <p className="text-sm text-muted-foreground">
                          Based on your trial details, we've generated the following per-subject insurance quotes
                        </p>
                      </div>
                    </div>
                  </div>

                  <RadioGroup defaultValue={selectedInsurance} onValueChange={(value) => setSelectedInsurance(value)}>
                    {insuranceQuotes.map((quote, index) => (
                      <div key={index} className="flex items-center space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value={quote.provider} id={`insurance-${index}`} />
                        <Label htmlFor={`insurance-${index}`} className="flex flex-1 items-center justify-between">
                          <div>
                            <div className="font-medium">{quote.provider}</div>
                            <div className="text-sm text-muted-foreground">Coverage: {quote.coverage} per subject</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${quote.pricePerSubject} per subject</div>
                            <div className="text-sm text-muted-foreground">Rating: {quote.rating}/5.0</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Custom Insurance</h4>
                        <p className="text-sm text-muted-foreground">
                          Already have insurance or prefer a different provider?
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Upload Policy
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button onClick={nextStep}>
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Trial Parameters</CardTitle>
                  <CardDescription>Set pricing, data requirements, and deposit amounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="pricing">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pricing">Pricing</TabsTrigger>
                      <TabsTrigger value="data">Data Requirements</TabsTrigger>
                      <TabsTrigger value="deposits">Deposits</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pricing" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="patient-price">Patient Price</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">$</span>
                          <Input id="patient-price" type="number" placeholder="0.00" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Set the price patients will pay to participate in your trial
                        </p>
                      </div>
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <h4 className="font-medium">Price Breakdown</h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Development Costs</span>
                            <span>$X per patient</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Insurance</span>
                            <span>$120 per patient</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Platform Fee (5%)</span>
                            <span>$Y per patient</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>$Z per patient</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="data" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Baseline Data Requirements</Label>
                        <div className="rounded-lg border p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="data-demographics"
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Label htmlFor="data-demographics">Demographics</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="data-medical-history"
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Label htmlFor="data-medical-history">Medical History</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="data-lab-tests" className="h-4 w-4 rounded border-gray-300" />
                              <Label htmlFor="data-lab-tests">Lab Tests</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="data-genetic" className="h-4 w-4 rounded border-gray-300" />
                              <Label htmlFor="data-genetic">Genetic Information</Label>
                            </div>
                            <Button variant="outline" size="sm" className="mt-2">
                              Add Custom Requirement
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Follow-up Data Requirements</Label>
                        <div className="rounded-lg border p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="followup-symptoms"
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Label htmlFor="followup-symptoms">Symptom Tracking</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="followup-side-effects"
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Label htmlFor="followup-side-effects">Side Effects</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="followup-quality"
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Label htmlFor="followup-quality">Quality of Life Measures</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="followup-lab" className="h-4 w-4 rounded border-gray-300" />
                              <Label htmlFor="followup-lab">Follow-up Lab Tests</Label>
                            </div>
                            <Button variant="outline" size="sm" className="mt-2">
                              Add Custom Requirement
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="deposits" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="deposit-amount">Refundable Deposit Amount</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">$</span>
                          <Input id="deposit-amount" type="number" placeholder="0.00" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Set a refundable deposit that will be returned to patients upon providing follow-up data
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Deposit Return Milestones</Label>
                        <div className="rounded-lg border p-4">
                          <div className="space-y-4">
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div>
                                <Label htmlFor="milestone1-days">Days After Enrollment</Label>
                                <Input id="milestone1-days" type="number" placeholder="30" />
                              </div>
                              <div>
                                <Label htmlFor="milestone1-data">Required Data</Label>
                                <Select defaultValue="symptoms">
                                  <SelectTrigger id="milestone1-data">
                                    <SelectValue placeholder="Select data" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="symptoms">Symptom Report</SelectItem>
                                    <SelectItem value="side-effects">Side Effects</SelectItem>
                                    <SelectItem value="lab-tests">Lab Tests</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="milestone1-amount">Return Amount</Label>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">$</span>
                                  <Input id="milestone1-amount" type="number" placeholder="0.00" />
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Add Another Milestone
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button onClick={nextStep}>
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Submit</CardTitle>
                  <CardDescription>Review your trial details before submitting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Trial Details</h3>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-sm font-medium">Trial Name:</span>
                        <p className="text-sm text-muted-foreground">Efficacy of Treatment X for Condition Y</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Trial Type:</span>
                        <p className="text-sm text-muted-foreground">Interventional</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Trial Phase:</span>
                        <p className="text-sm text-muted-foreground">Phase 2</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Target Condition:</span>
                        <p className="text-sm text-muted-foreground">Type 2 Diabetes</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Insurance</h3>
                    <div className="mt-2">
                      <div>
                        <span className="text-sm font-medium">Selected Provider:</span>
                        <p className="text-sm text-muted-foreground">SafeTrial Insurance</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Coverage:</span>
                        <p className="text-sm text-muted-foreground">$2M per subject</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Cost:</span>
                        <p className="text-sm text-muted-foreground">$120 per subject</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Trial Parameters</h3>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-sm font-medium">Patient Price:</span>
                        <p className="text-sm text-muted-foreground">$250 per patient</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Refundable Deposit:</span>
                        <p className="text-sm text-muted-foreground">$100</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Data Requirements:</span>
                        <p className="text-sm text-muted-foreground">
                          Demographics, Medical History, Symptom Tracking, Side Effects
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-dashed p-4 bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Info className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Next Steps</h4>
                        <p className="text-sm text-muted-foreground">
                          After submission, your trial will be reviewed for compliance with platform standards. Once
                          approved, it will be listed in the marketplace for patient enrollment.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button>Submit Trial</Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

