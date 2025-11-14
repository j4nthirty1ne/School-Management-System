/**
 * Test Supabase Connection
 * Run this to verify your Supabase connection is working
 */

import { createClient } from './client'

export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    
    // Test 1: Check if client is created
    console.log('✓ Supabase client created successfully')
    
    // Test 2: Try to fetch from a public table (adjust table name as needed)
    const { data, error } = await supabase
      .from('students') // Change to your actual table name
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('✗ Database query error:', error.message)
      return false
    }
    
    console.log('✓ Database connection successful')
    console.log('✓ All tests passed!')
    return true
    
  } catch (error) {
    console.error('✗ Connection test failed:', error)
    return false
  }
}
