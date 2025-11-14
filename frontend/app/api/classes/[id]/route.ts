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
          class: {
            id: id,
            class_name: 'Dev Class',
            grade_level: '10',
            section: 'A',
          },
        })
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }

    const { data: classData, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
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
        const body = await request.json()
        return NextResponse.json({
          success: true,
          class: {
            id: id,
            ...body,
            updated_at: new Date().toISOString(),
          },
        })
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    
    const body = await request.json()

    const { data: classData, error } = await supabase
      .from('classes')
      .update({
        class_name: body.class_name,
        grade_level: body.grade_level,
        section: body.section,
        teacher_id: body.teacher_id,
        room_number: body.room_number,
        schedule: body.schedule,
        max_capacity: body.max_capacity,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
          message: 'Class deleted successfully (dev mode)',
        })
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
