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
      .select('class_id')
      .eq('user_id', currentUser.id)
      .single()

    if (!student) return NextResponse.json({ success: true, classes: [] })

    // If student has a class_id, fetch that class and other related classes (simple for now)
    if (student.class_id) {
      const { data: cls, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', student.class_id)
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, classes: cls ? [cls] : [] })
    }

    return NextResponse.json({ success: true, classes: [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 })
  }
}
