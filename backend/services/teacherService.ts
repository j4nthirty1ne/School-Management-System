import { supabaseAdmin } from '../config/supabase'
import { registerUser } from './authService'

interface CreateTeacherData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  subjectSpecialization?: string
  qualification?: string
  hireDate: string
  teacherCode: string
}

/**
 * Create a new teacher (Admin only)
 */
export const createTeacher = async (teacherData: CreateTeacherData) => {
  try {
    // 1. Create teacher auth user and profile
    const teacherResult = await registerUser({
      email: teacherData.email,
      password: teacherData.password,
      firstName: teacherData.firstName,
      lastName: teacherData.lastName,
      phone: teacherData.phone,
      role: 'teacher',
    })

    if (!teacherResult.success || !teacherResult.user) {
      throw new Error(teacherResult.error || 'Failed to create teacher account')
    }

    // 2. Create teacher record
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id: teacherResult.user.id,
        teacher_code: teacherData.teacherCode,
        subject_specialization: teacherData.subjectSpecialization,
        qualification: teacherData.qualification,
        hire_date: teacherData.hireDate,
        status: 'active',
      })
      .select()
      .single()

    if (teacherError) throw teacherError

    return {
      success: true,
      teacher,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate teacher code
 */
export const generateTeacherCode = async () => {
  try {
    const year = new Date().getFullYear()

    // Get last teacher code for this year
    const { data: lastTeacher } = await supabaseAdmin
      .from('teachers')
      .select('teacher_code')
      .like('teacher_code', `TCH-${year}-%`)
      .order('teacher_code', { ascending: false })
      .limit(1)
      .single()

    let sequence = 1
    if (lastTeacher) {
      const lastNumber = parseInt(lastTeacher.teacher_code.split('-')[2])
      sequence = lastNumber + 1
    }

    const teacherCode = `TCH-${year}-${String(sequence).padStart(3, '0')}`

    return {
      success: true,
      code: teacherCode,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get teacher by ID
 */
export const getTeacherById = async (teacherId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('teachers')
      .select(`
        *,
        user_profiles (*)
      `)
      .eq('id', teacherId)
      .single()

    if (error) throw error

    return {
      success: true,
      teacher: data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get teacher by code
 */
export const getTeacherByCode = async (teacherCode: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('teachers')
      .select(`
        *,
        user_profiles (*)
      `)
      .eq('teacher_code', teacherCode)
      .single()

    if (error) throw error

    return {
      success: true,
      teacher: data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get all teachers
 */
export const getAllTeachers = async (filters?: {
  status?: string
  search?: string
}) => {
  try {
    let query = supabaseAdmin
      .from('teachers')
      .select(`
        *,
        user_profiles (*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    // Filter by search if provided
    let teachers = data
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      teachers = data.filter(
        (t: any) =>
          t.teacher_code.toLowerCase().includes(searchLower) ||
          t.user_profiles.first_name.toLowerCase().includes(searchLower) ||
          t.user_profiles.last_name.toLowerCase().includes(searchLower) ||
          t.subject_specialization?.toLowerCase().includes(searchLower)
      )
    }

    return {
      success: true,
      teachers,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update teacher
 */
export const updateTeacher = async (
  teacherId: string,
  updates: Partial<CreateTeacherData>
) => {
  try {
    const { error } = await supabaseAdmin
      .from('teachers')
      .update({
        subject_specialization: updates.subjectSpecialization,
        qualification: updates.qualification,
      })
      .eq('id', teacherId)

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
 * Update teacher status
 */
export const updateTeacherStatus = async (
  teacherId: string,
  status: 'active' | 'inactive' | 'on_leave'
) => {
  try {
    const { error } = await supabaseAdmin
      .from('teachers')
      .update({ status })
      .eq('id', teacherId)

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
 * Delete teacher (change status to inactive)
 */
export const deleteTeacher = async (teacherId: string) => {
  try {
    const { error } = await supabaseAdmin
      .from('teachers')
      .update({ status: 'inactive' })
      .eq('id', teacherId)

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
 * Login with teacher code
 */
export const loginWithTeacherCode = async (
  teacherCode: string,
  password: string
) => {
  try {
    // Get teacher by code
    const teacherResult = await getTeacherByCode(teacherCode)
    
    if (!teacherResult.success || !teacherResult.teacher) {
      return {
        success: false,
        error: 'Invalid teacher code',
      }
    }

    const teacher = teacherResult.teacher as any

    // Login with email
    const { supabase } = await import('../config/supabase')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: teacher.user_profiles.email,
      password: password,
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
      session: data.session,
      profile: teacher.user_profiles,
      teacher: teacher,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
