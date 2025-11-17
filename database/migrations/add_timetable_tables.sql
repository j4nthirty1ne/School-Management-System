-- Migration: Add Timetable Management Tables
-- Description: Creates subject_classes, student_enrollments, and time_slots tables for the timetable system
-- Date: 2025-11-17

-- ============================================
-- 1. Create ENUM Types for Timetable
-- ============================================

DO $$ BEGIN
  CREATE TYPE class_type AS ENUM ('lecture', 'practice', 'lab', 'tutorial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_method AS ENUM ('admin', 'self-join');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. Create Subject Classes Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.subject_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  class_type class_type DEFAULT 'lecture' NOT NULL,
  section VARCHAR(10) NOT NULL, -- e.g., M1, A2, E3
  academic_year VARCHAR(20) NOT NULL DEFAULT '2024-2025',
  semester VARCHAR(50),
  join_code VARCHAR(6) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subject_classes
CREATE INDEX IF NOT EXISTS idx_subject_classes_subject ON subject_classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_classes_teacher ON subject_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_classes_class ON subject_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_subject_classes_day ON subject_classes(day_of_week);
CREATE INDEX IF NOT EXISTS idx_subject_classes_year ON subject_classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_subject_classes_join_code ON subject_classes(join_code);
CREATE INDEX IF NOT EXISTS idx_subject_classes_active ON subject_classes(is_active);

-- ============================================
-- 3. Create Student Enrollments Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_class_id UUID REFERENCES subject_classes(id) ON DELETE CASCADE NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrollment_method enrollment_method DEFAULT 'admin',
  enrollment_status VARCHAR(20) DEFAULT 'active',
  grade DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_class_id)
);

-- Indexes for student_enrollments
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class ON student_enrollments(subject_class_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON student_enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_active ON student_enrollments(is_active);

-- ============================================
-- 4. Create Time Slots Table (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for time_slots
CREATE INDEX IF NOT EXISTS idx_time_slots_active ON time_slots(is_active);

-- ============================================
-- 5. Create Functions
-- ============================================

-- Function to generate join code for subject classes
CREATE OR REPLACE FUNCTION generate_subject_class_join_code()
RETURNS VARCHAR AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars (I,O,1,0)
  new_code VARCHAR(6);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := '';
    FOR i IN 1..6 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM subject_classes WHERE join_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Create Triggers
-- ============================================

-- Update timestamp trigger for subject_classes
DROP TRIGGER IF EXISTS update_subject_classes_updated_at ON subject_classes;
CREATE TRIGGER update_subject_classes_updated_at
BEFORE UPDATE ON subject_classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for student_enrollments
DROP TRIGGER IF EXISTS update_student_enrollments_updated_at ON student_enrollments;
CREATE TRIGGER update_student_enrollments_updated_at
BEFORE UPDATE ON student_enrollments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for time_slots
DROP TRIGGER IF EXISTS update_time_slots_updated_at ON time_slots;
CREATE TRIGGER update_time_slots_updated_at
BEFORE UPDATE ON time_slots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Create Views
-- ============================================

-- Detailed view for subject classes with subject and teacher info
CREATE OR REPLACE VIEW v_subject_classes_detailed AS
SELECT 
  sc.id,
  sc.subject_id,
  COALESCE(s.subject_name, 'Unknown Subject') as subject_name,
  COALESCE(s.subject_code, 'N/A') as subject_code,
  sc.teacher_id,
  COALESCE(CONCAT(up.first_name, ' ', up.last_name), 'Unassigned') as teacher_name,
  COALESCE(t.teacher_code, 'N/A') as teacher_code,
  sc.class_id,
  sc.day_of_week,
  sc.start_time,
  sc.end_time,
  sc.room_number,
  sc.class_type,
  sc.section,
  sc.academic_year,
  sc.semester,
  sc.join_code,
  sc.is_active,
  sc.created_at,
  sc.updated_at,
  (SELECT COUNT(*) FROM student_enrollments se 
   WHERE se.subject_class_id = sc.id AND se.is_active = true) as enrolled_count
FROM subject_classes sc
LEFT JOIN subjects s ON s.id = sc.subject_id
LEFT JOIN teachers t ON t.id = sc.teacher_id
LEFT JOIN user_profiles up ON up.id = t.user_id;

-- Detailed view for student enrollments
CREATE OR REPLACE VIEW v_student_enrollments_detailed AS
SELECT 
  se.id,
  se.student_id,
  CONCAT(up_student.first_name, ' ', up_student.last_name) as student_name,
  st.student_code,
  se.subject_class_id,
  sc.subject_id,
  s.subject_name,
  s.subject_code,
  sc.teacher_id,
  CONCAT(up_teacher.first_name, ' ', up_teacher.last_name) as teacher_name,
  sc.day_of_week,
  sc.start_time,
  sc.end_time,
  sc.room_number,
  sc.class_type,
  sc.section,
  sc.academic_year,
  sc.semester,
  sc.join_code,
  se.enrollment_date,
  se.enrollment_method,
  se.enrollment_status,
  se.grade,
  se.is_active,
  se.created_at as enrolled_at
FROM student_enrollments se
JOIN students st ON st.id = se.student_id
JOIN user_profiles up_student ON up_student.id = st.user_id
JOIN subject_classes sc ON sc.id = se.subject_class_id
LEFT JOIN subjects s ON s.id = sc.subject_id
LEFT JOIN teachers t ON t.id = sc.teacher_id
LEFT JOIN user_profiles up_teacher ON up_teacher.id = t.user_id;

-- ============================================
-- 8. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE subject_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Subject Classes Policies
DROP POLICY IF EXISTS "Anyone can view active subject classes" ON subject_classes;
CREATE POLICY "Anyone can view active subject classes"
ON subject_classes FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage subject classes" ON subject_classes;
CREATE POLICY "Admins can manage subject classes"
ON subject_classes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Teachers can view their subject classes" ON subject_classes;
CREATE POLICY "Teachers can view their subject classes"
ON subject_classes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    WHERE t.id = subject_classes.teacher_id
    AND t.user_id = auth.uid()
  )
);

