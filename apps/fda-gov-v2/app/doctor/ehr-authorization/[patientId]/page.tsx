"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronRight, Lock, Shield, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function EhrAuthorization({ params }) {
  const patientId = params.patientId
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

  // Mock patient data
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

  const handleCategoryChange = (category) => {
    setSelectedCategories({
      ...selectedCategories,
      [category]: !selectedCategories[category],
    })
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  const selectedCategoriesCount = Object.values(selectedCategories).filter(Boolean).length
  const allCategoriesCount = Object.keys(selectedCategories).length

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/doctor/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">EHR Data Authorization</h1>
            </div>

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
                      <Link href="/doctor/dashboard">
                        <Button variant="outline">Return to Dashboard</Button>
                      </Link>
                      <Link href={`/doctor/patients/${patientId}`}>
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

                  <div>
                    <h3 className="text-lg font-medium mb-4">Select Data Categories to Share</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="demographics"
                          checked={selectedCategories.demographics}
                          onCheckedChange={() => handleCategoryChange("demographics")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="demographics" className="text-sm font-medium">
                            Demographics
                          </Label>
                          <p className="text-xs text-muted-foreground">Age, gender, race, ethnicity</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="diagnoses"
                          checked={selectedCategories.diagnoses}
                          onCheckedChange={() => handleCategoryChange("diagnoses")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="diagnoses" className="text-sm font-medium">
                            Diagnoses
                          </Label>
                          <p className="text-xs text-muted-foreground">Current and historical conditions</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="medications"
                          checked={selectedCategories.medications}
                          onCheckedChange={() => handleCategoryChange("medications")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="medications" className="text-sm font-medium">
                            Medications
                          </Label>
                          <p className="text-xs text-muted-foreground">Current and historical medications</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="allergies"
                          checked={selectedCategories.allergies}
                          onCheckedChange={() => handleCategoryChange("allergies")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="allergies" className="text-sm font-medium">
                            Allergies
                          </Label>
                          <p className="text-xs text-muted-foreground">Medication and other allergies</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="labResults"
                          checked={selectedCategories.labResults}
                          onCheckedChange={() => handleCategoryChange("labResults")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="labResults" className="text-sm font-medium">
                            Lab Results
                          </Label>
                          <p className="text-xs text-muted-foreground">Laboratory test results</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="vitalSigns"
                          checked={selectedCategories.vitalSigns}
                          onCheckedChange={() => handleCategoryChange("vitalSigns")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="vitalSigns" className="text-sm font-medium">
                            Vital Signs
                          </Label>
                          <p className="text-xs text-muted-foreground">BP, heart rate, temperature, etc.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="procedures"
                          checked={selectedCategories.procedures}
                          onCheckedChange={() => handleCategoryChange("procedures")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="procedures" className="text-sm font-medium">
                            Procedures
                          </Label>
                          <p className="text-xs text-muted-foreground">Surgeries and other procedures</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="imaging"
                          checked={selectedCategories.imaging}
                          onCheckedChange={() => handleCategoryChange("imaging")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="imaging" className="text-sm font-medium">
                            Imaging
                          </Label>
                          <p className="text-xs text-muted-foreground">MRI, CT, PET scans, etc.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="notes"
                          checked={selectedCategories.notes}
                          onCheckedChange={() => handleCategoryChange("notes")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="notes" className="text-sm font-medium">
                            Clinical Notes
                          </Label>
                          <p className="text-xs text-muted-foreground">Provider notes and assessments</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="immunizations"
                          checked={selectedCategories.immunizations}
                          onCheckedChange={() => handleCategoryChange("immunizations")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="immunizations" className="text-sm font-medium">
                            Immunizations
                          </Label>
                          <p className="text-xs text-muted-foreground">Vaccination history</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="socialHistory"
                          checked={selectedCategories.socialHistory}
                          onCheckedChange={() => handleCategoryChange("socialHistory")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="socialHistory" className="text-sm font-medium">
                            Social History
                          </Label>
                          <p className="text-xs text-muted-foreground">Smoking, alcohol, occupation</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="familyHistory"
                          checked={selectedCategories.familyHistory}
                          onCheckedChange={() => handleCategoryChange("familyHistory")}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="familyHistory" className="text-sm font-medium">
                            Family History
                          </Label>
                          <p className="text-xs text-muted-foreground">Family medical history</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground">
                      Selected {selectedCategoriesCount} of {allCategoriesCount} data categories
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <div className="flex items-start gap-4">
                        <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h3 className="font-medium">Data Protection & Privacy</h3>
                          <p className="text-sm text-muted-foreground mt-1">All shared EHR data will be:</p>
                          <ul className="mt-2 space-y-1 text-sm">
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              <span>De-identified according to HIPAA Safe Harbor standards</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              <span>Encrypted during transfer and at rest</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              <span>Accessible only to authorized trial personnel</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              <span>Used only for the purposes specified in the trial protocol</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              <span>Deleted upon trial completion or patient withdrawal</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="consent-notes">Consent Documentation Notes</Label>
                      <Textarea
                        id="consent-notes"
                        placeholder="Document how patient consent was obtained and any specific limitations or concerns..."
                        value={consentNotes}
                        onChange={(e) => setConsentNotes(e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    <User className="mr-2 h-4 w-4" />
                    View Patient Record
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedCategoriesCount === 0 || consentNotes.length < 10 || isSubmitting}
                  >
                    {isSubmitting ? "Authorizing..." : "Authorize Data Sharing"}
                    {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

