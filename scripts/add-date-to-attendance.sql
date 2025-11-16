-- Add missing date column to attendance table
-- This column is required for tracking when attendance was marked

ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Update the unique constraint to include date
-- First drop the old constraint if it exists
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_class_id_date_key;

-- Add new unique constraint
ALTER TABLE attendance
ADD CONSTRAINT attendance_student_id_class_id_date_key 
UNIQUE (student_id, class_id, date);

COMMENT ON COLUMN attendance.date IS 'Date when attendance was marked';
