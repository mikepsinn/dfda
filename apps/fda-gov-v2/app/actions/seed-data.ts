"use server"

import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function seedDatabase() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    // Seed conditions
    const conditions = [
      {
        name: "Type 2 Diabetes",
        description: "A chronic condition that affects the way the body processes blood sugar (glucose).",
        icd_code: "E11",
      },
      {
        name: "Hypertension",
        description:
          "High blood pressure is a common condition in which the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems.",
        icd_code: "I10",
      },
      {
        name: "Rheumatoid Arthritis",
        description:
          "An inflammatory disorder that affects the joints, causing pain, swelling, and potential joint deformity.",
        icd_code: "M05",
      },
      {
        name: "Asthma",
        description:
          "A condition in which airways narrow and swell and may produce extra mucus, making breathing difficult.",
        icd_code: "J45",
      },
      {
        name: "Depression",
        description:
          "A mental health disorder characterized by persistently depressed mood or loss of interest in activities.",
        icd_code: "F32",
      },
    ]

    await supabase.from("conditions").upsert(conditions, { onConflict: "name" })

    // Seed treatments
    const treatments = [
      {
        name: "Metformin",
        description: "An oral diabetes medicine that helps control blood sugar levels.",
        treatment_type: "medication",
        manufacturer: "Various",
        approval_status: "approved",
      },
      {
        name: "Lisinopril",
        description: "An ACE inhibitor that is used to treat high blood pressure and heart failure.",
        treatment_type: "medication",
        manufacturer: "Various",
        approval_status: "approved",
      },
      {
        name: "Adalimumab",
        description: "A TNF inhibitor used to treat rheumatoid arthritis and other inflammatory conditions.",
        treatment_type: "biologic",
        manufacturer: "AbbVie",
        approval_status: "approved",
      },
      {
        name: "Albuterol",
        description: "A bronchodilator that relaxes muscles in the airways and increases air flow to the lungs.",
        treatment_type: "medication",
        manufacturer: "Various",
        approval_status: "approved",
      },
      {
        name: "Sertraline",
        description: "An antidepressant in a group of drugs called selective serotonin reuptake inhibitors (SSRIs).",
        treatment_type: "medication",
        manufacturer: "Various",
        approval_status: "approved",
      },
      {
        name: "Lifestyle Modification",
        description: "Changes in diet, exercise, and other lifestyle factors to improve health outcomes.",
        treatment_type: "non-pharmacological",
        manufacturer: null,
        approval_status: "not_applicable",
      },
      {
        name: "Cognitive Behavioral Therapy",
        description:
          "A type of psychotherapy in which negative patterns of thought are challenged in order to alter unwanted behavior patterns.",
        treatment_type: "therapy",
        manufacturer: null,
        approval_status: "not_applicable",
      },
    ]

    await supabase.from("treatments").upsert(treatments, { onConflict: "name" })

    // Get IDs for the seeded data
    const { data: conditionData } = await supabase.from("conditions").select("id, name")
    const { data: treatmentData } = await supabase.from("treatments").select("id, name")

    const conditionMap = {}
    const treatmentMap = {}

    conditionData.forEach((condition) => {
      conditionMap[condition.name] = condition.id
    })

    treatmentData.forEach((treatment) => {
      treatmentMap[treatment.name] = treatment.id
    })

    // Seed treatment effectiveness
    const effectiveness = [
      {
        treatment_id: treatmentMap["Metformin"],
        condition_id: conditionMap["Type 2 Diabetes"],
        effectiveness_score: 85,
        side_effects_score: 70,
        cost_effectiveness_score: 90,
        evidence_level: "high",
      },
      {
        treatment_id: treatmentMap["Lifestyle Modification"],
        condition_id: conditionMap["Type 2 Diabetes"],
        effectiveness_score: 75,
        side_effects_score: 95,
        cost_effectiveness_score: 95,
        evidence_level: "high",
      },
      {
        treatment_id: treatmentMap["Lisinopril"],
        condition_id: conditionMap["Hypertension"],
        effectiveness_score: 80,
        side_effects_score: 75,
        cost_effectiveness_score: 85,
        evidence_level: "high",
      },
      {
        treatment_id: treatmentMap["Lifestyle Modification"],
        condition_id: conditionMap["Hypertension"],
        effectiveness_score: 70,
        side_effects_score: 95,
        cost_effectiveness_score: 95,
        evidence_level: "high",
      },
      {
        treatment_id: treatmentMap["Adalimumab"],
        condition_id: conditionMap["Rheumatoid Arthritis"],
        effectiveness_score: 85,
        side_effects_score: 60,
        cost_effectiveness_score: 50,
        evidence_level: "high",
      },
      {
        treatment_id: treatmentMap["Albuterol"],
        condition_id: conditionMap["Asthma"],
        effectiveness_score: 90,
        side_effects_score: 80,
        cost_effectiveness_score: 85,
        evidence_level: "high",
      },
      {
        treatment_id: treatmentMap["Sertraline"],
        condition_id: conditionMap["Depression"],
        effectiveness_score: 75,
        side_effects_score: 65,
        cost_effectiveness_score: 80,
        evidence_level: "high",
      },
      {
        treatment_id: treatmentMap["Cognitive Behavioral Therapy"],
        condition_id: conditionMap["Depression"],
        effectiveness_score: 80,
        side_effects_score: 95,
        cost_effectiveness_score: 75,
        evidence_level: "high",
      },
    ]

    await supabase.from("treatment_effectiveness").upsert(effectiveness, {
      onConflict: "treatment_id,condition_id",
    })

    // Seed sample treatment ratings
    const demoUsers = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "patient1@example.com",
        first_name: "John",
        last_name: "Doe",
        user_type: "patient",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        email: "patient2@example.com",
        first_name: "Jane",
        last_name: "Smith",
        user_type: "patient",
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        email: "doctor1@example.com",
        first_name: "Dr. Robert",
        last_name: "Johnson",
        user_type: "doctor",
      },
    ]

    // Upsert demo users to profiles table
    await supabase.from("profiles").upsert(demoUsers, { onConflict: "id" })

    // Seed treatment ratings
    const ratings = [
      {
        user_id: "00000000-0000-0000-0000-000000000001",
        treatment_id: treatmentMap["Metformin"],
        condition_id: conditionMap["Type 2 Diabetes"],
        rating: 4,
        review: "Helped control my blood sugar with minimal side effects. Occasional stomach upset but worth it.",
        user_type: "patient",
        verified: true,
        helpful_count: 5,
      },
      {
        user_id: "00000000-0000-0000-0000-000000000002",
        treatment_id: treatmentMap["Metformin"],
        condition_id: conditionMap["Type 2 Diabetes"],
        rating: 3,
        review: "Works well but causes digestive issues for me. Had to adjust dosage.",
        user_type: "patient",
        verified: true,
        helpful_count: 2,
      },
      {
        user_id: "00000000-0000-0000-0000-000000000003",
        treatment_id: treatmentMap["Metformin"],
        condition_id: conditionMap["Type 2 Diabetes"],
        rating: 5,
        review:
          "First-line treatment for Type 2 Diabetes. Excellent efficacy and safety profile when properly prescribed.",
        user_type: "doctor",
        verified: true,
        helpful_count: 10,
      },
      {
        user_id: "00000000-0000-0000-0000-000000000001",
        treatment_id: treatmentMap["Lifestyle Modification"],
        condition_id: conditionMap["Type 2 Diabetes"],
        rating: 5,
        review:
          "Changed my diet and started walking daily. Lost 20 pounds and my blood sugar is much better controlled.",
        user_type: "patient",
        verified: true,
        helpful_count: 8,
      },
      {
        user_id: "00000000-0000-0000-0000-000000000003",
        treatment_id: treatmentMap["Lifestyle Modification"],
        condition_id: conditionMap["Type 2 Diabetes"],
        rating: 5,
        review:
          "Essential component of diabetes management. Often underutilized but can be as effective as medication for some patients.",
        user_type: "doctor",
        verified: true,
        helpful_count: 12,
      },
    ]

    await supabase.from("treatment_ratings").upsert(ratings, {
      onConflict: "user_id,treatment_id,condition_id",
    })

    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: "Failed to seed database", error }
  }
}

