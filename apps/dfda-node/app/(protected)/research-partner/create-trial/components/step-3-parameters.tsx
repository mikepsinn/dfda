"use client"

import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Step3Props {
  nextStep: () => void
  prevStep: () => void
}

export function Step3Parameters({ nextStep, prevStep }: Step3Props) {
  return (
    <>
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
                  <span>The Decentralized FDA Fee (5%)</span>
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
                    <input type="checkbox" id="data-demographics" className="h-4 w-4 rounded border-gray-300" />
                    <Label htmlFor="data-demographics">Demographics</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="data-medical-history" className="h-4 w-4 rounded border-gray-300" />
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
                    <input type="checkbox" id="followup-symptoms" className="h-4 w-4 rounded border-gray-300" />
                    <Label htmlFor="followup-symptoms">Symptom Tracking</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="followup-side-effects" className="h-4 w-4 rounded border-gray-300" />
                    <Label htmlFor="followup-side-effects">Side Effects</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="followup-quality" className="h-4 w-4 rounded border-gray-300" />
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
    </>
  )
}

