-- Create student_class_enrollments table to allow students to join multiple classes
CREATE TABLE IF NOT EXISTS student_class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active',
  UNIQUE(student_id, class_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_class_enrollments_student ON student_class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_class_enrollments_class ON student_class_enrollments(class_id);

-- Check the created table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'student_class_enrollments'
ORDER BY ordinal_position;
