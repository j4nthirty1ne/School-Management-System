-- Add subject_specialization and qualification columns to teachers table
-- Run this in Supabase SQL Editor

-- Add subject_specialization column
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS subject_specialization VARCHAR(100);

-- Add qualification column
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS qualification VARCHAR(200);

-- Verify the columns were added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'teachers'
ORDER BY ordinal_position;
