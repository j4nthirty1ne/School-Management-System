import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// DELETE teacher
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const userId = params.id

    // First, get the teacher record to ensure it exists
    const { data: teacher, error: fetchError } = await supabase
      .from('teachers')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (fetchError || !teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Delete from teachers table first
    const { error: deleteTeacherError } = await supabase
      .from('teachers')
      .delete()
      .eq('user_id', userId)

    if (deleteTeacherError) {
      return NextResponse.json(
        { success: false, error: deleteTeacherError.message },
        { status: 500 }
      )
    }

    // Delete from user_profiles
    const { error: deleteProfileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      return NextResponse.json(
        { success: false, error: deleteProfileError.message },
        { status: 500 }
      )
    }

    // Delete from auth.users
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      return NextResponse.json(
        { success: false, error: deleteAuthError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET teacher by user_id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const userId = params.id

    const { data: teacherRaw, error } = await supabase
      .from('teachers')
      .select(`
        id,
        user_id,
        teacher_code,
        hire_date,
        status,
        created_at,
        user_profiles!inner (id, first_name, last_name, phone, email)
      `)
      .eq('user_id', userId)
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!teacherRaw) {
      return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 404 })
    }

    const profile = Array.isArray(teacherRaw.user_profiles)
      ? teacherRaw.user_profiles[0]
      : teacherRaw.user_profiles

    const teacher = {
      id: teacherRaw.id,
      user_id: teacherRaw.user_id,
      teacher_code: teacherRaw.teacher_code,
      hire_date: teacherRaw.hire_date,
      status: teacherRaw.status,
      created_at: teacherRaw.created_at,
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      phone: profile?.phone,
      email: profile?.email,
    }

    return NextResponse.json({ success: true, teacher })
  } catch (err: any) {
    console.error('Error fetching teacher:', err)
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 })
  }
}

// PUT update teacher/profile
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const userId = params.id
    const body = await request.json()

    // Update teachers table fields (hire_date, status, teacher_code)
    const teacherUpdates: any = {}
    if (body.hire_date !== undefined) teacherUpdates.hire_date = body.hire_date
    if (body.status !== undefined) teacherUpdates.status = body.status
    if (body.teacher_code !== undefined) teacherUpdates.teacher_code = body.teacher_code

    if (Object.keys(teacherUpdates).length > 0) {
      const { error: tErr } = await supabase
        .from('teachers')
        .update(teacherUpdates)
        .eq('user_id', userId)

      if (tErr) throw tErr
    }

    // Update user_profiles (first_name, last_name, phone, email)
    const profileUpdates: any = {}
    if (body.first_name !== undefined) profileUpdates.first_name = body.first_name
    if (body.last_name !== undefined) profileUpdates.last_name = body.last_name
    if (body.phone !== undefined) profileUpdates.phone = body.phone
    if (body.email !== undefined) profileUpdates.email = body.email

    if (Object.keys(profileUpdates).length > 0) {
      const { error: pErr } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('id', userId)

      if (pErr) throw pErr
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating teacher:', err)
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 })
  }
}
