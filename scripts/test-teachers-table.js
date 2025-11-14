// Test script to check teachers table structure
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

async function testTeachersTable() {
  console.log('\n=== Testing Teachers Table ===\n')

  // Test 1: Select all columns with wildcard
  console.log('Test 1: Select * from teachers')
  const { data: allData, error: allError } = await supabase
    .from('teachers')
    .select('*')
    .limit(1)

  if (allError) {
    console.error('❌ Error:', allError.message)
  } else {
    console.log('✅ Success! Found', allData?.length || 0, 'records')
    if (allData && allData.length > 0) {
      console.log('Columns:', Object.keys(allData[0]))
    }
  }

  // Test 2: Try without subject_specialization
  console.log('\nTest 2: Select without subject_specialization')
  const { data: basicData, error: basicError } = await supabase
    .from('teachers')
    .select('id, teacher_code, status')
    .limit(1)

  if (basicError) {
    console.error('❌ Error:', basicError.message)
  } else {
    console.log('✅ Success!')
  }

  // Test 3: Try with subject_specialization
  console.log('\nTest 3: Select WITH subject_specialization')
  const { data: specData, error: specError } = await supabase
    .from('teachers')
    .select('id, teacher_code, subject_specialization')
    .limit(1)

  if (specError) {
    console.error('❌ Error:', specError.message)
    console.error('This confirms the column does NOT exist in the database!')
  } else {
    console.log('✅ Success! Column exists')
  }

  // Test 4: Try the full query from the API
  console.log('\nTest 4: Full API query')
  const { data: fullData, error: fullError } = await supabase
    .from('teachers')
    .select(`
      id,
      teacher_code,
      subject_specialization,
      qualification,
      hire_date,
      status,
      created_at,
      user_profiles!inner (
        first_name,
        last_name,
        phone,
        id
      )
    `)
    .limit(1)

  if (fullError) {
    console.error('❌ Error:', fullError.message)
  } else {
    console.log('✅ Success!')
  }
}

testTeachersTable()
​