import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client with service role key
 * This bypasses Row Level Security (RLS) policies
 * USE WITH CAUTION - Only for server-side operations
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey || supabaseUrl.includes('your-supabase-project')) {
    if (process.env.NODE_ENV === 'development') {
      // Return a mock client for development
      throw new Error('Supabase not configured - using development fallback')
    }
    throw new Error('Missing Supabase URL or Service Role Key')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
