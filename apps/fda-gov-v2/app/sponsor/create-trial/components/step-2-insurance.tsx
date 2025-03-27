"use client"

import { Check, ChevronRight, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"

interface InsuranceQuote {
  provider: string
  pricePerSubject: number
  coverage: string
  rating: number
}

interface Step2Props {
  nextStep: () => void
  prevStep: () => void
}

export function Step2Insurance({ nextStep, prevStep }: Step2Props) {
  const [insuranceQuotes] = useState<InsuranceQuote[]>([
    { provider: "SafeTrial Insurance", pricePerSubject: 120, coverage: "$2M", rating: 4.8 },
    { provider: "MedSecure", pricePerSubject: 145, coverage: "$3M", rating: 4.9 },
    { provider: "TrialGuard", pricePerSubject: 95, coverage: "$1.5M", rating: 4.5 },
  ])
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null)

  return (
    <>
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

        <RadioGroup defaultValue={selectedInsurance || ""} onValueChange={(value) => setSelectedInsurance(value)}>
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
              <p className="text-sm text-muted-foreground">Already have insurance or prefer a different provider?</p>
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
    </>
  )
}

