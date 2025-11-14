import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    let supabase
    
    try {
      supabase = await createClient()
    } catch (err: any) {
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          user: {
            id: 'dev-user-id',
            email: 'dev@school.com',
            role: 'admin',
            first_name: 'Dev',
            last_name: 'User',
            phone: '1234567890',
            is_active: true,
            avatar_url: null,
          },
        })
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    
    // Get current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile'
      }, { status: 500 })
    }

    // Combine user and profile data
    const userData = {
      id: user.id,
      email: user.email,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      is_active: profile.is_active,
      avatar_url: profile.avatar_url,
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
