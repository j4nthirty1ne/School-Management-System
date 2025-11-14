/**
 * Validation utilities for the School Management System
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

/**
 * Get password validation errors
 */
export const getPasswordErrors = (password: string): string[] => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  }

  return errors
}

/**
 * Validate phone number (international format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

/**
 * Validate student code format
 */
export const isValidStudentCode = (code: string): boolean => {
  const codeRegex = /^STU-\d{4}-\d{5}$/
  return codeRegex.test(code)
}

/**
 * Validate teacher code format
 */
export const isValidTeacherCode = (code: string): boolean => {
  const codeRegex = /^TCH-\d{4}-\d{3}$/
  return codeRegex.test(code)
}

/**
 * Validate date of birth (must be at least 5 years old, not future date)
 */
export const isValidDateOfBirth = (dob: string): boolean => {
  const date = new Date(dob)
  const today = new Date()
  const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate())

  return date < fiveYearsAgo && date < today
}

/**
 * Validate name (letters, spaces, hyphens only)
 */
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-']+$/
  return nameRegex.test(name) && name.trim().length >= 2
}

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Validate required fields
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = requiredFields.filter(
    (field) => !data[field] || data[field].toString().trim() === ''
  )

  return {
    isValid: missingFields.length === 0,
    missingFields,
  }
}

/**
 * Validate academic year format
 */
export const isValidAcademicYear = (year: string): boolean => {
  const yearRegex = /^\d{4}-\d{4}$/
  return yearRegex.test(year)
}

/**
 * Validate grade (0-100)
 */
export const isValidGrade = (grade: number): boolean => {
  return grade >= 0 && grade <= 100
}

/**
 * Validate class name format
 */
export const isValidClassName = (className: string): boolean => {
  return className.trim().length >= 1 && className.trim().length <= 50
}

/**
 * Check if user is authorized (by role)
 */
export const isAuthorized = (userRole: string, allowedRoles: string[]): boolean => {
  return allowedRoles.includes(userRole)
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true }
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  record.count++
  return { allowed: true }
}

/**
 * Clean up expired rate limit records
 */
export const cleanupRateLimits = () => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 60 * 60 * 1000)
}
