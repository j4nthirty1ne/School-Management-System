import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET all subjects
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('subject_name', { ascending: true })

    if (error) {
      console.error('Error fetching subjects:', error)
      return NextResponse.json({
        success: true,
        subjects: [],
        count: 0,
      })
    }

    return NextResponse.json({
      success: true,
      subjects: subjects || [],
      count: subjects?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: true,
      subjects: [],
      count: 0,
    })
  }
}

// POST create new subject
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({
        subject_name: body.subject_name,
        subject_code: body.subject_code,
        description: body.description,
        credit_hours: body.credit_hours || 1,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subject:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subject: subject,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
