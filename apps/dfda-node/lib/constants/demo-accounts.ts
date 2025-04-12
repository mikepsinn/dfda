import type { Database, Json } from "@/lib/database.types";

type UserRoleEnum = Database["public"]["Enums"]["user_role_enum"];

// Define Insert types directly using Database types from database.types.ts
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type PatientInsert = Database['public']['Tables']['patients']['Insert'];
type PatientConditionInsert = Database['public']['Tables']['patient_conditions']['Insert'];
type TrialInsert = Database['public']['Tables']['trials']['Insert']; // Added for trials
type TrialEnrollmentInsert = Database['public']['Tables']['trial_enrollments']['Insert'];
type DataSubmissionInsert = Database['public']['Tables']['data_submissions']['Insert'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type TreatmentRatingInsert = Database['public']['Tables']['treatment_ratings']['Insert'];
type ReportedSideEffectInsert = Database['public']['Tables']['reported_side_effects']['Insert'];

// --- Data Structures for Seeding --- 

// This structure helps organize the data we want to seed for a patient
interface DemoPatientSeedData {
  patientDetails: Omit<PatientInsert, 'id'>;
  conditions: Omit<PatientConditionInsert, 'patient_id' | 'id'>[];
  enrollments: Omit<TrialEnrollmentInsert, 'patient_id' | 'id'>[];
  // Submissions need trial_id for linking during the seeding process
  submissions: (Omit<DataSubmissionInsert, 'patient_id' | 'enrollment_id' | 'id'> & { trial_id_for_linking: string })[]; 
  notifications: Omit<NotificationInsert, 'user_id' | 'id'>[];
  ratings: Omit<TreatmentRatingInsert, 'user_id' | 'id'>[];
  sideEffects: Omit<ReportedSideEffectInsert, 'user_id' | 'id'>[];
}

// Added for Research Partner
interface DemoResearchPartnerSeedData {
   notifications: Omit<NotificationInsert, 'user_id' | 'id'>[];
   trialsToSeed: Omit<TrialInsert, 'research_partner_id'>[]; // research_partner_id will be the user id
}

// --- Demo Account Configuration --- 

export type DemoUserType = keyof typeof DEMO_ACCOUNTS;

export const DEMO_ACCOUNTS = {
  patient: {
    id: '10000000-0000-0000-0000-000000000000',
    email: "demo-patient@dfda.earth",
    password: "demo-patient-123",
    profileData: {
      first_name: "Demo",
      last_name: "Patient",
      user_type: "patient" as UserRoleEnum,
    } satisfies Omit<ProfileInsert, 'id' | 'email'>,
    seedData: {
      patientDetails: {
        date_of_birth: '1980-01-01',
        gender: 'other',
        height: 175,
        weight: 75,
        blood_type: 'O+',
      },
      conditions: [
        { condition_id: 'type-2-diabetes', diagnosed_at: '2021-01-15', status: 'active' },
        { condition_id: 'hypertension', diagnosed_at: '2022-06-01', status: 'active' },
      ],
      enrollments: [
        { trial_id: '11111111-1111-1111-1111-111111111111', provider_id: '20000000-0000-0000-0000-000000000000', status: 'approved', enrollment_date: '2025-02-10' },
      ],
      // Corrected submissions structure
      submissions: [
        { 
          trial_id_for_linking: '11111111-1111-1111-1111-111111111111', // Used to find enrollment_id
          submission_date: '2025-03-10', 
          data: {"blood_glucose": 150, "weight": 76, "medication_adherence": 90, "side_effects": [], "notes": "Feeling stable."} as Json, 
          status: 'pending' 
        },
      ],
      notifications: [
        { title: 'Data Submission Reminder', message: 'Your weekly data submission for the Semaglutide trial is due tomorrow.', type: 'info', read_at: null, emoji: '📅' },
        { title: 'Trial Information Updated', message: 'New information about the Semaglutide trial is available.', type: 'info', read_at: new Date().toISOString(), emoji: '📣' },
      ],
      ratings: [
        { treatment_id: 'metformin', condition_id: 'type-2-diabetes', effectiveness_out_of_ten: 7, review: 'Helps control my blood sugar, some initial side effects but they passed.'},
        { treatment_id: 'lisinopril', condition_id: 'hypertension', effectiveness_out_of_ten: 9, review: 'Excellent for my blood pressure.'},
      ],
      sideEffects: [
        { treatment_id: 'metformin', description: 'initial side effects (e.g., mild gastrointestinal discomfort)', severity_out_of_ten: 2 },
      ],
    } satisfies DemoPatientSeedData // Use satisfies for type checking
  },
  provider: {
    id: '20000000-0000-0000-0000-000000000000',
    email: "demo-provider@dfda.earth",
    password: "demo-provider-123",
    profileData: {
      first_name: "Demo",
      last_name: "Provider",
      user_type: "provider" as UserRoleEnum,
    } satisfies Omit<ProfileInsert, 'id' | 'email'>,
    seedData: { 
       notifications: [
        { title: 'New Patient Enrollment', message: 'Demo Patient has enrolled in the Semaglutide trial.', type: 'info', read_at: null, emoji: '👥' },
       ]
       // Add other provider-specific seed data structures if needed
    } // Add satisfies if defining specific interface later
  },
  "research-partner": {
    id: '30000000-0000-0000-0000-000000000000',
    email: "demo-research-partner@dfda.earth",
    password: "demo-research-partner-123",
    profileData: {
      first_name: "Demo",
      last_name: "Sponsor",
      user_type: "research-partner" as UserRoleEnum,
    } satisfies Omit<ProfileInsert, 'id' | 'email'>,
     seedData: {
        notifications: [
         { title: 'Enrollment Milestone', message: 'Your Semaglutide trial has reached 50% enrollment target.', type: 'info', read_at: new Date().toISOString(), emoji: '🎉' }
       ],
       trialsToSeed: [
         { 
            id: '11111111-1111-1111-1111-111111111111', 
            title: 'Semaglutide Efficacy Study', 
            description: 'A randomized controlled trial to evaluate the efficacy of Semaglutide in patients with Type 2 Diabetes.', 
            condition_id: 'type-2-diabetes', 
            treatment_id: 'semaglutide', 
            status: 'recruiting', 
            phase: 'phase_3', 
            start_date: '2025-01-15', 
            end_date: '2026-07-15', 
            enrollment_target: 500, 
            location: 'Multiple locations nationwide'
         },
         {
            id: '22222222-2222-2222-2222-222222222222',
            title: 'Ketamine for Treatment-Resistant Depression',
            description: 'Evaluating the safety and efficacy of Ketamine...',
            condition_id: 'major-depressive-disorder',
            treatment_id: 'ketamine',
            status: 'recruiting', 
            phase: 'phase_2', 
            start_date: '2025-02-01', 
            end_date: '2026-02-01', 
            enrollment_target: 200, 
            location: 'Boston, New York, Chicago, San Francisco'
         }
         // Add more trials here if needed
       ]
    } satisfies DemoResearchPartnerSeedData
  },
  developer: {
    id: '40000000-0000-0000-0000-000000000000',
    email: "demo-developer@dfda.earth",
    password: "demo-developer-123",
    profileData: {
      first_name: "Demo",
      last_name: "Developer",
      user_type: "developer" as UserRoleEnum,
    } satisfies Omit<ProfileInsert, 'id' | 'email'>,
    seedData: {} // No specific seed data for developer currently
  }
} as const; 