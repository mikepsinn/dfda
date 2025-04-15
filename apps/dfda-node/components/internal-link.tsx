import Link from 'next/link';
import type { ComponentProps } from 'react';
import { navigationTreeObject } from '@/lib/generated-nav-tree';
import type { GeneratedNavTree } from '@/lib/generated-nav-tree';
import { logger } from '@/lib/logger';

// Define props: Accept a navKey and omit href from standard LinkProps
// We use keyof GeneratedNavTree for type safety and autocomplete
type InternalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  navKey: keyof GeneratedNavTree;
};

/**
 * A type-safe wrapper around Next.js Link component.
 * Ensures that the link points to a valid, known internal route
 * defined in the generated navigation tree.
 *
 * @param navKey The key corresponding to the desired route in GeneratedNavTree.
 * @param ...rest Other props compatible with next/link (e.g., className, children, target).
 */
export function InternalLink({ navKey, ...rest }: InternalLinkProps) {
  const navItem = navigationTreeObject[navKey];

  if (!navItem) {
    // This should theoretically not happen with TypeScript if navKey is valid,
    // but provides runtime safety, especially if the generated file is somehow corrupted.
    logger.error(`[InternalLink] Invalid or missing navKey provided: ${String(navKey)}`);
    // Render children without a link, or throw an error, based on desired behavior.
    // Returning a span prevents broken links but might hide issues.
    return <span className={rest.className}>{rest.children}</span>;
  }

  // Pass the fetched href and remaining props to the actual Link component
  return <Link href={navItem.href} {...rest} />;
} 