import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure random string for use as a secret
 * @param length The length of the secret to generate (default: 32)
 * @returns A secure random string
 */
export function generateSecureSecret(length: number = 32): string {
  return randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
}

/**
 * Validates that a secret meets minimum security requirements
 * @param secret The secret to validate
 * @returns true if the secret is valid, false otherwise
 */
export function validateSecret(secret: string): boolean {
  // Minimum length of 16 characters
  if (secret.length < 16) return false;

  // Must contain at least one number
  if (!/\d/.test(secret)) return false;

  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(secret)) return false;

  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(secret)) return false;

  return true;
} 