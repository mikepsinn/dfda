import type { User } from '@supabase/supabase-js'
import { navigationTreeObject } from '../lib/generated-nav-tree' // Import generated object
import type { Database } from './database.types' // Import Database type
import { logger } from './logger' // Import the logger

// Define UserRole type alias for clarity
type UserRole = Database["public"]["Enums"]["user_role_enum"]

// Ensure NavItem interface matches the structure in generated-nav-tree.ts
export interface NavItem {
  title: string
  href: string
}

// Logged-in Primary Items per Role (Using generated objects directly)
const patientNavItems: NavItem[] = [
  navigationTreeObject.patient, // Uses generated title (e.g., "Patient") and href
  navigationTreeObject.patient_conditions,
  navigationTreeObject.patient_treatments
]

const providerNavItems: NavItem[] = [
  navigationTreeObject.provider, // Uses generated title (e.g., "Provider") and href
  navigationTreeObject.provider_patients,
]

const developerNavItems: NavItem[] = [
  navigationTreeObject.developer, // Uses generated title (e.g., "Developer") and href
  navigationTreeObject.developers_documentation,
]

const researchPartnerNavItems: NavItem[] = [
  navigationTreeObject.research_partner, // Uses generated title (e.g., "Research Partner") and href
  navigationTreeObject.research_partner_trials,
  navigationTreeObject.research_partner_create_trial
]

const adminNavItems: NavItem[] = [
  navigationTreeObject.admin, // Uses generated title (e.g., "Admin") and href
]

// Map roles to their specific navigation items using the enum type for keys
const roleNavItemsMap: Record<UserRole, NavItem[]> = {
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
  navigationTreeObject.find_trials,
  { title: "How It Works", href: "/#how-it-works" },
  { title: "About", href: "/#key-benefits" },
  navigationTreeObject.contact,
  navigationTreeObject.privacy,
  navigationTreeObject.terms,
]

// --- Navigation Logic Functions ---

// Function to get primary navigation items based *strictly* on user role via map lookup
export const getLoggedInPrimaryNavItems = (user: User | null): NavItem[] => {
  logger.debug('getLoggedInPrimaryNavItems called with user:', user)
  if (!user) {
    logger.debug('User is null, returning empty array.')
    return []
  }
  // Log the raw user_type from metadata before casting
  const rawUserType = user.user_metadata?.user_type
  logger.debug('Raw user_metadata.user_type:', rawUserType)

  // Ensure user_type exists
  if (!rawUserType) {
    logger.error('User object is missing user_metadata.user_type. Cannot determine navigation.', { userId: user.id })
    throw new Error('User metadata (user_type) is missing. Check user data fetching.')
  }

  // Explicitly cast user_type to the enum type
  const userType = rawUserType as UserRole
  logger.debug('Cast userType:', userType)

  // Return the specific array for the role, or an empty array if role not found
  const items = roleNavItemsMap[userType]
  if (items) {
    logger.debug('Found items for role:', userType, items)
    return items
  } else {
    // This case should ideally not happen if user_type is valid and in the enum
    logger.warn('No navigation items defined for valid user_type:', userType)
    return []
  }
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