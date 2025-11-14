import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    let supabase
    
    try {
      supabase = await createClient()
    } catch (err: any) {
      // Development fallback with password validation
      if (process.env.NODE_ENV === 'development') {
        // Simple password validation for dev mode
        if (password !== 'test123') {
          return NextResponse.json({
            success: false,
            error: 'Invalid credentials'
          }, { status: 401 })
        }

        const devProfile = {
          id: 'dev-user-id',
          full_name: 'Dev User',
          role: email?.toLowerCase?.().includes('admin') ? 'admin' : 'student',
          avatar_url: null,
        }

        return NextResponse.json({
          success: true,
          user: { id: devProfile.id, email },
          session: null,
          profile: devProfile,
        })
      }

      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }

    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 401 })
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
      profile,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
