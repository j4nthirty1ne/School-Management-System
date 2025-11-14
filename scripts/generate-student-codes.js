// Script to generate student registration codes
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

async function generateStudentCodes() {
  console.log('\n=== Generating Student Registration Codes ===\n')

  const numberOfCodes = 50 // Generate 50 codes
  const codes = []

  for (let i = 1; i <= numberOfCodes; i++) {
    const code = `STU-2025-${String(i).padStart(4, '0')}`
    codes.push({
      code: code,
      status: 'available',
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
    })
  }

  console.log(`📝 Inserting ${numberOfCodes} student codes...`)

  const { data, error } = await supabase
    .from('student_codes')
    .insert(codes)
    .select()

  if (error) {
    console.error('❌ Error:', error.message)
    
    // If error is about duplicate codes, that's okay
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      console.log('⚠️  Some codes already exist, that\'s fine!')
      console.log('✅ Existing codes can still be used for registration')
    }
    return
  }

  console.log(`✅ Successfully generated ${data?.length || 0} student codes!`)
  
  // Show first 10 codes
  console.log('\n📋 Sample codes you can use for registration:')
  const { data: sampleCodes } = await supabase
    .from('student_codes')
    .select('code, status')
    .eq('status', 'available')
    .limit(10)

  if (sampleCodes) {
    sampleCodes.forEach((sc, index) => {
      console.log(`   ${index + 1}. ${sc.code}`)
    })
  }

  console.log('\n💡 Students can use these codes to register at:')
  console.log('   http://localhost:3000/register-user')
}

generateStudentCodes()
