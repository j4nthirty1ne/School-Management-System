import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // In development mode without real Supabase, skip auth checks for non-protected paths
  const isDevelopment = process.env.NODE_ENV === 'development'
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-project')

  if (isDevelopment && !hasSupabaseConfig) {
    // In dev mode without Supabase, allow all requests through
    // The login page will handle its own navigation via window.location
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if user is not authenticated and trying to access protected routes
  const protectedPaths = ['/super-admin', '/admin', '/teacher', '/student', '/parent', '/landing-page']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (user && request.nextUrl.pathname === '/login') {
    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    
    // Redirect based on role
    switch (profile?.role) {
      case 'super_admin':
        url.pathname = '/super-admin/dashboard'
        break
      case 'admin':
        url.pathname = '/admin/dashboard'
        break
      case 'teacher':
        url.pathname = '/teacher/dashboard'
        break
      case 'student':
        url.pathname = '/student/dashboard'
        break
      case 'parent':
        url.pathname = '/parent/dashboard'
        break
      default:
        url.pathname = '/student/dashboard'
    }
    
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}