-- Student Enrollments Policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON student_enrollments;
CREATE POLICY "Students can view own enrollments"
ON student_enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_enrollments.student_id
    AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can enroll via join code" ON student_enrollments;
CREATE POLICY "Students can enroll via join code"
ON student_enrollments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_enrollments.student_id
    AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can view class enrollments" ON student_enrollments;
CREATE POLICY "Teachers can view class enrollments"
ON student_enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subject_classes sc
    JOIN teachers t ON t.id = sc.teacher_id
    WHERE sc.id = student_enrollments.subject_class_id
    AND t.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all enrollments" ON student_enrollments;
CREATE POLICY "Admins can manage all enrollments"
ON student_enrollments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Time Slots Policies
DROP POLICY IF EXISTS "Anyone can view time slots" ON time_slots;
CREATE POLICY "Anyone can view time slots"
ON time_slots FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage time slots" ON time_slots;
CREATE POLICY "Admins can manage time slots"
ON time_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 9. Insert Default Time Slots (Optional)
-- ============================================

INSERT INTO time_slots (slot_name, start_time, end_time) VALUES
  ('Period 1', '07:00', '08:00'),
  ('Period 2', '08:00', '09:00'),
  ('Period 3', '09:00', '10:00'),
  ('Break', '10:00', '10:15'),
  ('Period 4', '10:15', '11:15'),
  ('Period 5', '11:15', '12:15'),
  ('Lunch', '12:15', '13:00'),
  ('Period 6', '13:00', '14:00'),
  ('Period 7', '14:00', '15:00'),
  ('Period 8', '15:00', '16:00')
ON CONFLICT DO NOTHING;

-- ============================================
-- Migration Complete
-- ============================================

-- Verify tables were created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('subject_classes', 'student_enrollments', 'time_slots');
  
  IF table_count = 3 THEN
    RAISE NOTICE 'Migration successful! All 3 tables created.';
  ELSE
    RAISE NOTICE 'Migration completed with % tables created.', table_count;
  END IF;
END $$;
