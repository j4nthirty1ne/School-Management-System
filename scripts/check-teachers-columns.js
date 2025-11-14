// Check actual teachers table columns
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

async function checkColumns() {
  console.log('\n=== Checking Teachers Table Structure ===\n')
  
  // Get a sample record to see columns
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('✅ Available columns in teachers table:')
    console.log(Object.keys(data[0]))
  } else {
    console.log('⚠️ No teachers found, but here are the columns from the schema:')
    // Try to infer from error messages by testing each column
    const testColumns = ['id', 'user_id', 'teacher_code', 'status', 'hire_date', 'created_at', 'updated_at']
    
    for (const col of testColumns) {
      const { error: testError } = await supabase
        .from('teachers')
        .select(col)
        .limit(1)
      
      if (!testError) {
        console.log(`  ✅ ${col}`)
      } else {
        console.log(`  ❌ ${col} - does not exist`)
      }
    }
  }
}

checkColumns()
