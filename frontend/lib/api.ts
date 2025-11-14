// API utility functions for making backend requests

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()
    return data
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred',
    }
  }
}

// Auth API calls
export const authApi = {
  // Login
  login: async (email: string, password: string) => {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  // Register
  register: async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  // Get current user
  getCurrentUser: async () => {
    return apiFetch('/api/auth/user')
  },

  // Logout
  logout: async () => {
    return apiFetch('/api/auth/logout', {
      method: 'POST',
    })
  },
}

// Student API calls
export const studentApi = {
  // Validate student code
  validateCode: async (code: string) => {
    return apiFetch('/api/validate/student-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },

  // Get all students (admin/teacher only)
  getAll: async () => {
    return apiFetch('/api/students')
  },

  // Get student by ID
  getById: async (id: string) => {
    return apiFetch(`/api/students/${id}`)
  },

  // Get student by code
  getByCode: async (code: string) => {
    return apiFetch(`/api/students/code/${code}`)
  },

  // Update student
  update: async (id: string, data: any) => {
    return apiFetch(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete student
  delete: async (id: string) => {
    return apiFetch(`/api/students/${id}`, {
      method: 'DELETE',
    })
  },
}

// Admin API calls
export const adminApi = {
  // Generate student codes
  generateCodes: async (count: number, expiryDays?: number) => {
    return apiFetch('/api/admin/codes/generate', {
      method: 'POST',
      body: JSON.stringify({ count, expiryDays }),
    })
  },

  // Get all student codes
  getCodes: async () => {
    return apiFetch('/api/admin/codes')
  },
}

// Test API
export const testApi = {
  // Test backend connection
  testConnection: async () => {
    return apiFetch('/api/test')
  },
}

export default {
  auth: authApi,
  student: studentApi,
  admin: adminApi,
  test: testApi,
}
