import Link from 'next/link';
import type { ComponentProps } from 'react';
import { navigationTreeObject } from '@/lib/generated-nav-tree';
import type { GeneratedNavTree } from '@/lib/generated-nav-tree';
import { logger } from '@/lib/logger';
import { interpolateHref } from '@/lib/formatters';

// Define props: Accept a navKey and optional params, omit href
// We use keyof GeneratedNavTree for type safety and autocomplete
type InternalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  navKey: keyof GeneratedNavTree;
  params?: Record<string, string | number>;
};

/**
 * A type-safe wrapper around Next.js Link component.
 * Ensures that the link points to a valid, known internal route
 * defined in the generated navigation tree.
 * Supports dynamic route parameters via the `params` prop.
 *
 * @param navKey The key corresponding to the desired route in GeneratedNavTree.
 * @param params Optional object with values for dynamic segments (e.g., { id: 123 }).
 * @param ...rest Other props compatible with next/link (e.g., className, children, target).
 */
export function InternalLink({ navKey, params, ...rest }: InternalLinkProps) {
  const navItem = navigationTreeObject[navKey];

  if (!navItem) {
    // This should theoretically not happen with TypeScript if navKey is valid,
    // but provides runtime safety, especially if the generated file is somehow corrupted.
    logger.error(`[InternalLink] Invalid or missing navKey provided: ${String(navKey)}`);
    // Render children without a link, or throw an error, based on desired behavior.
    // Returning a span prevents broken links but might hide issues.
    return <span className={rest.className}>{rest.children}</span>;
  }

  // Determine the final href
  let finalHref = navItem.href;
  if (params) {
      finalHref = interpolateHref(navItem.href, params);
  }

  // Check if the base href template looks like a dynamic route if params were NOT provided
  if (!params && navItem.href.includes('[')) {
       logger.warn(`[InternalLink] navKey '${String(navKey)}' seems to require params but none were provided. Href: ${navItem.href}`);
       // Optional: You might want to render differently or throw an error here
       // For now, it will link to the template href, which might be broken.
  }

  // Pass the interpolated href and remaining props to the actual Link component
  return <Link href={finalHref} {...rest} />;
} 