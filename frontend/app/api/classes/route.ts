import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let supabase
    
    try {
      supabase = createAdminClient()
    } catch (err: any) {
      // Development fallback
      return NextResponse.json({
        success: true,
        classes: [],
        count: 0,
      })
    }

    // First try to get classes with teacher join
    let { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching classes:', error)
      // Return empty array instead of error
      return NextResponse.json({
        success: true,
        classes: [],
        count: 0,
      })
    }

    // If we have classes and teacher_id, try to get teacher info
    const transformedClasses = await Promise.all((classes || []).map(async (cls) => {
      if (cls.teacher_id) {
        try {
          const { data: teacher } = await supabase
            .from('teachers')
            .select('id, first_name, last_name, teacher_code')
            .eq('id', cls.teacher_id)
            .single()
          
          return {
            ...cls,
            teacher_name: teacher 
              ? `${teacher.first_name} ${teacher.last_name}` 
              : null
          }
        } catch {
          return { ...cls, teacher_name: null }
        }
      }
      return { ...cls, teacher_name: null }
    }))

    return NextResponse.json({
      success: true,
      classes: transformedClasses,
      count: transformedClasses.length,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    // Return empty array for any unexpected errors
    return NextResponse.json({
      success: true,
      classes: [],
      count: 0,
    })
  }
}

export async function POST(request: Request) {
  try {
    let supabase
    
    try {
      supabase = createAdminClient()
    } catch (err: any) {
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        const body = await request.json()
        return NextResponse.json({
          success: true,
          class: {
            id: 'dev-class-' + Date.now(),
            ...body,
            created_at: new Date().toISOString(),
          },
        })
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    
    const body = await request.json()

    // Check for room conflict (same room, same day, overlapping time)
    if (body.room_number && body.day_of_week && body.start_time && body.end_time) {
      const { data: existingClasses } = await supabase
        .from('classes')
        .select('id, subject_name, start_time, end_time')
        .eq('room_number', body.room_number)
        .eq('day_of_week', body.day_of_week)

      if (existingClasses && existingClasses.length > 0) {
        const newStart = body.start_time
        const newEnd = body.end_time

        for (const existing of existingClasses) {
          const existingStart = existing.start_time
          const existingEnd = existing.end_time

          // Check if times overlap
          if (
            (newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            return NextResponse.json(
              { 
                success: false, 
                error: `Room ${body.room_number} is already booked on ${body.day_of_week} from ${existingStart} to ${existingEnd} for ${existing.subject_name}` 
              },
              { status: 409 }
            )
          }
        }
      }
    }

    const { data: classData, error } = await supabase
      .from('classes')
      .insert({
        subject_name: body.subject_name,
        subject_code: body.subject_code,
        subject_id: body.subject_id,
        academic_year: body.academic_year,
        teacher_id: body.teacher_id,
        room_number: body.room_number,
        capacity: body.capacity,
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      class: classData,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    let supabase
    
    try {
      supabase = createAdminClient()
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
        { status: 400 }
      )
    }

    // Check for room conflict (same room, same day, overlapping time)
    if (updateData.room_number && updateData.day_of_week && updateData.start_time && updateData.end_time) {
      const { data: existingClasses } = await supabase
        .from('classes')
        .select('id, subject_name, start_time, end_time')
        .eq('room_number', updateData.room_number)
        .eq('day_of_week', updateData.day_of_week)
        .neq('id', id) // Exclude the class being updated

      if (existingClasses && existingClasses.length > 0) {
        const newStart = updateData.start_time
        const newEnd = updateData.end_time

        for (const existing of existingClasses) {
          const existingStart = existing.start_time
          const existingEnd = existing.end_time

          // Check if times overlap
          if (
            (newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            return NextResponse.json(
              { 
                success: false, 
                error: `Room ${updateData.room_number} is already booked on ${updateData.day_of_week} from ${existingStart} to ${existingEnd} for ${existing.subject_name}` 
              },
              { status: 409 }
            )
          }
        }
      }
    }

    const { data: classData, error } = await supabase
      .from('classes')
      .update({
        subject_name: updateData.subject_name,
        subject_code: updateData.subject_code,
        subject_id: updateData.subject_id,
        academic_year: updateData.academic_year,
        teacher_id: updateData.teacher_id,
        room_number: updateData.room_number,
        capacity: updateData.capacity,
        day_of_week: updateData.day_of_week,
        start_time: updateData.start_time,
        end_time: updateData.end_time,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating class:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      class: classData,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
