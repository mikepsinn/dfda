import type React from 'react';
// import { InternalLink } from './internal-link'; // Don't need InternalLink for this approach
import Link from 'next/link'; // Import next/link directly
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { navigationTreeObject } from '@/lib/generated-nav-tree';
import type { GeneratedNavTree } from '@/lib/generated-nav-tree';
import { logger } from '@/lib/logger';
import { interpolateHref } from '@/lib/utils'; // Import the shared function

// Props: navKey is mandatory, params optional. ButtonProps without children/asChild.
type InternalLinkButtonProps = {
  navKey: keyof GeneratedNavTree;
  params?: Record<string, string | number>; // Optional params object
} & Omit<ButtonProps, 'children' | 'asChild'>;

/**
 * Renders a Button that links to an internal route defined in generated-nav-tree.
 * Automatically uses title/emoji. Handles dynamic routes via the `params` prop.
 *
 * @param navKey Key for the route in GeneratedNavTree.
 * @param params Optional object with values for dynamic segments (e.g., { id: 123 }).
 * @param ...rest Other ButtonProps (variant, size, etc.).
 */
export function InternalLinkButton({ navKey, params, variant, size, className, ...rest }: InternalLinkButtonProps) {
  const navItem = navigationTreeObject[navKey];

  if (!navItem) {
    logger.error(`[InternalLinkButton] Invalid or missing navKey provided: ${String(navKey)}`);
    return <Button variant={variant ?? 'outline'} size={size} className={className} disabled {...rest}>Invalid Link Key</Button>;
  }

  // Determine the final href
  let finalHref = navItem.href;
  if (params) {
      finalHref = interpolateHref(navItem.href, params);
  }

  // Check if the base href template looks like a dynamic route if params were NOT provided
  if (!params && navItem.href.includes('[')) {
       logger.warn(`[InternalLinkButton] navKey '${String(navKey)}' seems to require params but none were provided. Href: ${navItem.href}`);
      // Optional: Disable button or return error state?
       return <Button variant={variant ?? 'outline'} size={size} className={className} disabled {...rest}>Missing Params</Button>;
  }

  // Button Content (same as before)
  const buttonContent = (
    <>
      {navItem.emoji && navItem.emoji.trim() && <span className="mr-2">{navItem.emoji}</span>}
      {navItem.title}
    </>
  );

  // Link Component (using next/link directly)
  const LinkComponent = (
      <Link href={finalHref} passHref legacyBehavior={false}>
          <Button variant={variant} size={size} className={className} {...rest}>
              {buttonContent}
          </Button>
      </Link>
  );

  // Tooltip Logic (same as before, wrapping the LinkComponent)
  if (navItem.description && navItem.description.trim()) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {LinkComponent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{navItem.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    // Render without Tooltip
    return LinkComponent;
  }
} 