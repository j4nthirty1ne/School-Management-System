/**
 * Helper utilities for the School Management System
 */

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date to short string
 */
export const formatDateShort = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dob: string | Date): number => {
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Calculate attendance percentage
 */
export const calculateAttendancePercentage = (
  presentDays: number,
  totalDays: number
): number => {
  if (totalDays === 0) return 0
  return Math.round((presentDays / totalDays) * 100 * 100) / 100
}

/**
 * Calculate grade percentage
 */
export const calculatePercentage = (
  marksObtained: number,
  totalMarks: number
): number => {
  if (totalMarks === 0) return 0
  return Math.round((marksObtained / totalMarks) * 100 * 100) / 100
}

/**
 * Get grade letter from percentage
 */
export const getGradeLetter = (percentage: number): string => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 85) return 'A'
  if (percentage >= 80) return 'A-'
  if (percentage >= 75) return 'B+'
  if (percentage >= 70) return 'B'
  if (percentage >= 65) return 'B-'
  if (percentage >= 60) return 'C+'
  if (percentage >= 55) return 'C'
  if (percentage >= 50) return 'C-'
  if (percentage >= 45) return 'D'
  return 'F'
}

/**
 * Get grade status (pass/fail)
 */
export const getGradeStatus = (percentage: number, passingGrade: number = 50): string => {
  return percentage >= passingGrade ? 'Pass' : 'Fail'
}

/**
 * Format full name
 */
export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`
}

/**
 * Generate random string (for codes, passwords)
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Paginate array
 */
export const paginate = <T>(
  array: T[],
  page: number,
  pageSize: number
): { data: T[]; total: number; page: number; pageSize: number; totalPages: number } => {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const data = array.slice(startIndex, endIndex)

  return {
    data,
    total: array.length,
    page,
    pageSize,
    totalPages: Math.ceil(array.length / pageSize),
  }
}

/**
 * Sort array by key
 */
export const sortByKey = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Get current academic year
 */
export const getCurrentAcademicYear = (): string => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Academic year starts in August (month 8)
  if (currentMonth >= 8) {
    return `${currentYear}-${currentYear + 1}`
  } else {
    return `${currentYear - 1}-${currentYear}`
  }
}

/**
 * Check if date is in current academic year
 */
export const isInCurrentAcademicYear = (date: string | Date): boolean => {
  const d = new Date(date)
  const academicYear = getCurrentAcademicYear()
  const [startYear, endYear] = academicYear.split('-').map(Number)
  
  const startDate = new Date(startYear, 7, 1) // August 1st
  const endDate = new Date(endYear, 6, 31) // July 31st

  return d >= startDate && d <= endDate
}

/**
 * Get date range for current week
 */
export const getCurrentWeekRange = (): { start: Date; end: Date } => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

/**
 * Get date range for current month
 */
export const getCurrentMonthRange = (): { start: Date; end: Date } => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  return { start, end }
}

/**
 * Delay/sleep function
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Truncate string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Create initials from name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  return Object.keys(obj).length === 0
}

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}
