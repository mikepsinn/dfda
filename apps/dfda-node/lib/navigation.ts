import type { User } from '@supabase/supabase-js'
import { navigationTreeObject } from '../lib/generated-nav-tree' // Import generated object

export interface NavItem {
  title: string
  href: string
}

// --- Navigation Definitions ---

// Logged-in Primary Items per Role (Using generated paths)
const patientNavItems: NavItem[] = [
  { title: "Patient Dashboard", href: navigationTreeObject.patient.href },
  { title: "Treatments", href: navigationTreeObject.patient_treatments.href },
]

const providerNavItems: NavItem[] = [
  { title: "Provider Dashboard", href: navigationTreeObject.provider.href },
  // Add other provider-specific items here, e.g.:
  // { title: "Patients", href: navigationTreeObject.provider_patients.href },
]

const developerNavItems: NavItem[] = [
  { title: "Developer Dashboard", href: navigationTreeObject.developer.href },
  // { title: "Documentation", href: navigationTreeObject.developers_documentation.href },
]

const researchPartnerNavItems: NavItem[] = [
  { title: "Research Partner Dashboard", href: navigationTreeObject.research_partner.href },
  // { title: "Create Trial", href: navigationTreeObject.research_partner_create_trial.href },
]

const adminNavItems: NavItem[] = [
  { title: "Admin Dashboard", href: navigationTreeObject.admin.href },
]

// Map roles to their specific navigation items
const roleNavItemsMap: Record<string, NavItem[]> = {
  'patient': patientNavItems,
  'provider': providerNavItems,
  'developer': developerNavItems,
  'research-partner': researchPartnerNavItems,
  'admin': adminNavItems,
}

// Logged-out Primary Items
export const loggedOutPrimaryNavItems: NavItem[] = [
  { title: "Patients", href: "/#how-it-works-patient" },
  { title: "Research Partners", href: "/#how-it-works-research-partner" },
]

// Secondary Items (Public Info - shown in "More" or mobile when logged out)
export const secondaryNavItems: NavItem[] = [
  { title: "Patients", href: "/#how-it-works-patient" },
  { title: "Providers", href: navigationTreeObject.providers.href }, // Use href
  { title: "Research Partners", href: "/#how-it-works-research-partner" },
  { title: "Developers", href: navigationTreeObject.developers.href }, // Use href
  { title: "How It Works", href: "/#how-it-works" },
  { title: "About", href: "/#key-benefits" },
]

// --- Navigation Logic Functions ---

// Function to get primary navigation items based *strictly* on user role via map lookup
export const getLoggedInPrimaryNavItems = (user: User | null): NavItem[] => {
  if (!user) return []
  const userType = user.user_metadata?.user_type
  // Return the specific array for the role, or an empty array if role not found/null
  return userType ? roleNavItemsMap[userType] ?? [] : []
}

// Combine navigation items for mobile view
export const getAllMobileNavItems = (user: User | null): NavItem[] => {
  if (user) {
    // Logged-in: Only show role-specific primary items
    return getLoggedInPrimaryNavItems(user)
  } else {
    // Logged-out: Show primary public links + secondary public links
    return [...loggedOutPrimaryNavItems, ...secondaryNavItems]
  }
} 