import { supabaseAdmin } from '../config/supabase'

/**
 * Validate student code
 */
export const validateStudentCode = async (code: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (error) {
      return {
        success: false,
        error: 'Invalid student code',
      }
    }

    // Check if code is available
    if (data.status !== 'available') {
      return {
        success: false,
        error: 'Student code has already been used',
      }
    }

    // Check if code is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Mark as expired
      await supabaseAdmin
        .from('student_codes')
        .update({ status: 'expired' })
        .eq('id', data.id)

      return {
        success: false,
        error: 'Student code has expired',
      }
    }

    return {
      success: true,
      code: data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Mark student code as used
 */
export const markStudentCodeAsUsed = async (code: string, userId: string) => {
  try {
    const { error } = await supabaseAdmin
      .from('student_codes')
      .update({
        status: 'used',
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('code', code)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate student codes (Admin only)
 */
export const generateStudentCodes = async (count: number, adminId: string) => {
  try {
    const year = new Date().getFullYear()

    // Get last code number for this year
    const { data: lastCode } = await supabaseAdmin
      .from('student_codes')
      .select('code')
      .like('code', `STU-${year}-%`)
      .order('code', { ascending: false })
      .limit(1)
      .single()

    let startNumber = 1
    if (lastCode) {
      const lastNumber = parseInt(lastCode.code.split('-')[2])
      startNumber = lastNumber + 1
    }

    // Generate codes
    const codes = []
    for (let i = 0; i < count; i++) {
      const sequence = String(startNumber + i).padStart(5, '0')
      codes.push({
        code: `STU-${year}-${sequence}`,
        status: 'available',
        generated_by: adminId,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })
    }

    const { data, error } = await supabaseAdmin
      .from('student_codes')
      .insert(codes)
      .select()

    if (error) throw error

    return {
      success: true,
      codes: data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get all student codes (Admin only)
 */
export const getAllStudentCodes = async (filters?: {
  status?: string
  year?: number
}) => {
  try {
    let query = supabaseAdmin
      .from('student_codes')
      .select('*')
      .order('generated_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.year) {
      query = query.like('code', `STU-${filters.year}-%`)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      codes: data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete student code (Admin only)
 */
export const deleteStudentCode = async (codeId: string) => {
  try {
    const { error } = await supabaseAdmin
      .from('student_codes')
      .delete()
      .eq('id', codeId)
      .eq('status', 'available') // Only delete unused codes

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
