import { logger } from '@/lib/logger';

export function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours, 10))
    date.setMinutes(parseInt(minutes, 10))
    
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    // Using logger instead of console.error per project rules
    logger.error('Error formatting time:', { error, timeInput: time });
    return time // Return original time on error
  }
}

// Function to interpolate params into href template
export function interpolateHref(template: string, params: Record<string, string | number>): string {
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
      logger.warn(`[interpolateHref] Missing params for template '${template}': ${missingParams.join(', ')}`, { params });
      // Optionally return template or throw error? Returning partially interpolated for now.
  }

  // Check for unused params
  const unusedParams = Object.keys(params).filter(p => !usedParams.has(p));
  if (unusedParams.length > 0) {
       logger.warn(`[interpolateHref] Unused params provided for template '${template}': ${unusedParams.join(', ')}`, { params });
  }

  return href;
} 