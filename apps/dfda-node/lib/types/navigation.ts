import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

// Zod schema for enhanced navigation item
export const NavItemSchema = z.object({
  title: z.string().describe("A concise, user-friendly title for the navigation link (max 3 words). Use Title Case."),
  href: z.string().describe("The URL path for the navigation link."),
  description: z.string().optional().describe("A brief (1-2 sentence) description of the page's purpose. Suitable for tooltips or secondary text."),
  emoji: z.string().optional().describe("A single relevant emoji to visually represent the page/section."),
  // Note: LucideIcon cannot be directly serialized/deserialized, so we won't include it in the generated object schema.
  // It will need to be added separately if needed, e.g., in the main navigation logic file.
  hideInNav: z.boolean().optional().describe("Should this item be hidden from the main top/side navigation bars?"),
  hideInDropdown: z.boolean().optional().describe("Should this item be hidden from user dropdown menus?"),
  roles: z.array(z.string()).optional().describe("Optional array of user roles ('patient', 'provider', etc.) allowed to see this link."),
});

// TypeScript type derived from the schema
export type NavItem = z.infer<typeof NavItemSchema> & {
  icon?: LucideIcon; // Add back the optional icon type for client-side use
}; 