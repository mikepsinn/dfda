import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
// import { logger } from '@/lib/logger'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Removed formatTime function

// Removed interpolateHref function

