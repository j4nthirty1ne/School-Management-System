# Database Migration Instructions

## Update Assignments Table for Assignment/Quiz Form

This migration updates the `assignments` table to support the new assignment/quiz creation form with file upload capabilities.

### What's Changed

The updated `assignments` table now includes:

- `class_id` - Reference to the class
- `title` - Assignment/quiz title
- `description` - Optional description
- `type` - Type of assignment (assignment, quiz, homework, project)
- `due_date` - Due date for submission
- `max_score` - Maximum score (default: 100)
- `instructions` - Optional instructions for students
- `file_url` - URL of uploaded file (PDF, DOC, etc.)
- `file_name` - Name of uploaded file
- `status` - Status (active, archived, draft)
- `created_by` - Teacher who created it

### Bonus: Assignment Submissions Table

Also creates an `assignment_submissions` table where students can submit their work:

- Students can upload files or text
- Teachers can grade submissions
- Tracks submission status (submitted, graded, late, missing)

## How to Apply This Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**

   - URL: https://app.supabase.com/project/YOUR_PROJECT_ID

2. **Navigate to SQL Editor**

   - Click on "SQL Editor" in the left sidebar

3. **Run the migration**

   - Copy the entire contents of `update_assignments_table.sql`
   - Paste into the SQL Editor
   - Click "Run" button

4. **Verify the changes**
   - Go to "Table Editor"
   - Check that `assignments` table has all the new columns
   - Check that `assignment_submissions` table was created

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the frontend directory
cd frontend

# Run the migration
npx supabase db push

# Or if you have supabase CLI installed
supabase db push
```

### Option 3: Manual Update via psql

If you have direct database access:

```bash
psql -h your-db-host -U postgres -d postgres -f lib/backend/database/migrations/update_assignments_table.sql
```

## Verification

After running the migration, verify by running this query in SQL Editor:

```sql
-- Check assignments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assignments'
ORDER BY ordinal_position;

-- Check assignment_submissions table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assignment_submissions'
ORDER BY ordinal_position;
```

## What to Expect

### Assignments Table Columns:

- ✅ id (uuid)
- ✅ class_id (uuid, nullable)
- ✅ title (varchar)
- ✅ description (text, nullable)
- ✅ type (varchar)
- ✅ due_date (date, nullable)
- ✅ max_score (integer)
- ✅ instructions (text, nullable)
- ✅ file_url (text, nullable)
- ✅ file_name (varchar, nullable)
- ✅ status (varchar)
- ✅ created_by (uuid, nullable)
- ✅ created_at (timestamp)
- ✅ updated_at (timestamp)

### Assignment Submissions Table Columns:

- ✅ id (uuid)
- ✅ assignment_id (uuid)
- ✅ student_id (uuid)
- ✅ submission_text (text, nullable)
- ✅ file_url (text, nullable)
- ✅ file_name (varchar, nullable)
- ✅ submitted_at (timestamp)
- ✅ grade (decimal, nullable)
- ✅ feedback (text, nullable)
- ✅ graded_by (uuid, nullable)
- ✅ graded_at (timestamp, nullable)
- ✅ status (varchar)
- ✅ created_at (timestamp)
- ✅ updated_at (timestamp)

## Security (RLS Policies)

The migration automatically sets up Row Level Security:

### For Assignments:

- ✅ Teachers can create/edit assignments for their classes
- ✅ Students can view assignments for their classes
- ✅ Parents can view assignments for their children's classes
- ✅ Admins can manage all assignments

### For Assignment Submissions:

- ✅ Students can submit and view their own work
- ✅ Teachers can view and grade submissions for their classes
- ✅ Parents can view their children's submissions
- ✅ Admins can manage all submissions

## Rollback (If Needed)

If you need to revert this migration:

```sql
-- Drop the new tables
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;

-- Restore the old assignments table (if you have a backup)
-- ... restore from backup ...
```

## Troubleshooting

### Error: "relation 'assignments' already exists"

The migration script drops the old table first. If you get this error, the old table structure might still be in use. You can manually drop it:

```sql
DROP TABLE IF EXISTS public.assignments CASCADE;
```

Then re-run the migration.

### Error: "function update_updated_at_column() does not exist"

Make sure you've run the main schema.sql first, which creates this function.

### Error: "permission denied"

Make sure you're logged in as a database admin or the Supabase service role.

## Next Steps

After successful migration:

1. ✅ Test creating an assignment from the Teacher Dashboard
2. ✅ Upload a PDF file to verify file upload works
3. ✅ Verify data is stored correctly in the database
4. ✅ Check that students can view assignments (implement student view later)

## Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify all RLS policies are created
3. Ensure indexes are created for performance
4. Check that triggers are working for updated_at

---

**Migration File:** `lib/backend/database/migrations/update_assignments_table.sql`  
**Schema File:** `lib/backend/database/schema.sql` (updated)  
**Version:** 1.1  
**Date:** November 15, 2025
