import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let supabase
    
    try {
      supabase = createAdminClient()
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          students: [],
          count: 0,
        })
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }

    const { data: students, error } = await supabase
      .from('students')
      .select(`
        id,
        student_code,
        enrollment_status,
        user_profiles!inner (
          first_name,
          last_name,
          phone,
          id
        )
      `)
      .eq('class_id', id)

    if (error) {
      console.error('Error fetching class students:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const transformedStudents = students?.map((student: any) => ({
      id: student.id,
      student_code: student.student_code,
      first_name: student.user_profiles?.first_name,
      last_name: student.user_profiles?.last_name,
      phone: student.user_profiles?.phone,
      user_id: student.user_profiles?.id,
      enrollment_status: student.enrollment_status,
    }))

    return NextResponse.json({
      success: true,
      students: transformedStudents || [],
      count: transformedStudents?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
