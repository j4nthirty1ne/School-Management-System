import { createClient } from '@supabase/supabase-js'

// Supabase client for browser (uses anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Supabase admin client (uses service role key - server-side only!)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent'
export type CodeStatus = 'available' | 'used' | 'expired'
export type EnrollmentStatus = 'active' | 'graduated' | 'transferred' | 'suspended' | 'pending'
export type TeacherStatus = 'active' | 'inactive' | 'on_leave'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type GenderType = 'male' | 'female' | 'other'
export type RelationshipType = 'father' | 'mother' | 'guardian' | 'other'
export type GradeType = 'quiz' | 'assignment' | 'midterm' | 'final' | 'project'

export interface UserProfile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  user_id: string
  department?: string
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  user_id: string
  teacher_code: string
  subject_specialization?: string
  qualification?: string
  hire_date: string
  status: TeacherStatus
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  user_id: string
  student_code: string
  date_of_birth: string
  gender: GenderType
  address?: string
  class_id?: string
  enrollment_date: string
  enrollment_status: EnrollmentStatus
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_notes?: string
  created_at: string
  updated_at: string
}

export interface Parent {
  id: string
  user_id: string
  occupation?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface StudentCode {
  id: string
  code: string
  status: CodeStatus
  generated_by?: string
  used_by?: string
  generated_at: string
  used_at?: string
  expires_at?: string
  notes?: string
}

export interface Class {
  id: string
  class_name: string
  section: string
  grade_level: number
  academic_year: string
  room_number?: string
  capacity: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  subject_name: string
  subject_code: string
  description?: string
  credit_hours: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  student_id: string
  class_id: string
  date: string
  status: AttendanceStatus
  marked_by: string
  remarks?: string
  created_at: string
  updated_at: string
}

export interface Grade {
  id: string
  student_id: string
  subject_id: string
  class_id: string
  grade_type: GradeType
  marks_obtained: number
  total_marks: number
  percentage: number
  grade_letter?: string
  exam_date?: string
  remarks?: string
  entered_by: string
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  target_role?: UserRole[]
  class_id?: string
  priority: string
  is_published: boolean
  published_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  title: string
  description?: string
  class_id: string
  subject_id: string
  teacher_id: string
  due_date: string
  total_marks: number
  attachment_url?: string
  created_at: string
  updated_at: string
}
