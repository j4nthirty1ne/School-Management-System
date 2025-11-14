import { supabaseAdmin } from '../config/supabase'
import { registerUser } from './authService'

interface CreateStudentData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  address?: string
  classId?: string
  studentCode: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalNotes?: string
  // Parent info
  parentEmail?: string
  parentFirstName?: string
  parentLastName?: string
  parentPhone?: string
  parentRelationship?: 'father' | 'mother' | 'guardian' | 'other'
  parentOccupation?: string
}

/**
 * Register a new student (with parent account creation)
 */
export const registerStudent = async (studentData: CreateStudentData) => {
  try {
    // 1. Create student auth user and profile
    const studentResult = await registerUser({
      email: studentData.email,
      password: studentData.password,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      phone: studentData.phone,
      role: 'student',
    })

    if (!studentResult.success || !studentResult.user) {
      throw new Error(studentResult.error || 'Failed to create student account')
    }

    // 2. Create student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: studentResult.user.id,
        student_code: studentData.studentCode,
        date_of_birth: studentData.dateOfBirth,
        gender: studentData.gender,
        address: studentData.address,
        class_id: studentData.classId,
        enrollment_date: new Date().toISOString(),
        enrollment_status: 'active',
        emergency_contact_name: studentData.emergencyContactName,
        emergency_contact_phone: studentData.emergencyContactPhone,
        medical_notes: studentData.medicalNotes,
      })
      .select()
      .single()

    if (studentError) throw studentError

    // 3. Optionally create/link parent if parent email was provided
    if (studentData.parentEmail) {
      // Check if parent already exists
      const { data: existingParentProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('role', 'parent')
        .ilike('email', studentData.parentEmail)
        .single()

      let parentId: string | undefined

      if (existingParentProfile) {
        // Parent exists, get parent record
        const { data: existingParent } = await supabaseAdmin
          .from('parents')
          .select('id')
          .eq('user_id', existingParentProfile.id)
          .single()

        parentId = existingParent?.id
      } else if (studentData.parentFirstName && studentData.parentLastName) {
        // Create parent account — create with a generated temporary password and
        // create an invite token that the admin can send to the parent.
        const tempPassword = generateTemporaryPassword()

        const parentResult = await registerUser({
          email: studentData.parentEmail,
          password: tempPassword,
          firstName: studentData.parentFirstName,
          lastName: studentData.parentLastName,
          phone: studentData.parentPhone,
          role: 'parent',
        })

        if (!parentResult.success || !parentResult.user) {
          throw new Error(parentResult.error || 'Failed to create parent account')
        }

        // Create parent record
        const { data: parent, error: parentError } = await supabaseAdmin
          .from('parents')
          .insert({
            user_id: parentResult.user.id,
            occupation: studentData.parentOccupation,
          })
          .select()
          .single()

        if (parentError) throw parentError

        parentId = parent.id

        // Generate invite token and log the invite URL (placeholder).
        try {
          const { createInvite } = await import('../temp/tempInviteStore')
          const inviteToken = createInvite(parentResult.user.id)
          const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/onboard?token=${inviteToken}`
          console.log('Parent invite URL (placeholder):', inviteUrl)
        } catch (e) {
          console.warn('Failed to generate parent invite token (placeholder):', e)
        }
      }

      // Link parent to student if we have a parentId
      if (parentId) {
        const { error: linkError } = await supabaseAdmin
          .from('parent_student_links')
          .insert({
            parent_id: parentId,
            student_id: student.id,
            relationship: studentData.parentRelationship || 'parent',
            is_primary: true,
          })

        if (linkError) throw linkError
      }
    }

    return {
      success: true,
      student,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get student by ID
 */
export const getStudentById = async (studentId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        user_profiles (*),
        classes (*),
        parent_student_links (
          *,
          parents (
            *,
            user_profiles (*)
          )
        )
      `)
      .eq('id', studentId)
      .single()

    if (error) throw error

    return {
      success: true,
      student: data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get student by code
 */
export const getStudentByCode = async (studentCode: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        user_profiles (*),
        classes (*)
      `)
      .eq('student_code', studentCode)
      .single()

    if (error) throw error

    return {
      success: true,
      student: data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get all students
 */
export const getAllStudents = async (filters?: {
  classId?: string
  status?: string
  search?: string
}) => {
  try {
    let query = supabaseAdmin
      .from('students')
      .select(`
        *,
        user_profiles (*),
        classes (*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.classId) {
      query = query.eq('class_id', filters.classId)
    }

    if (filters?.status) {
      query = query.eq('enrollment_status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    // Filter by search if provided
    let students = data
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      students = data.filter(
        (s: any) =>
          s.student_code.toLowerCase().includes(searchLower) ||
          s.user_profiles.first_name.toLowerCase().includes(searchLower) ||
          s.user_profiles.last_name.toLowerCase().includes(searchLower)
      )
    }

    return {
      success: true,
      students,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update student
 */
export const updateStudent = async (
  studentId: string,
  updates: Partial<CreateStudentData>
) => {
  try {
    const { error } = await supabaseAdmin
      .from('students')
      .update({
        date_of_birth: updates.dateOfBirth,
        gender: updates.gender,
        address: updates.address,
        class_id: updates.classId,
        emergency_contact_name: updates.emergencyContactName,
        emergency_contact_phone: updates.emergencyContactPhone,
        medical_notes: updates.medicalNotes,
      })
      .eq('id', studentId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

export const deleteStudent = async (studentId: string) => {
  try {
    const { error } = await supabaseAdmin
      .from('students')
      .update({ enrollment_status: 'suspended' })
      .eq('id', studentId)

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
 * Claim a pre-created student account using student_code.
 * This is intended for the student to complete registration after an admin
 * pre-created the auth user + student record. The student provides the
 * student_code and a new password (and optionally name updates). The function
 * will set the user's password via the Supabase admin API, update the profile
 * if provided, mark the student_code as used and set enrollment_status -> active.
 */
export const claimStudentRegistration = async (
  studentCode: string,
  newPassword: string,
  updates?: { firstName?: string; lastName?: string }
) => {
  try {
    // 1. Find the student by code
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`*, user_profiles (*)`)
      .eq('student_code', studentCode)
      .single()

    if (studentError || !studentData) {
      throw studentError || new Error('Student not found for provided code')
    }

    const userId = studentData.user_id

    // 2. Update the auth user password (admin operation)
    // supabase Admin SDK provides an admin.updateUserById-like API; call and
    // fall back to admin.updateUser if the exact helper differs in runtime.
    try {
      // Use `any` casts to support different supabase-js versions without
      // causing TypeScript type errors in this repository.
      const authAny: any = supabaseAdmin.auth

      if (authAny && authAny.admin && typeof authAny.admin.updateUserById === 'function') {
        await authAny.admin.updateUserById(userId, { password: newPassword })
      } else if (authAny && authAny.admin && typeof authAny.admin.updateUser === 'function') {
        await authAny.admin.updateUser(userId, { password: newPassword })
      } else if (typeof authAny.updateUser === 'function') {
        await authAny.updateUser({ id: userId, password: newPassword })
      } else {
        throw new Error('Supabase admin updateUser API not available')
      }
    } catch (authUpdateErr: any) {
      throw new Error(`Failed to set user password: ${authUpdateErr?.message || authUpdateErr}`)
    }

    // 3. Optionally update user profile names
    if (updates?.firstName || updates?.lastName) {
      const { error: profileUpdateErr } = await supabaseAdmin
        .from('user_profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
        })
        .eq('id', userId)

      if (profileUpdateErr) throw profileUpdateErr
    }

    // 4. Mark the student_code as used (if present in student_codes table)
    const { error: markCodeErr } = await supabaseAdmin
      .from('student_codes')
      .update({ status: 'used', used_by: userId, used_at: new Date().toISOString() })
      .eq('code', studentCode)

    if (markCodeErr) {
      // Not fatal: continue but warn
      console.warn('Failed to mark student_code used:', markCodeErr)
    }

    // 5. Set student enrollment_status -> active
    const { error: studentUpdateErr } = await supabaseAdmin
      .from('students')
      .update({ enrollment_status: 'active' })
      .eq('student_code', studentCode)

    if (studentUpdateErr) throw studentUpdateErr

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Generate temporary password for parents
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
