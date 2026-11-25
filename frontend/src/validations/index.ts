import { z } from 'zod'

export * from './authSchemas'
export * from './productSchemas'
export * from './orderSchemas'

export interface ValidationSuccess<T> {
  success: true
  data: T
  errors?: never
}

export interface ValidationFailure {
  success: false
  data?: never
  errors: Record<string, string>
  errorMessage: string
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

/**
 * Reusable helper to validate data against any Zod schema.
 * Returns either typed validated data or a mapped error dictionary and primary error message.
 */
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string> = {}
  let primaryMessage = 'Validation failed. Please check the fields.'

  const issues = result.error.issues
  if (issues.length > 0) {
    primaryMessage = issues[0].message
    for (const issue of issues) {
      const field = issue.path.join('.') || 'root'
      if (!errors[field]) {
        errors[field] = issue.message
      }
    }
  }

  return {
    success: false,
    errors,
    errorMessage: primaryMessage,
  }
}
