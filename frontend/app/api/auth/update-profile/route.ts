import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { first_name, last_name, avatar_url, phone, is_active } = body

    // Build update object only with provided fields
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (first_name !== undefined) updatePayload.first_name = first_name
    if (last_name !== undefined) updatePayload.last_name = last_name
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url
    if (phone !== undefined) updatePayload.phone = phone
    if (is_active !== undefined) updatePayload.is_active = is_active

    if (Object.keys(updatePayload).length <= 1) {
      return NextResponse.json(
        { success: false, error: 'No updatable fields provided' },
        { status: 400 }
      )
    }

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update profile',
      },
      { status: 500 }
    )
  }
}
