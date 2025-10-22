import { supabase, supabaseAdmin } from '../config/supabase'
import type { UserRole } from '../config/supabase'

interface RegisterUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
}

interface LoginCredentials {
  email: string
  password: string
}

/**
 * Register a new user (used for student registration)
 */
export const registerUser = async (userData: RegisterUserData) => {
  try {
    // Create auth user using admin client (bypasses RLS)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Create user profile using admin client (bypasses RLS)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        role: userData.role,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) throw profileError

    return {
      success: true,
      user: authData.user,
      profile: profileData,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Login user
 */
export const loginUser = async (credentials: LoginCredentials) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw error

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError

    return {
      success: true,
      user: data.user,
      session: data.session,
      profile,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get current user session
 */
export const getCurrentUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error

    if (!session) {
      return { success: false, error: 'No active session' }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) throw profileError

    return {
      success: true,
      user: session.user,
      profile,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Change password
 */
export const changePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Reset password (send reset email)
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Verify email
 */
export const verifyEmail = async (token: string) => {
  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Refresh session
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error

    return {
      success: true,
      session: data.session,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
