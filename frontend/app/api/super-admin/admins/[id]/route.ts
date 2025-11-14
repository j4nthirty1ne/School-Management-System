import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// DELETE admin
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const userId = params.id

    // First, get the admin record to ensure it exists
    const { data: admin, error: fetchError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (fetchError || !admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Delete from admins table first
    const { error: deleteAdminError } = await supabase
      .from('admins')
      .delete()
      .eq('user_id', userId)

    if (deleteAdminError) {
      return NextResponse.json(
        { success: false, error: deleteAdminError.message },
        { status: 500 }
      )
    }

    // Delete from user_profiles
    const { error: deleteProfileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      return NextResponse.json(
        { success: false, error: deleteProfileError.message },
        { status: 500 }
      )
    }

    // Delete from auth.users
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      return NextResponse.json(
        { success: false, error: deleteAuthError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH admin (update status)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const userId = params.id
    const body = await request.json()

    // Update user_profiles is_active status
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ is_active: body.is_active })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin status updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
