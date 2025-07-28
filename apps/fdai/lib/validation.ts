import { ValidationError } from "@/types/error"

/**
 * Validates that a value is not empty
 */
export function validateRequired<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`)
  }

  if (typeof value === "string" && value.trim() === "") {
    throw new ValidationError(`${fieldName} cannot be empty`)
  }

  return value
}

/**
 * Validates that a string has a minimum length
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): string {
  if (value.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`)
  }

  return value
}

/**
 * Validates that a string has a maximum length
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): string {
  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`)
  }

  return value
}

/**
 * Validates that a value is a valid email address
 */
export function validateEmail(value: string, fieldName = "Email"): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid email address`)
  }

  return value
}

/**
 * Validates that a number is within a range
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): number {
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`)
  }

  return value
}

/**
 * Validates that a value is one of the allowed values
 */
export function validateEnum<T>(value: T, allowedValues: T[], fieldName: string): T {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, { value, allowedValues })
  }

  return value
}

/**
 * Validates a date string
 */
export function validateDate(value: string, fieldName = "Date"): string {
  const date = new Date(value)

  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`)
  }

  return value
}

/**
 * Validates an array has items
 */
export function validateNonEmptyArray<T>(value: T[], fieldName: string): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${fieldName} must not be empty`)
  }

  return value
}
