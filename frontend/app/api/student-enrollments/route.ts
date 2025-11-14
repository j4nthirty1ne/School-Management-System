import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET student enrollments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const subjectClassId = searchParams.get('subject_class_id')
    
    const supabase = createAdminClient()

    // Use the view for detailed information
    let query = supabase
      .from('v_student_enrollments_detailed')
      .select('*')

    if (studentId) {
      // Get student ID from students table using user_id
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', studentId)
        .single()
      
      if (student) {
        const { data: enrollments, error } = await supabase
          .from('student_enrollments')
          .select(`
            *,
            subject_classes!inner(
              *,
              subjects!inner(subject_name, subject_code),
              teachers(
                user_profiles(first_name, last_name)
              )
            )
          `)
          .eq('student_id', student.id)
          .eq('enrollment_status', 'active')

        if (error) {
          console.error('Error fetching enrollments:', error)
          return NextResponse.json({
            success: true,
            enrollments: [],
            count: 0,
          })
        }

        return NextResponse.json({
          success: true,
          enrollments: enrollments || [],
          count: enrollments?.length || 0,
        })
      }
    }

    if (subjectClassId) {
      query = query.eq('subject_class_id', subjectClassId)
    }

    const { data: enrollments, error } = await query
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('Error fetching enrollments:', error)
      return NextResponse.json({
        success: true,
        enrollments: [],
        count: 0,
      })
    }

    return NextResponse.json({
      success: true,
      enrollments: enrollments || [],
      count: enrollments?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: true,
      enrollments: [],
      count: 0,
    })
  }
}

// POST enroll student in class (by admin or by join code)
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const adminSupabase = createAdminClient()
    const body = await request.json()

    let studentId = body.student_id
    let subjectClassId = body.subject_class_id
    let enrollmentMethod = body.enrollment_method || 'admin'

    // If join code is provided, find the class
    if (body.join_code) {
      const { data: subjectClass } = await adminSupabase
        .from('subject_classes')
        .select('id, capacity')
        .eq('join_code', body.join_code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (!subjectClass) {
        return NextResponse.json(
          { success: false, error: 'Invalid join code' },
          { status: 404 }
        )
      }

      subjectClassId = subjectClass.id
      enrollmentMethod = 'self-join'

      // Check capacity
      const { data: enrollments } = await adminSupabase
        .from('student_enrollments')
        .select('id')
        .eq('subject_class_id', subjectClassId)
        .eq('enrollment_status', 'active')

      if (enrollments && enrollments.length >= subjectClass.capacity) {
        return NextResponse.json(
          { success: false, error: 'Class is full' },
          { status: 400 }
        )
      }

      // Get student ID from authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Not authenticated' },
          { status: 401 }
        )
      }

      const { data: student } = await adminSupabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found' },
          { status: 404 }
        )
      }

      studentId = student.id
    }

    // Check if already enrolled
    const { data: existing } = await adminSupabase
      .from('student_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('subject_class_id', subjectClassId)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this class' },
        { status: 400 }
      )
    }

    // Create enrollment
    const { data: enrollment, error } = await adminSupabase
      .from('student_enrollments')
      .insert({
        student_id: studentId,
        subject_class_id: subjectClassId,
        enrollment_method: enrollmentMethod,
        enrollment_status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating enrollment:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enrollment: enrollment,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE drop enrollment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Enrollment ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Soft delete - update status to dropped
    const { error } = await supabase
      .from('student_enrollments')
      .update({ enrollment_status: 'dropped' })
      .eq('id', id)

    if (error) {
      console.error('Error dropping enrollment:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
