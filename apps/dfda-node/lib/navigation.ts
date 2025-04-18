import { navigationTreeObject } from '../lib/generated-nav-tree' // Import generated object
import type { Database } from './database.types' // Import Database type
import { logger } from './logger' // Import the logger
import type { NavItem } from './types/navigation' // Import NavItem from the new types file

// Define UserType type alias for clarity
type UserType = Database["public"]["Enums"]["user_type_enum"]



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
  { title: "Providers", href: "/#how-it-works-provider" },
  { title: "Developers", href: "/developers" },
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



// Updated function accepting userType directly
export const getLoggedInPrimaryNavItems = (userType: UserType | null): NavItem[] => {
  logger.debug('getLoggedInPrimaryNavItems called with userType:', userType)

  if (!userType) {
    logger.warn('getLoggedInPrimaryNavItems called with null userType. Returning logged-out items.')
    return loggedOutPrimaryNavItems; // Or return [] if preferred for logged-in context
  }

  // Return the specific array for the role, or an empty array if role not found
  const items = userTypeNavItemsMap[userType]
  if (items) {
    logger.debug('Found items for role:', userType, items)
    return items
  } else {
    // This case should ideally not happen if user_type is valid and in the enum/map
    logger.warn('No navigation items defined for user_type:', userType)
    return []
  }
}

// Reinstated and updated function accepting userType directly
export const getAllMobileNavItems = (userType: UserType | null): NavItem[] => {
  if (userType) {
    // Logged-in: Only show role-specific primary items
    return getLoggedInPrimaryNavItems(userType)
  } else {
    // Logged-out: Show primary public links + secondary public links
    return [...loggedOutPrimaryNavItems, ...secondaryNavItems]
  }
} 