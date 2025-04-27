import Link from 'next/link';
import type { ComponentProps } from 'react';
import { navigationTreeObject } from '@/lib/generated-nav-tree';
import type { GeneratedNavTree } from '@/lib/generated-nav-tree';
import { logger } from '@/lib/logger';

// Function to interpolate params into href template (copied from InternalLinkButton)
function interpolateHref(template: string, params: Record<string, string | number>): string {
  let href = template;
  const missingParams: string[] = [];
  const usedParams = new Set<string>();

  // Find all placeholders like [paramName]
  const placeholders = template.match(/\[(.*?)\]/g) || [];

  placeholders.forEach(placeholder => {
      const paramName = placeholder.slice(1, -1); // Remove brackets
      if (params.hasOwnProperty(paramName)) {
          href = href.replace(placeholder, String(params[paramName]));
          usedParams.add(paramName);
      } else {
          missingParams.push(paramName);
      }
  });

  if (missingParams.length > 0) {
      logger.warn(`[interpolateHref - InternalLink] Missing params for template '${template}': ${missingParams.join(', ')}`, { params });
      // Returning partially interpolated href
  }

  // Check for unused params
  const unusedParams = Object.keys(params).filter(p => !usedParams.has(p));
  if (unusedParams.length > 0) {
       logger.warn(`[interpolateHref - InternalLink] Unused params provided for template '${template}': ${unusedParams.join(', ')}`, { params });
  }

  return href;
}

// Define props: Accept navKey, optional params, and omit href from standard LinkProps
type InternalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  navKey: keyof GeneratedNavTree;
  params?: Record<string, string | number>; // Optional params object
};

/**
 * A type-safe wrapper around Next.js Link component.
 * Ensures that the link points to a valid, known internal route
 * defined in the generated navigation tree.
 * Handles dynamic routes via the `params` prop.
 *
 * @param navKey The key corresponding to the desired route in GeneratedNavTree.
 * @param params Optional object with values for dynamic segments (e.g., { globalVariableId: '...' }).
 * @param ...rest Other props compatible with next/link (e.g., className, children, target).
 */
export function InternalLink({ navKey, params, ...rest }: InternalLinkProps) {
  const navItem = navigationTreeObject[navKey];

  if (!navItem) {
    // This should theoretically not happen with TypeScript if navKey is valid,
    // but provides runtime safety.
    logger.error(`[InternalLink] Invalid or missing navKey provided: ${String(navKey)}`);
    // Render children without a link, or return null/error based on desired behavior.
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
       // Return a non-linking span to avoid broken links
       return <span className={rest.className}>{rest.children}</span>;
  }

  // Pass the generated href and remaining props to the actual Link component
  return <Link href={finalHref} {...rest} />;
} 