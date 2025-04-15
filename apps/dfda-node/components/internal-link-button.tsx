import type React from 'react';
import { InternalLink } from './internal-link'; // Use the type-safe link
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

// Props: navKey + ButtonProps (excluding children, as content is generated)
type InternalLinkButtonProps = {
  navKey: keyof GeneratedNavTree;
} & Omit<ButtonProps, 'children' | 'asChild'>; // Omit children and asChild

/**
 * Renders a Button component that links to an internal route.
 * Automatically uses the title and emoji from the generated navigation tree.
 * Displays the description in a tooltip on hover if available.
 *
 * @param navKey The key corresponding to the desired route in GeneratedNavTree.
 * @param ...rest Other props compatible with the Button component (variant, size, etc.).
 */
export function InternalLinkButton({ navKey, variant, size, className, ...rest }: InternalLinkButtonProps) {
  const navItem = navigationTreeObject[navKey];

  if (!navItem) {
    logger.error(`[InternalLinkButton] Invalid or missing navKey provided: ${String(navKey)}`);
    // Render a disabled button or nothing
    return <Button variant={variant ?? 'outline'} size={size} className={className} disabled {...rest}>Invalid Link</Button>;
  }

  const buttonContent = (
    <>
      {/* Render emoji only if it exists and is not an empty string */} 
      {navItem.emoji && navItem.emoji.trim() && <span className="mr-2">{navItem.emoji}</span>}
      {navItem.title}
    </>
  );

  // Only wrap with Tooltip if description exists and is not empty
  if (navItem.description && navItem.description.trim()) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Use InternalLink for the actual link element. 
                passHref and legacyBehavior=false are often needed for compatibility 
                with component libraries like Shadcn UI Button when using `asChild`. */}
            <InternalLink navKey={navKey} passHref legacyBehavior={false}> 
               {/* Apply button styles/props to the link via asChild pattern */}
               <Button variant={variant} size={size} className={className} {...rest}>
                   {buttonContent}
               </Button>
            </InternalLink>
          </TooltipTrigger>
          <TooltipContent>
            <p>{navItem.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    // Render without Tooltip
    return (
      <InternalLink navKey={navKey} passHref legacyBehavior={false}>
          <Button variant={variant} size={size} className={className} {...rest}>
              {buttonContent}
          </Button>
      </InternalLink>
    );
  }
} 