// Quick script to check what data exists in your Supabase tables
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/['"]/g, '')
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkData() {
  console.log('\n=== Checking Supabase Data ===\n')

  // Check user_profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, role, first_name, last_name, is_active')
    .limit(5)

  console.log('📊 User Profiles (first 5):')
  if (profilesError) {
    console.error('Error:', profilesError.message)
  } else {
    console.table(profiles)
    console.log(`Total in sample: ${profiles?.length || 0}`)
  }

  // Count by role
  const { data: roleCounts } = await supabase
    .from('user_profiles')
    .select('role')
  
  if (roleCounts) {
    const counts = roleCounts.reduce((acc, { role }) => {
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {})
    console.log('\n👥 Users by Role:')
    console.table(counts)
  }

  // Check students table
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, student_code, user_id, enrollment_status')
    .limit(5)

  console.log('\n🎓 Students Table (first 5):')
  if (studentsError) {
    console.error('Error:', studentsError.message)
  } else {
    console.table(students)
    console.log(`Total in sample: ${students?.length || 0}`)
  }

  // Check teachers table
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id, teacher_code, user_id, status')
    .limit(5)

  console.log('\n👨‍🏫 Teachers Table (first 5):')
  if (teachersError) {
    console.error('Error:', teachersError.message)
  } else {
    console.table(teachers)
    console.log(`Total in sample: ${teachers?.length || 0}`)
  }

  // Check parents table
  const { data: parents, error: parentsError } = await supabase
    .from('parents')
    .select('id, user_id')
    .limit(5)

  console.log('\n👪 Parents Table (first 5):')
  if (parentsError) {
    console.error('Error:', parentsError.message)
  } else {
    console.table(parents)
    console.log(`Total in sample: ${parents?.length || 0}`)
  }

  console.log('\n=== Summary ===')
  console.log('If you see users in user_profiles but 0 in students/teachers/parents,')
  console.log('it means those users exist but have no role-specific records.')
  console.log('You can create new students using the "Add Student" button in the admin dashboard.')
}

checkData()
