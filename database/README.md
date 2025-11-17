# Database Setup Guide

## Quick Setup Instructions

### Step 1: Run the Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire content of `migrations/add_timetable_tables.sql`
4. Paste it into the SQL Editor
5. Click **Run**

### Step 2: Verify Tables

After running the migration, verify that the following tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subject_classes', 'student_enrollments', 'time_slots');
```

You should see:

- `subject_classes`
- `student_enrollments`
- `time_slots`

### Step 3: Test the System

1. **Create a Subject:**

   - Go to Admin Dashboard → Subjects tab
   - Click "Add Subject"
   - Fill in: Subject Name, Code, Credit Hours

2. **Create a Schedule:**

   - Go to Admin Dashboard → Timetable tab
   - Click "+ Create Schedule"
   - Fill in all required fields
   - Click "Check Conflicts" to validate
   - Click "Create Schedule"

3. **Student Enrollment:**
   - Student logs in
   - Goes to Dashboard
   - Clicks "Join New Class"
   - Enters the 6-character join code
   - Enrolls successfully

## Troubleshooting

### Error: "Could not find the table 'public.subject_classes'"

**Solution:** Run the migration script in Supabase SQL Editor.

### Error: "duplicate key value violates unique constraint"

**Solution:** The migration has already been run. Check if tables exist:

```sql
\dt subject_classes
```

### Error: "permission denied for table subject_classes"

**Solution:** Check RLS policies are enabled:

```sql
-- Run this in SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('subject_classes', 'student_enrollments', 'time_slots');
```

All should show `rowsecurity = true`.

## Database Schema

### subject_classes

Stores timetable schedules with subjects, teachers, times, and join codes.

**Key Columns:**

- `join_code` - Unique 6-character code for student enrollment
- `day_of_week` - Monday, Tuesday, Wednesday, etc.
- `start_time` / `end_time` - Class timing
- `capacity` - Maximum students allowed
- `section` - Class section (M1, A2, E3, etc.)

### student_enrollments

Tracks which students are enrolled in which subject classes.

**Key Columns:**

- `student_id` - References students table
- `subject_class_id` - References subject_classes table
- `enrollment_method` - 'admin' or 'self-join'
- `enrollment_status` - 'active', 'dropped', etc.

### time_slots

Predefined time periods for scheduling (optional, for reference).

## Sample Queries

### Get all schedules for a specific day:

```sql
SELECT * FROM v_subject_classes_detailed
WHERE day_of_week = 'Monday'
AND academic_year = '2024-2025'
ORDER BY start_time;
```

### Get student's enrolled classes:

```sql
SELECT * FROM v_student_enrollments_detailed
WHERE student_id = 'your-student-id'
AND enrollment_status = 'active';
```

### Check for scheduling conflicts:

```sql
SELECT sc1.*, sc2.*
FROM subject_classes sc1
JOIN subject_classes sc2 ON sc1.id != sc2.id
WHERE sc1.teacher_id = sc2.teacher_id
AND sc1.day_of_week = sc2.day_of_week
AND sc1.academic_year = sc2.academic_year
AND (
  (sc1.start_time, sc1.end_time) OVERLAPS (sc2.start_time, sc2.end_time)
);
```

## Migration History

| Date       | Version | Description                       |
| ---------- | ------- | --------------------------------- |
| 2025-11-17 | 1.0     | Initial timetable tables creation |

## Support

If you encounter issues:

1. Check Supabase logs in the Dashboard
2. Verify RLS policies are correctly set
3. Ensure all referenced tables (subjects, teachers, students) exist
4. Check that the `uuid-ossp` extension is enabled
