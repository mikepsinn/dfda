import type { Metadata } from 'next';
import { navigationTreeObject } from './generated-nav-tree';
import type { GeneratedNavTree } from './generated-nav-tree';
import type { NavItem } from './types/navigation';
import { env } from './env';

// Define default metadata values (consider pulling from a central config if needed)
const defaultTitle = env.NEXT_PUBLIC_SITE_NAME;
const defaultDescription = env.NEXT_PUBLIC_SITE_DESCRIPTION;

/**
 * Generates Next.js Metadata object for a given navigation key.
 * Looks up the key in the generated navigationTreeObject and uses
 * the title and description, falling back to defaults.
 *
 * @param key - The key from GeneratedNavTree (e.g., 'contact', 'patient_conditions').
 * @returns A Metadata object.
 */
export function getMetadataFromNavKey(key: keyof GeneratedNavTree): Metadata {
  const navItem: NavItem | undefined = navigationTreeObject[key];

  return {
    title: navItem?.title ?? defaultTitle,
    description: navItem?.description ?? defaultDescription,
    // Potential future enhancements:
    // openGraph: {
    //   title: navItem?.title ?? defaultTitle,
    //   description: navItem?.description ?? defaultDescription,
    //   // Add a default image URL here?
    // },
  };
}

// Optional future helper for dynamic pages (requires key construction logic)
// export function getMetadataForDynamicPage(params: any): Metadata { ... }
