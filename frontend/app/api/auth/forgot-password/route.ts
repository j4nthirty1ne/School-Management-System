import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    // quick env validation to fail fast with a clear message during local/dev
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon || url.includes('your-supabase-project') || anon.includes('your_anon_key')) {
      return NextResponse.json({ success: false, error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' }, { status: 500 })
    }

    const supabase = await createClient()

    // Trigger Supabase to send a password reset email.
    // Optionally include redirectTo using an env var if you want the email link to return to the app.
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL || undefined
    let res
    try {
      res = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)
    } catch (err: any) {
      // network / fetch-level errors end up here
      return NextResponse.json({ success: false, error: err?.message || 'Failed to call Supabase API' }, { status: 500 })
    }

    const { data, error } = res

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 })
  }
}
