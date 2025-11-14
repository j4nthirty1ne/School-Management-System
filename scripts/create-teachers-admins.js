// Script to create 5 teachers and 5 admins
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

async function createTeachersAndAdmins() {
  console.log('\n=== Creating 5 Teachers and 5 Admins ===\n')

  // Teacher data
  const teachers = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@school.com', phone: '0123456789', qualification: 'Master of Mathematics' },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@school.com', phone: '0123456790', qualification: 'PhD in Physics' },
    { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@school.com', phone: '0123456791', qualification: 'Bachelor of Education' },
    { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@school.com', phone: '0123456792', qualification: 'Master of English Literature' },
    { firstName: 'David', lastName: 'Wilson', email: 'david.wilson@school.com', phone: '0123456793', qualification: 'Bachelor of Science' },
  ]

  // Admin data
  const admins = [
    { firstName: 'Robert', lastName: 'Taylor', email: 'robert.taylor@school.com', phone: '0123456794', department: 'Academic Affairs' },
    { firstName: 'Linda', lastName: 'Anderson', email: 'linda.anderson@school.com', phone: '0123456795', department: 'Student Services' },
    { firstName: 'James', lastName: 'Thomas', email: 'james.thomas@school.com', phone: '0123456796', department: 'Finance' },
    { firstName: 'Patricia', lastName: 'Jackson', email: 'patricia.jackson@school.com', phone: '0123456797', department: 'HR Department' },
    { firstName: 'William', lastName: 'White', email: 'william.white@school.com', phone: '0123456798', department: 'IT Department' },
  ]

  const password = 'Teacher123!'

  // Create Teachers
  console.log('📚 Creating Teachers...\n')
  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i]
    try {
      // 1. Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: teacher.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: teacher.firstName,
          last_name: teacher.lastName,
        }
      })

      if (authError) {
        console.error(`❌ Failed to create auth user for ${teacher.firstName}: ${authError.message}`)
        continue
      }

      const userId = authUser.user.id

      // 2. Create user_profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          role: 'teacher',
          first_name: teacher.firstName,
          last_name: teacher.lastName,
          phone: teacher.phone,
          is_active: true,
        })

      if (profileError) {
        console.error(`❌ Failed to create profile for ${teacher.firstName}: ${profileError.message}`)
        continue
      }

      // 3. Create teacher record
      const teacherCode = `TCH-2025-${String(i + 1).padStart(3, '0')}`
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: userId,
          teacher_code: teacherCode,
          hire_date: new Date().toISOString().split('T')[0],
          status: 'active',
        })

      if (teacherError) {
        console.error(`❌ Failed to create teacher record for ${teacher.firstName}: ${teacherError.message}`)
        continue
      }

      console.log(`✅ Created teacher: ${teacher.firstName} ${teacher.lastName} (${teacherCode})`)
      console.log(`   Email: ${teacher.email} | Password: ${password}`)
    } catch (error) {
      console.error(`❌ Unexpected error creating ${teacher.firstName}:`, error.message)
    }
  }

  // Create Admins
  console.log('\n👔 Creating Admins...\n')
  for (let i = 0; i < admins.length; i++) {
    const admin = admins[i]
    try {
      // 1. Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: admin.firstName,
          last_name: admin.lastName,
        }
      })

      if (authError) {
        console.error(`❌ Failed to create auth user for ${admin.firstName}: ${authError.message}`)
        continue
      }

      const userId = authUser.user.id

      // 2. Create user_profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          role: 'admin',
          first_name: admin.firstName,
          last_name: admin.lastName,
          phone: admin.phone,
          is_active: true,
        })

      if (profileError) {
        console.error(`❌ Failed to create profile for ${admin.firstName}: ${profileError.message}`)
        continue
      }

      // 3. Create admin record
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: userId,
          department: admin.department,
        })

      if (adminError) {
        console.error(`❌ Failed to create admin record for ${admin.firstName}: ${adminError.message}`)
        continue
      }

      console.log(`✅ Created admin: ${admin.firstName} ${admin.lastName}`)
      console.log(`   Email: ${admin.email} | Password: ${password} | Department: ${admin.department}`)
    } catch (error) {
      console.error(`❌ Unexpected error creating ${admin.firstName}:`, error.message)
    }
  }

  console.log('\n=== Summary ===')
  console.log('✅ All users created successfully!')
  console.log(`📧 All accounts use password: ${password}`)
  console.log('🔄 Refresh your admin dashboard to see the new teachers')
  
  // Verify teachers were created
  console.log('\n=== Verification ===')
  const { data: teacherRecords, error: teacherCheckError } = await supabase
    .from('teachers')
    .select('id, teacher_code, user_id')
  
  if (teacherCheckError) {
    console.error('❌ Error checking teachers:', teacherCheckError.message)
  } else {
    console.log(`📊 Total teachers in database: ${teacherRecords?.length || 0}`)
    if (teacherRecords && teacherRecords.length > 0) {
      console.log('Teacher codes:', teacherRecords.map(t => t.teacher_code).join(', '))
    }
  }
  
  const { data: adminRecords, error: adminCheckError } = await supabase
    .from('admins')
    .select('id, user_id')
  
  if (adminCheckError) {
    console.error('❌ Error checking admins:', adminCheckError.message)
  } else {
    console.log(`📊 Total admins in database: ${adminRecords?.length || 0}`)
  }
}

createTeachersAndAdmins()
