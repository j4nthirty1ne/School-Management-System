import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let supabase
    
    try {
      supabase = createAdminClient()
    } catch (err: any) {
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          teachers: [],
          count: 0,
        })
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }

    // Fetch teachers from Supabase with user profile join
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select(`
        id,
        teacher_code,
        hire_date,
        status,
        created_at,
        user_profiles!inner (
          first_name,
          last_name,
          phone,
          id
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching teachers:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Transform the data to flatten user_profiles
    const transformedTeachers = teachers?.map((teacher: any) => ({
      id: teacher.id,
      teacher_code: teacher.teacher_code,
      first_name: teacher.user_profiles?.first_name,
      last_name: teacher.user_profiles?.last_name,
      phone: teacher.user_profiles?.phone,
      user_id: teacher.user_profiles?.id,
      subject_specialization: '', // Column doesn't exist in database yet
      qualification: '', // Column doesn't exist in database yet
      hire_date: teacher.hire_date,
      status: teacher.status,
      created_at: teacher.created_at,
    }))

    return NextResponse.json({
      success: true,
      teachers: transformedTeachers || [],
      count: transformedTeachers?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
