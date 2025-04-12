import type { User } from '@supabase/supabase-js'
import { navigationTreeObject } from '../lib/generated-nav-tree' // Import generated object

// Ensure NavItem interface matches the structure in generated-nav-tree.ts
export interface NavItem {
  title: string
  href: string
}

// Logged-in Primary Items per Role (Using generated objects directly)
const patientNavItems: NavItem[] = [
  navigationTreeObject.patient, // Uses generated title (e.g., "Patient") and href
  navigationTreeObject.patient_treatments,
]

const providerNavItems: NavItem[] = [
  navigationTreeObject.provider, // Uses generated title (e.g., "Provider") and href
  // Add other provider-specific items here, e.g.:
  // navigationTreeObject.provider_patients,
]

const developerNavItems: NavItem[] = [
  navigationTreeObject.developer, // Uses generated title (e.g., "Developer") and href
  // navigationTreeObject.developers_documentation,
]

const researchPartnerNavItems: NavItem[] = [
  navigationTreeObject.research_partner, // Uses generated title (e.g., "Research Partner") and href
  // navigationTreeObject.research_partner_create_trial,
]

const adminNavItems: NavItem[] = [
  navigationTreeObject.admin, // Uses generated title (e.g., "Admin") and href
]

// Map roles to their specific navigation items
const roleNavItemsMap: Record<string, NavItem[]> = {
  'patient': patientNavItems,
  'provider': providerNavItems,
  'developer': developerNavItems,
  'research-partner': researchPartnerNavItems,
  'admin': adminNavItems,
}

// Logged-out Primary Items (Keep as is - uses fragments)
export const loggedOutPrimaryNavItems: NavItem[] = [
  { title: "Patients", href: "/#how-it-works-patient" },
  { title: "Research Partners", href: "/#how-it-works-research-partner" },
]

// Secondary Items (Public Info - Use generated objects where applicable)
export const secondaryNavItems: NavItem[] = [
  { title: "Patients", href: "/#how-it-works-patient" },
  navigationTreeObject.providers, // Use generated object
  { title: "Research Partners", href: "/#how-it-works-research-partner" },
  navigationTreeObject.developers, // Use generated object
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