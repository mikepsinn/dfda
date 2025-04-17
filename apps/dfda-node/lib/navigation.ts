import type { User } from '@supabase/supabase-js'
import { navigationTreeObject } from '../lib/generated-nav-tree' // Import generated object
import type { Database } from './database.types' // Import Database type
import { logger } from './logger' // Import the logger
// import type { LucideIcon } from 'lucide-react' // LucideIcon is now included in NavItem type import
import type { NavItem } from './types/navigation' // Import NavItem from the new types file

// Define UserType type alias for clarity
type UserType = Database["public"]["Enums"]["user_type_enum"]

// Define the base navigation item type - REMOVED (Now imported)
// export type NavItem = {
//   title: string
//   href: string
//   description?: string // Optional: Description for the item
//   emoji?: string // Optional: Emoji for the item
//   icon?: LucideIcon // Make icon optional
//   hideInNav?: boolean // Optional: Hide from main nav bars
//   hideInDropdown?: boolean // Optional: Hide from dropdowns
//   roles?: string[] // Optional: Roles that can see this item
// }

// Logged-in Primary Items per Role (Using generated objects directly)
const patientNavItems: NavItem[] = [
  navigationTreeObject.patient, // Uses generated title (e.g., "Patient") and href
  navigationTreeObject.patient_conditions,
  navigationTreeObject.patient_treatments,
  navigationTreeObject.patient_reminders,
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
  navigationTreeObject.research_partner_create_trial
]

const adminNavItems: NavItem[] = [
  navigationTreeObject.admin, // Uses generated title (e.g., "Admin") and href
]

// Map roles to their specific navigation items using the enum type for keys
const userTypeNavItemsMap: Record<UserType, NavItem[]> = {
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
    logger.warn('User object is missing user_metadata.user_type. Returning logged-out navigation items.', { userId: user.id })
    // Return logged-out items instead of throwing an error
    return loggedOutPrimaryNavItems
  }

  // Explicitly cast user_type to the enum type
  const userType = rawUserType as UserType
  logger.debug('Cast userType:', userType)

  // Return the specific array for the role, or an empty array if role not found
  const items = userTypeNavItemsMap[userType]
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