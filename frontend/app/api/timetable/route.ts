import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET all time slots
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academic_year') || '2024-2025'
    
    const supabase = createAdminClient()

    const { data: timeSlots, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('academic_year', academicYear)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching time slots:', error)
      return NextResponse.json({
        success: true,
        time_slots: [],
        count: 0,
      })
    }

    return NextResponse.json({
      success: true,
      time_slots: timeSlots || [],
      count: timeSlots?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: true,
      time_slots: [],
      count: 0,
    })
  }
}

// POST create new time slot
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data: timeSlot, error } = await supabase
      .from('time_slots')
      .insert({
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        academic_year: body.academic_year || '2024-2025',
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating time slot:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      time_slot: timeSlot,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE time slot
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Time slot ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting time slot:', error)
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
