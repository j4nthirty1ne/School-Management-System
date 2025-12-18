const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "../frontend/.env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createClassStudentsTable() {
  console.log("Creating class_students table...");

  // Create the table using SQL
  const { data, error } = await supabase.rpc("exec_sql", {
    sql: `
      -- Create class_students junction table for many-to-many relationship
      CREATE TABLE IF NOT EXISTS public.class_students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
        enrolled_at TIMESTAMPTZ DEFAULT NOW(),
        dropped_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(student_id, class_id)
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON public.class_students(student_id);
      CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON public.class_students(class_id);
      CREATE INDEX IF NOT EXISTS idx_class_students_status ON public.class_students(status);

      -- Enable Row Level Security
      ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.class_students;
      CREATE POLICY "Allow all operations for authenticated users"
        ON public.class_students
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

      -- Create trigger for updated_at
      CREATE OR REPLACE FUNCTION update_class_students_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_class_students_updated_at ON public.class_students;
      CREATE TRIGGER set_class_students_updated_at
        BEFORE UPDATE ON public.class_students
        FOR EACH ROW
        EXECUTE FUNCTION update_class_students_updated_at();
    `,
  });

  if (error) {
    // If rpc doesn't exist, try direct SQL execution
    console.log("Attempting direct SQL execution...");

    const queries = [
      `
      CREATE TABLE IF NOT EXISTS public.class_students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
        enrolled_at TIMESTAMPTZ DEFAULT NOW(),
        dropped_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(student_id, class_id)
      );
      `,
      `CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON public.class_students(student_id);`,
      `CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON public.class_students(class_id);`,
      `CREATE INDEX IF NOT EXISTS idx_class_students_status ON public.class_students(status);`,
      `ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;`,
      `
      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.class_students;
      CREATE POLICY "Allow all operations for authenticated users"
        ON public.class_students
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
      `,
    ];

    for (const query of queries) {
      const { error: execError } = await supabase.from("_sql").select(query);
      if (execError) {
        console.error("SQL execution error:", execError);
      }
    }

    console.log("\n⚠️  Could not execute SQL automatically.");
    console.log(
      "\n📋 Please run this SQL manually in your Supabase SQL Editor:\n"
    );
    console.log("------------------------------------------------------------");
    console.log(`
-- Create class_students junction table
CREATE TABLE IF NOT EXISTS public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  dropped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON public.class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON public.class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_status ON public.class_students(status);

-- Enable RLS
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.class_students;
CREATE POLICY "Allow all operations for authenticated users"
  ON public.class_students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_class_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_class_students_updated_at ON public.class_students;
CREATE TRIGGER set_class_students_updated_at
  BEFORE UPDATE ON public.class_students
  FOR EACH ROW
  EXECUTE FUNCTION update_class_students_updated_at();
    `);
    console.log(
      "------------------------------------------------------------\n"
    );
    console.log(
      "After running the SQL, the enrollment system will work correctly.\n"
    );
  } else {
    console.log("✅ class_students table created successfully!");
  }
}

createClassStudentsTable()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
