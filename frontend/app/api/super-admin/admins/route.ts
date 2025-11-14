import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch admins with user profile join
    const { data: admins, error } = await supabase
      .from('admins')
      .select(`
        id,
        user_id,
        department,
        created_at,
        user_profiles!inner (
          first_name,
          last_name,
          phone,
          is_active
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Transform the data to flatten user_profiles
    const transformedAdmins = admins?.map((admin: any) => ({
      id: admin.id,
      user_id: admin.user_id,
      first_name: admin.user_profiles?.first_name,
      last_name: admin.user_profiles?.last_name,
      phone: admin.user_profiles?.phone,
      department: admin.department,
      is_active: admin.user_profiles?.is_active,
      created_at: admin.created_at,
    }))

    return NextResponse.json({
      success: true,
      admins: transformedAdmins || [],
      count: transformedAdmins?.length || 0,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
