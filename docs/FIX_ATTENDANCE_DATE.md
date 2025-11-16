# Fix: Attendance Date Column Missing

## Problem

Error: `Could not find the 'date' column of 'attendance' in the schema cache`

Teachers cannot mark attendance because the `date` column is missing from the attendance table.

## Solution

### Step 1: Add the Date Column

Go to your **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Add missing date column to attendance table
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Update the unique constraint to include date
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_class_id_date_key;

ALTER TABLE attendance
ADD CONSTRAINT attendance_student_id_class_id_date_key
UNIQUE (student_id, class_id, date);
```

**Or** run the script: `scripts/add-date-to-attendance.sql`

### Step 2: Verify Column Added

Run this query to check:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'attendance'
ORDER BY ordinal_position;
```

You should see the `date` column with type `date`.

### Step 3: Test Attendance Marking

After adding the column, the attendance feature will work:

1. Open teacher dashboard
2. Click "Mark Attendance"
3. Select a class
4. Mark students as Present/Absent/Late/Excused
5. Click "Submit Attendance"

## What This Fixes

✅ Teachers can mark daily attendance  
✅ Attendance records are tracked by date  
✅ Prevents duplicate entries for same student/class/date  
✅ Enables attendance history and reports

## Database Schema

The attendance table now has:

- `id` - Primary key
- `student_id` - Foreign key to students
- `class_id` - Foreign key to classes
- `date` - Date of attendance (NEW)
- `status` - present/absent/late/excused
- `remarks` - Optional notes
- `marked_by` - Teacher who marked attendance
- `created_at`, `updated_at` - Timestamps

## Related Files

- **API Endpoint**: `frontend/app/api/attendance/route.ts`
- **SQL Script**: `scripts/add-date-to-attendance.sql`
