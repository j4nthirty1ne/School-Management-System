// Script to create teacher records for existing teacher users
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

async function createTeacherRecords() {
  console.log('\n=== Creating Teacher Records ===\n')

  // 1. Get all user_profiles with role='teacher'
  const { data: teacherProfiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, phone')
    .eq('role', 'teacher')

  if (profileError) {
    console.error('❌ Error fetching teacher profiles:', profileError.message)
    return
  }

  console.log(`📊 Found ${teacherProfiles?.length || 0} teacher user profiles`)

  if (!teacherProfiles || teacherProfiles.length === 0) {
    console.log('⚠️ No teacher profiles found')
    return
  }

  // 2. Check which teachers already have records
  const { data: existingTeachers, error: existingError } = await supabase
    .from('teachers')
    .select('user_id')

  const existingUserIds = new Set(existingTeachers?.map(t => t.user_id) || [])

  // 3. Create teacher records for those who don't have them
  let created = 0
  for (let i = 0; i < teacherProfiles.length; i++) {
    const profile = teacherProfiles[i]
    
    if (existingUserIds.has(profile.id)) {
      console.log(`⏭️ Skipping ${profile.first_name} ${profile.last_name} - already has teacher record`)
      continue
    }

    const teacherCode = `TCH-2025-${String(created + 1).padStart(3, '0')}`
    
    const { error: insertError } = await supabase
      .from('teachers')
      .insert({
        user_id: profile.id,
        teacher_code: teacherCode,
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
      })

    if (insertError) {
      console.error(`❌ Failed to create teacher record for ${profile.first_name}: ${insertError.message}`)
    } else {
      console.log(`✅ Created teacher record: ${profile.first_name} ${profile.last_name} (${teacherCode})`)
      created++
    }
  }

  console.log(`\n📊 Summary: Created ${created} new teacher records`)

  // Verify
  const { data: finalTeachers } = await supabase
    .from('teachers')
    .select('id, teacher_code')

  console.log(`✅ Total teachers in database now: ${finalTeachers?.length || 0}`)
}

createTeacherRecords()
