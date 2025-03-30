"use client"

import { FileText, Info, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronRight } from "lucide-react"

interface Step1Props {
  nextStep: () => void
}

export function Step1TrialDetails({ nextStep }: Step1Props) {
  return (
    <>
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
                  <p className="text-xs text-muted-foreground">Upload your detailed trial protocol (PDF, DOCX)</p>
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
    </>
  )
}

