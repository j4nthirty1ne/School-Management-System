// Script to create a test student using Supabase service role
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file (same pattern as other scripts)
const envPath = path.join(__dirname, '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found in frontend folder. Please create and add Supabase keys.')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) envVars[key.trim()] = value.trim().replace(/['"]/g, '')
})

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

async function createTestStudent() {
  console.log('\n=== Creating Test Student ===\n')

  const timestamp = Date.now()
  const testEmail = `test-student-${timestamp}@example.com`
  const testPassword = `TestPass!${Math.floor(Math.random() * 9000) + 1000}`
  const firstName = 'Test'
  const lastName = `Student${String(timestamp).slice(-4)}`
  const phone = '0800000000'
  const studentCode = `STU-TEST-${String(timestamp).slice(-6)}`

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    })

    if (authError) {
      console.error('Failed to create auth user:', authError.message || authError)
      return
    }

    const userId = authData.user.id
    console.log('✅ Created auth user:', userId)

    // 2. Create user_profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        role: 'student',
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        is_active: true,
      })

    if (profileError) {
      console.error('Failed to create user_profile:', profileError.message || profileError)
      return
    }

    console.log('✅ Created user_profile for:', testEmail)

    // 3. Create students record (minimal fields so student can claim later)
    const { data: studentRow, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        student_code: studentCode,
        date_of_birth: '2000-01-01',
        gender: 'other',
        address: null,
        class_id: null,
        enrollment_date: new Date().toISOString(),
        enrollment_status: 'pending',
      })
      .select()
      .single()

    if (studentError) {
      console.error('Failed to create student record:', studentError.message || studentError)
      return
    }

    console.log('✅ Created student record:', studentRow.id)
    console.log('\nStudent creation summary:')
    console.log(' Email:', testEmail)
    console.log(' Password:', testPassword)
    console.log(' Student Code:', studentCode)
    console.log('\nYou can use the student code to test /api/students/verify-code or claim flow.')
    
    // 4. Fetch joined student + profile to show exactly what the API would return
    const { data: joined, error: joinedError } = await supabase
      .from('students')
      .select(`
        id,
        student_code,
        enrollment_status,
        date_of_birth,
        gender,
        address,
        class_id,
        user_profiles!inner (id, first_name, last_name, phone, email)
      `)
      .eq('id', studentRow.id)
      .single()

    if (joinedError) {
      console.error('Failed to fetch joined student:', joinedError.message || joinedError)
    } else {
      console.log('\nJoined student+profile (how /api/students/{id} will look):')
      console.log(JSON.stringify(joined, null, 2))
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createTestStudent()
