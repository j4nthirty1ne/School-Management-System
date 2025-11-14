import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { studentCode } = await request.json()

    if (!studentCode) {
      return NextResponse.json(
        { success: false, error: 'Student code is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find student by code
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        id,
        student_code,
        user_profiles!inner (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('student_code', studentCode)
      .single()

    if (error || !student) {
      return NextResponse.json(
        { success: false, error: 'Invalid student code' },
        { status: 404 }
      )
    }

    // Check if student has already completed registration (has date_of_birth filled)
    const { data: studentDetails } = await supabase
      .from('students')
      .select('date_of_birth')
      .eq('student_code', studentCode)
      .single()

    if (studentDetails?.date_of_birth && studentDetails.date_of_birth !== '2000-01-01') {
      return NextResponse.json(
        { success: false, error: 'This student has already completed registration' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        student_code: student.student_code,
        first_name: student.user_profiles?.first_name,
        last_name: student.user_profiles?.last_name,
        email: student.user_profiles?.email,
        phone: student.user_profiles?.phone,
      }
    })
  } catch (error: any) {
    console.error('Error verifying student code:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
