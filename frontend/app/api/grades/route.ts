import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Get current user from auth
    const supabaseAuth = await createServerClient()
    const maybe = await (supabaseAuth as any).auth.getUser()
    const currentUser = maybe?.data?.user || maybe?.user || null
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let supabase
    
    try {
      supabase = createAdminClient()
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    
    // Get teacher record for current user
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', currentUser.id)
      .single()

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher record not found' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { class_id, grade_type, max_score, grade_date, notes, grades } = body

    if (!class_id || !grade_type || !max_score || !grades) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the class belongs to this teacher
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id, subject_id')
      .eq('id', class_id)
      .single()

    if (!classData || classData.teacher_id !== teacher.id) {
      return NextResponse.json(
        { success: false, error: 'You can only enter grades for your own classes' },
        { status: 403 }
      )
    }

    // Prepare grade records for insertion
    const gradeInserts = grades.map((grade: any) => ({
      student_id: grade.student_id,
      subject_id: classData.subject_id,
      class_id: class_id,
      grade_type: grade_type,
      marks_obtained: parseFloat(grade.score),
      total_marks: parseFloat(max_score),
      exam_date: grade_date || new Date().toISOString().split('T')[0],
      remarks: notes || null,
      entered_by: teacher.id,
    }))

    // Insert grade records
    const { data: gradeData, error } = await supabase
      .from('grades')
      .insert(gradeInserts)
      .select()

    if (error) {
      console.error('Error creating grades:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: gradeData.length,
      message: 'Grades submitted successfully'
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Get current user from auth
    const supabaseAuth = await createServerClient()
    const maybe = await (supabaseAuth as any).auth.getUser()
    const currentUser = maybe?.data?.user || maybe?.user || null
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let supabase
    
    try {
      supabase = createAdminClient()
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    
    // Get teacher record for current user
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', currentUser.id)
      .single()

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher record not found' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const class_id = searchParams.get('class_id')

    if (!class_id) {
      return NextResponse.json(
        { success: false, error: 'class_id is required' },
        { status: 400 }
      )
    }

    // Verify the class belongs to this teacher
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', class_id)
      .single()

    if (!classData || classData.teacher_id !== teacher.id) {
      return NextResponse.json(
        { success: false, error: 'You can only view grades for your own classes' },
        { status: 403 }
      )
    }

    // Get grade records
    const { data: grades, error } = await supabase
      .from('grades')
      .select(`
        id,
        student_id,
        marks_obtained,
        total_marks,
        percentage,
        grade_letter,
        grade_type,
        exam_date,
        remarks,
        created_at
      `)
      .eq('class_id', class_id)
      .order('exam_date', { ascending: false })

    if (error) {
      console.error('Error fetching grades:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Transform grades to match frontend expectations
    const transformedGrades = (grades || []).map(grade => ({
      ...grade,
      score: grade.marks_obtained,
      max_score: grade.total_marks,
      assessment_type: grade.grade_type,
    }))

    return NextResponse.json({
      success: true,
      grades: transformedGrades
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
