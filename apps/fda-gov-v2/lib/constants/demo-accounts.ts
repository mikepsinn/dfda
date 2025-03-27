export type UserType = "patient" | "doctor" | "sponsor"

export const DEMO_ACCOUNTS = {
  patient: {
    email: "demo-patient@dfda.earth",
    password: "demo-patient-123",
    data: {
      first_name: "Demo",
      last_name: "Patient",
      user_type: "patient" as const,
    },
  },
  doctor: {
    email: "demo-doctor@dfda.earth",
    password: "demo-doctor-123",
    data: {
      first_name: "Demo",
      last_name: "Doctor",
      user_type: "doctor" as const,
      specialties: ["Cardiology", "Internal Medicine"],
      license_number: "DEMO-12345",
    },
  },
  sponsor: {
    email: "demo-sponsor@dfda.earth",
    password: "demo-sponsor-123",
    data: {
      first_name: "Demo",
      last_name: "Sponsor",
      user_type: "sponsor" as const,
      organization: "Demo Pharma Inc.",
      role: "Clinical Trial Manager",
    },
  },
} as const 