export type UserType = keyof typeof DEMO_ACCOUNTS;

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
  provider: {
    email: "demo-provider@dfda.earth",
    password: "demo-provider-123",
    data: {
      first_name: "Demo",
      last_name: "Provider",
      user_type: "provider" as const,
      organization_name: "City General Hospital",
      contact_name: "Dr. Demo Provider",
    },
  },
  research_partner: {
    email: "demo-research-partner@dfda.earth",
    password: "demo-research-partner-123",
    data: {
      first_name: "Demo",
      last_name: "Sponsor",
      user_type: "research-partner" as const,
      organization_name: "Demo Pharma Inc.",
      contact_name: "Clinical Research Division",
    },
  },
  developer: {
    email: "demo-developer@dfda.earth",
    password: "demo-developer-123",
    data: {
      first_name: "Demo",
      last_name: "Developer",
      user_type: "developer" as const,
    },
  }
} as const 