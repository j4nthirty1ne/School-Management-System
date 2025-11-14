// Script to create a super admin from existing admin or create a new one
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

async function createSuperAdmin() {
  console.log('\n=== Creating Super Admin ===\n')

  // First, run the SQL to add super_admin to enum
  console.log('⚠️  IMPORTANT: Before running this script, make sure you have run the SQL migration:')
  console.log('   File: backend/database/add_super_admin_role.sql')
  console.log('   Run it in your Supabase SQL Editor\n')

  const proceed = true // Set to true after running the SQL migration

  if (!proceed) {
    console.log('❌ Please run the SQL migration first!')
    return
  }

  // Option 1: Convert existing admin to super admin
  console.log('📋 Fetching existing admins...\n')
  const { data: admins, error: fetchError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, email, role')
    .eq('role', 'admin')
    .limit(5)

  if (fetchError) {
    console.error('❌ Error fetching admins:', fetchError.message)
    return
  }

  if (admins && admins.length > 0) {
    console.log('Found existing admins:')
    admins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.first_name} ${admin.last_name} (ID: ${admin.id})`)
    })

    // Convert the first admin to super admin
    const adminToConvert = admins[0]
    console.log(`\n🔄 Converting ${adminToConvert.first_name} ${adminToConvert.last_name} to Super Admin...`)

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'super_admin' })
      .eq('id', adminToConvert.id)

    if (updateError) {
      console.error('❌ Error updating admin:', updateError.message)
      return
    }

    console.log('✅ Successfully converted to Super Admin!')
    console.log(`\n📧 Login credentials:`)
    console.log(`   Email: (check your database for this user's email)`)
    console.log(`   Role: super_admin`)
    console.log(`   Dashboard: /super-admin/dashboard`)
  } else {
    // Option 2: Create new super admin
    console.log('⚠️  No existing admins found. Creating new super admin...\n')

    const superAdminData = {
      email: 'superadmin@school.com',
      password: 'SuperAdmin123!',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '0999999999'
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: superAdminData.email,
      password: superAdminData.password,
      email_confirm: true,
      user_metadata: {
        first_name: superAdminData.firstName,
        last_name: superAdminData.lastName,
      }
    })

    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message)
      return
    }

    const userId = authUser.user.id

    // Create user_profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        role: 'super_admin',
        first_name: superAdminData.firstName,
        last_name: superAdminData.lastName,
        phone: superAdminData.phone,
        is_active: true,
      })

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message)
      return
    }

    // Create admin record
    const { error: adminError } = await supabase
      .from('admins')
      .insert({
        user_id: userId,
        department: 'System Administration',
      })

    if (adminError) {
      console.error('❌ Failed to create admin record:', adminError.message)
      return
    }

    console.log('✅ Super Admin created successfully!')
    console.log(`\n📧 Login credentials:`)
    console.log(`   Email: ${superAdminData.email}`)
    console.log(`   Password: ${superAdminData.password}`)
    console.log(`   Role: super_admin`)
    console.log(`   Dashboard: /super-admin/dashboard`)
  }

  console.log('\n🎉 Super Admin setup complete!')
  console.log('🔄 You can now login and access the super admin dashboard')
}

createSuperAdmin()
