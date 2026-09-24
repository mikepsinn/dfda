"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronRight, Lock, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EhrAuthorizationFormProps {
    patientId: string;
}

export function EhrAuthorizationForm({ patientId }: EhrAuthorizationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [selectedCategories, setSelectedCategories] = useState({
        demographics: true,
        diagnoses: true,
        medications: true,
        allergies: true,
        labResults: true,
        vitalSigns: true,
        procedures: false,
        imaging: true,
        notes: false,
        immunizations: false,
        socialHistory: false,
        familyHistory: false,
    })
    const [consentNotes, setConsentNotes] = useState("")

    // Mock patient data (fetch based on patientId)
    const patient = {
        id: patientId,
        name: "James Wilson",
        age: 74,
        gender: "Male",
        condition: "Early Alzheimer's Disease",
        trial: "Lecanemab for Early Alzheimer's Disease",
        enrollmentDate: "March 15, 2025",
        ehrSystem: "Epic Systems",
        mrn: "MRN12345678",
        lastVisit: "May 5, 2025",
    }

    const handleCategoryChange = (category: keyof typeof selectedCategories) => {
        setSelectedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }))
    }

    const handleSubmit = () => {
        setIsSubmitting(true)
        console.log("Authorizing EHR data for patient:", patientId, "Categories:", selectedCategories, "Notes:", consentNotes);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false)
            setIsSuccess(true)
        }, 1500)
    }

    const selectedCategoriesCount = Object.values(selectedCategories).filter(Boolean).length
    const allCategoriesCount = Object.keys(selectedCategories).length

    return (
        <>
            {isSuccess ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="mt-4 text-2xl font-bold">Authorization Successful</h2>
                            <p className="mt-2 text-muted-foreground">
                                You have successfully authorized the sharing of EHR data for {patient.name}.
                            </p>
                            <div className="mt-6 flex gap-4">
                                <Link href="/provider/">
                                    <Button variant="outline">Return to Dashboard</Button>
                                </Link>
                                <Link href={`/provider/patients/${patientId}`}>
                                    <Button>View Patient</Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>EHR Data Authorization</CardTitle>
                        <CardDescription>
                            Authorize the sharing of specific EHR data categories for clinical trial participation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Patient Info Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">
                                    {patient.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="font-medium">{patient.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {patient.age} years • {patient.gender} • MRN: {patient.mrn}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge>{patient.condition}</Badge>
                                    <Badge variant="outline">{patient.ehrSystem}</Badge>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">{patient.trial}</div>
                                <p className="text-sm text-muted-foreground">Enrolled: {patient.enrollmentDate}</p>
                            </div>
                        </div>

                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertTitle>Patient Consent Required</AlertTitle>
                            <AlertDescription>
                                Ensure that you have obtained and documented the patient's informed consent before authorizing EHR
                                data sharing.
                            </AlertDescription>
                        </Alert>

                        {/* Category Selection */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Select Data Categories to Share</h3>
                            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                                {Object.entries({
                                    demographics: "Age, gender, race, ethnicity",
                                    diagnoses: "Current and historical conditions",
                                    medications: "Current and historical medications",
                                    allergies: "Medication and other allergies",
                                    labResults: "Laboratory test results",
                                    vitalSigns: "BP, heart rate, temperature, etc.",
                                    procedures: "Surgeries and other procedures",
                                    imaging: "Radiology reports and images",
                                    notes: "Clinical notes and summaries",
                                    immunizations: "Vaccination history",
                                    socialHistory: "Lifestyle, occupation, substance use",
                                    familyHistory: "Relevant family medical history",
                                }).map(([key, desc]) => (
                                    <div key={key} className="flex items-start space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={selectedCategories[key as keyof typeof selectedCategories]}
                                            onCheckedChange={() => handleCategoryChange(key as keyof typeof selectedCategories)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor={key} className="text-sm font-medium capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()} {/* Format key */}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Consent Notes */}
                        <div>
                            <Label htmlFor="consent-notes">Consent Documentation Notes (Optional)</Label>
                            <Textarea
                                id="consent-notes"
                                placeholder="e.g., Consent obtained verbally on [Date], documented in EHR note #12345..."
                                value={consentNotes}
                                onChange={(e) => setConsentNotes(e.target.value)}
                                className="mt-2"
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Add any relevant details about the consent process or documentation.
                            </p>
                        </div>

                         <Alert variant="destructive">
                            <Lock className="h-4 w-4" />
                            <AlertTitle>Data Security & Compliance</AlertTitle>
                            <AlertDescription>
                                Authorized data will be shared securely according to HIPAA and trial protocol guidelines.
                                Ensure you are complying with all institutional policies.
                            </AlertDescription>
                        </Alert>

                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                       <span className="text-sm text-muted-foreground">
                           {selectedCategoriesCount} of {allCategoriesCount} categories selected.
                       </span>
                        <Button onClick={handleSubmit} disabled={isSubmitting || selectedCategoriesCount === 0}>
                            {isSubmitting ? "Authorizing..." : "Authorize Selected Data"}
                            {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </>
    )
} 