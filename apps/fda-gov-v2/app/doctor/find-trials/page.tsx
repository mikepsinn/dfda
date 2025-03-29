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
import { FindTrialsClient } from "./components/find-trials-client"

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

  return <FindTrialsClient availableConditions={availableConditions} />
}

