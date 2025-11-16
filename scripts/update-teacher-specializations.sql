-- Update existing teachers with subject specialization
-- Run this in Supabase SQL Editor or update via the Supabase dashboard

-- Update specific teachers (replace with your actual teacher_codes and values)
UPDATE teachers
SET subject_specialization = 'Mathematics'
WHERE teacher_code = 'TCH-2025-063279142';

UPDATE teachers
SET subject_specialization = 'Science'
WHERE teacher_code = 'TCH-2025-630721468';

UPDATE teachers
SET subject_specialization = 'English'
WHERE teacher_code = 'TCH-2025-063279143';

UPDATE teachers
SET subject_specialization = 'Computer Science'
WHERE teacher_code = 'TCH-2025-001';

-- OR update all teachers at once with a default value
-- UPDATE teachers
-- SET subject_specialization = 'General Education'
-- WHERE subject_specialization IS NULL;

-- To view all teachers and their current specializations:
SELECT 
  t.teacher_code,
  up.first_name || ' ' || up.last_name as teacher_name,
  t.subject_specialization,
  t.qualification
FROM teachers t
JOIN user_profiles up ON up.id = t.user_id
ORDER BY t.teacher_code;
