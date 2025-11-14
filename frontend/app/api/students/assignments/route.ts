import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const maybe = await (supabase as any).auth.getUser()
    const currentUser = maybe?.data?.user || maybe?.user || null
    if (!currentUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

    const { data: student } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('user_id', currentUser.id)
      .single()

    if (!student) return NextResponse.json({ success: true, assignments: [] })

    // Return assignments for the student's class (if class_id present) and personal assignments
    let query = supabase.from('assignments').select('*').order('due_date', { ascending: true })
    if (student.class_id) query = query.eq('class_id', student.class_id)

    const { data: assignments, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, assignments: assignments || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 })
  }
}
