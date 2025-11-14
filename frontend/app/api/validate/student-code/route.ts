import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Student code is required'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if the code exists and is available
    const { data: studentCode, error } = await supabase
      .from('student_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !studentCode) {
      return NextResponse.json({
        success: false,
        error: 'Invalid student code'
      }, { status: 404 })
    }

    // Check if code is available
    if (studentCode.status !== 'available') {
      return NextResponse.json({
        success: false,
        error: 'This student code has already been used'
      }, { status: 400 })
    }

    // Check if code is expired
    if (studentCode.expires_at && new Date(studentCode.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'This student code has expired'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Student code is valid',
      code: studentCode.code
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
