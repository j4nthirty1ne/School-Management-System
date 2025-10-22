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
  parentEmail: string
  parentFirstName: string
  parentLastName: string
  parentPhone?: string
  parentRelationship: 'father' | 'mother' | 'guardian' | 'other'
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

    // 3. Check if parent already exists
    const { data: existingParentProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('role', 'parent')
      .ilike('email', studentData.parentEmail)
      .single()

    let parentId: string

    if (existingParentProfile) {
      // Parent exists, get parent record
      const { data: existingParent } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('user_id', existingParentProfile.id)
        .single()

      parentId = existingParent!.id
    } else {
      // 4. Create parent account
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

      // 5. Create parent record
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('parents')
        .insert({
          user_id: parentResult.user.id,
          occupation: studentData.parentOccupation,
          address: studentData.address,
        })
        .select()
        .single()

      if (parentError) throw parentError

      parentId = parent.id

      // TODO: Send email to parent with temporary password
      console.log('Parent temporary password:', tempPassword)
    }

    // 6. Link parent to student
    const { error: linkError } = await supabaseAdmin
      .from('parent_student_links')
      .insert({
        parent_id: parentId,
        student_id: student.id,
        relationship: studentData.parentRelationship,
        is_primary: true,
      })

    if (linkError) throw linkError

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

/**
 * Delete student (soft delete by changing status)
 */
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
