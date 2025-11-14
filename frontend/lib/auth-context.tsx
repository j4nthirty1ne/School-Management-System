'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '@/lib/api'

interface User {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  is_active?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch current user on mount
  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    setLoading(true)
    const response = await authApi.getCurrentUser()
    const resp: any = response
    
    if (resp.success && resp.data?.user) {
      setUser(resp.data.user)
    } else {
      setUser(null)
    }
    
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    const resp: any = response
    
    if (resp.success && resp.data?.user) {
      setUser(resp.data.user)
      return { success: true }
    }
    
    return { 
      success: false, 
      error: response.error || 'Login failed' 
    }
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
