// Test Database Connection
// Run this with: node test-db-connection.js

const { createClient } = require('@supabase/supabase-js')

// Your Supabase credentials
const supabaseUrl = 'https://jggpcbuluptjkedolfgc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZ3BjYnVsdXB0amtlZG9sZmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTgwOTMsImV4cCI6MjA3NjU3NDA5M30.jPG-L6LJjAymBZSgh7C_A8sRz6Nc-fq3p7dCc_tJKxU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  try {
    // Test 1: Check if we can query the database
    console.log('📊 Test 1: Checking database connection...')
    const { data: testData, error: tablesError } = await supabase
      .from('student_codes')
      .select('count')
      .limit(1)
    
    if (tablesError) {
      console.error('❌ Database connection failed:', tablesError.message)
      return
    }
    console.log('✅ Database connection successful!\n')

    // Test 2: Count student codes
    console.log('📊 Test 2: Counting student codes...')
    const { count, error: countError } = await supabase
      .from('student_codes')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Failed to count codes:', countError.message)
    } else {
      console.log(`✅ Found ${count} student codes\n`)
    }

    // Test 3: Get first 5 codes
    console.log('📊 Test 3: Fetching first 5 student codes...')
    const { data: codes, error: codesError } = await supabase
      .from('student_codes')
      .select('code, status, expires_at')
      .limit(5)
    
    if (codesError) {
      console.error('❌ Failed to fetch codes:', codesError.message)
    } else {
      console.log('✅ Student codes:')
      codes.forEach(code => {
        console.log(`   - ${code.code} (${code.status})`)
      })
      console.log('')
    }

    // Test 4: Check tables exist
    console.log('📊 Test 4: Checking if all tables exist...')
    const tables = [
      'user_profiles',
      'students', 
      'teachers',
      'parents',
      'student_codes',
      'admins',
      'classes',
      'subjects',
      'attendance',
      'grades'
    ]

    let allTablesExist = true
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`   ❌ Table '${table}' not accessible: ${error.message}`)
        allTablesExist = false
      } else {
        console.log(`   ✅ Table '${table}' exists`)
      }
    }

    if (allTablesExist) {
      console.log('\n✅ All tables are accessible!\n')
    } else {
      console.log('\n⚠️  Some tables are missing or not accessible\n')
    }

    // Test 5: Check user_profiles table
    console.log('📊 Test 5: Checking user_profiles...')
    const { count: profileCount, error: profileError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    if (profileError) {
      console.error('❌ Failed to count profiles:', profileError.message)
    } else {
      console.log(`✅ Found ${profileCount} user profiles\n`)
    }

    // Test 6: Check students table
    console.log('📊 Test 6: Checking students...')
    const { count: studentCount, error: studentError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
    
    if (studentError) {
      console.error('❌ Failed to count students:', studentError.message)
    } else {
      console.log(`✅ Found ${studentCount} students\n`)
    }

    console.log('🎉 All connection tests completed!\n')
    console.log('Summary:')
    console.log(`- Student Codes: ${count}`)
    console.log(`- User Profiles: ${profileCount}`)
    console.log(`- Students: ${studentCount}`)

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testConnection()
