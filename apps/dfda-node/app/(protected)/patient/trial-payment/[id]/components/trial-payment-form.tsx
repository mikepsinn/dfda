"use client"

import { useState, useRef, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, CreditCard, Info, Lock, Shield, Percent, Beaker } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface TrialPaymentFormProps {
  trialId: string;
}

export function TrialPaymentForm({ trialId }: TrialPaymentFormProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [formErrors, setFormErrors] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  })

  // Using refs for direct input access (alternative to getElementById)
  const cardNumberRef = useRef<HTMLInputElement>(null)
  const cardNameRef = useRef<HTMLInputElement>(null)
  const expiryDateRef = useRef<HTMLInputElement>(null)
  const cvvRef = useRef<HTMLInputElement>(null)

  // Mock trial data (fetch based on trialId)
  const trial = {
    id: trialId,
    name: "Efficacy of Treatment A for Rheumatoid Arthritis",
    research_partner: "Innovative Therapeutics Inc.",
    phase: "Phase 2",
    status: "Recruiting",
    paymentDetails: {
      enrollmentFee: 199,
      refundableDeposit: 100,
      totalDue: 299,
      traditionalCost: 995,
      savingsPercent: 80,
      savingsAmount: 796,
      refundPolicy: "Full refund available within 14 days of enrollment if you decide to withdraw.",
    },
  }

  const validateForm = () => {
    const errors = {
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
    }
    let isValid = true

    const cardNumber = cardNumberRef.current?.value || "";
    if (!cardNumber || cardNumber.replace(/\s/g, "").length !== 16) {
      errors.cardNumber = "Please enter a valid 16-digit card number"
      isValid = false
    }

    const cardName = cardNameRef.current?.value || "";
    if (!cardName) {
      errors.cardName = "Please enter the name on card"
      isValid = false
    }

    const expiryDate = expiryDateRef.current?.value || "";
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      errors.expiryDate = "Please enter a valid expiry date (MM/YY)"
      isValid = false
    }

    const cvv = cvvRef.current?.value || "";
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      errors.cvv = "Please enter a valid CVV"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement | HTMLButtonElement>) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsProcessing(true)
    console.log("Processing payment for trial:", trialId);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setPaymentComplete(true)
    }, 2000)
  }

  const handleCardNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})/g, "$1 ").trim();
    if (cardNumberRef.current) cardNumberRef.current.value = formatted;
  }

  const handleExpiryDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
     if (expiryDateRef.current) expiryDateRef.current.value = value;
  }

  return (
    <>
      {!paymentComplete ? (
        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Enter your payment information securely</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Using form element for semantics, but handling submit via button click */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <Input
                        ref={cardNumberRef}
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        className={formErrors.cardNumber ? "border-destructive" : ""}
                        onChange={handleCardNumberInput} // Use controlled input formatting
                      />
                      <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    {formErrors.cardNumber && <p className="text-sm text-destructive">{formErrors.cardNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input
                      ref={cardNameRef}
                      id="cardName"
                      placeholder="John Smith"
                      className={formErrors.cardName ? "border-destructive" : ""}
                    />
                    {formErrors.cardName && <p className="text-sm text-destructive">{formErrors.cardName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        ref={expiryDateRef}
                        id="expiryDate"
                        placeholder="MM/YY"
                        className={formErrors.expiryDate ? "border-destructive" : ""}
                        onChange={handleExpiryDateInput} // Use controlled input formatting
                      />
                      {formErrors.expiryDate && <p className="text-sm text-destructive">{formErrors.expiryDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="cvv">CVV</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The 3 or 4 digit security code on the back of your card</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        ref={cvvRef}
                        id="cvv"
                        placeholder="123"
                        maxLength={4}
                        type="password" // Use password type for masking
                        className={formErrors.cvv ? "border-destructive" : ""}
                      />
                      {formErrors.cvv && <p className="text-sm text-destructive">{formErrors.cvv}</p>}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Alert variant="outline" className="border-primary/20 bg-primary/5">
                      <Lock className="h-4 w-4 text-primary" />
                      <AlertTitle>Secure Payment</AlertTitle>
                      <AlertDescription>
                        Your payment information is encrypted and secure. We do not store your full card details.
                      </AlertDescription>
                    </Alert>
                  </div>
                  {/* Hidden submit button for form semantics if needed, actual trigger is below */}
                  <button type="submit" className="hidden"></button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button className="w-full" onClick={handleSubmit} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : `Pay $${trial.paymentDetails.totalDue}`}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By clicking "Pay", you agree to our{" "}
                  <Link href="/terms" className="underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline">
                    Privacy Policy
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>

          {/* Order Summary Column */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Beaker className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{trial.name}</p>
                      <p className="text-sm text-muted-foreground">Provided by {trial.research_partner}</p>
                    </div>
                  </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrollment Fee</span>
                  <span>${trial.paymentDetails.enrollmentFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refundable Deposit</span>
                  <span>${trial.paymentDetails.refundableDeposit.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Due Today</span>
                  <span>${trial.paymentDetails.totalDue.toFixed(2)}</span>
                </div>

                 <Alert variant="default" className="bg-green-50 border-green-200">
                  <Percent className="h-4 w-4 text-green-700" />
                  <AlertTitle className="text-green-800">Significant Savings!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Traditional cost: ${trial.paymentDetails.traditionalCost}. You save {trial.paymentDetails.savingsPercent}% (${trial.paymentDetails.savingsAmount}) by participating!
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                    {trial.paymentDetails.refundPolicy}
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                Your enrollment in "{trial.name}" is confirmed.
                You will receive an email confirmation shortly.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                 <Link href={`/patient/trial-details/${trialId}`}>
                   <Button variant="outline">View Trial Details</Button>
                </Link>
                 <Link href="/patient/">
                    <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
} 