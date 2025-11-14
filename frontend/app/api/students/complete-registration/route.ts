import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const {
      studentCode,
      dateOfBirth,
      gender,
      address,
      emergencyContactName,
      emergencyContactPhone,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
      parentRelationship
    } = await request.json()

    // Validate required fields
    if (!studentCode || !dateOfBirth || !gender) {
      return NextResponse.json(
        { success: false, error: 'Missing required student information' },
        { status: 400 }
      )
    }

    if (!parentFirstName || !parentLastName || !parentEmail || !parentRelationship) {
      return NextResponse.json(
        { success: false, error: 'Missing required parent information' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Get student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('student_code', studentCode)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // 2. Update student record with additional information
    const { error: updateError } = await supabase
      .from('students')
      .update({
        date_of_birth: dateOfBirth,
        gender: gender,
        address: address || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
      })
      .eq('id', student.id)

    if (updateError) {
      console.error('Error updating student:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update student information' },
        { status: 500 }
      )
    }

    // 3. Check if parent already exists by email
    const { data: existingParentProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', parentEmail)
      .eq('role', 'parent')
      .single()

    let parentUserId

    if (existingParentProfile) {
      // Parent already exists
      parentUserId = existingParentProfile.id
    } else {
      // 4. Create parent auth user
      const { data: parentAuthUser, error: parentAuthError } = await supabase.auth.admin.createUser({
        email: parentEmail,
        password: studentCode, // Use student code as default password (parent can change it)
        email_confirm: true,
        user_metadata: {
          first_name: parentFirstName,
          last_name: parentLastName,
        }
      })

      if (parentAuthError) {
        console.error('Error creating parent auth:', parentAuthError)
        return NextResponse.json(
          { success: false, error: 'Failed to create parent account' },
          { status: 500 }
        )
      }

      parentUserId = parentAuthUser.user.id

      // 5. Create parent user_profile
      const { error: parentProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: parentUserId,
          role: 'parent',
          first_name: parentFirstName,
          last_name: parentLastName,
          phone: parentPhone || null,
          is_active: true,
        })

      if (parentProfileError) {
        console.error('Error creating parent profile:', parentProfileError)
        return NextResponse.json(
          { success: false, error: 'Failed to create parent profile' },
          { status: 500 }
        )
      }

      // 6. Create parent record
      const { error: parentRecordError } = await supabase
        .from('parents')
        .insert({
          user_id: parentUserId,
          occupation: null,
        })

      if (parentRecordError) {
        console.error('Error creating parent record:', parentRecordError)
        return NextResponse.json(
          { success: false, error: 'Failed to create parent record' },
          { status: 500 }
        )
      }
    }

    // 7. Get parent record id
    const { data: parentRecord } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', parentUserId)
      .single()

    if (!parentRecord) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 500 }
      )
    }

    // 8. Create parent-student link (check if already exists)
    const { data: existingLink } = await supabase
      .from('parent_student_links')
      .select('id')
      .eq('parent_id', parentRecord.id)
      .eq('student_id', student.id)
      .single()

    if (!existingLink) {
      const { error: linkError } = await supabase
        .from('parent_student_links')
        .insert({
          parent_id: parentRecord.id,
          student_id: student.id,
          relationship: parentRelationship,
          is_primary: true,
        })

      if (linkError) {
        console.error('Error creating parent-student link:', linkError)
        return NextResponse.json(
          { success: false, error: 'Failed to link parent to student' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      data: {
        studentCode,
        parentEmail,
        parentDefaultPassword: studentCode // Let them know the default password
      }
    })
  } catch (error: any) {
    console.error('Error completing registration:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
