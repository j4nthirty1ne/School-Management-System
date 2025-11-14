-- Schema Updates for Proper Class Management System
-- This file contains the necessary updates to align the database with the workflow

-- ============================================
-- 1. CREATE TIMETABLE MANAGEMENT TABLES
-- ============================================

-- Time slots for scheduling
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week VARCHAR(10) NOT NULL, -- Monday, Tuesday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_of_week, start_time, end_time, academic_year)
);

CREATE INDEX idx_time_slots_day ON time_slots(day_of_week);
CREATE INDEX idx_time_slots_year ON time_slots(academic_year);

-- ============================================
-- 2. UPDATE CLASSES TABLE STRUCTURE
-- ============================================

-- The 'classes' table should represent homeroom/grade classes (e.g., "ITE Year 3", "CS Year 2")
-- Add a description to clarify this is for student groupings, not individual subjects
COMMENT ON TABLE classes IS 'Represents student homeroom/grade level groupings (e.g., ITE Year 3, CS Year 2). Not individual subject classes.';

-- Add join code for classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_code VARCHAR(20) UNIQUE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_type VARCHAR(50) DEFAULT 'regular'; -- regular, special, honors, etc.

-- ============================================
-- 3. CREATE SUBJECT CLASS OFFERINGS TABLE
-- ============================================

-- This represents actual subject classes that students attend
-- For example: "Math M1 Lecture - Monday 7-8 AM - Room 301"
CREATE TABLE IF NOT EXISTS public.subject_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  
  -- Scheduling details
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL,
  day_of_week VARCHAR(10) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Location and capacity
  room_number VARCHAR(20) NOT NULL,
  capacity INTEGER DEFAULT 30,
  
  -- Class details
  class_type VARCHAR(50) DEFAULT 'lecture', -- lecture, practice, lab, tutorial
  section VARCHAR(10), -- M1, M2, etc.
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(20), -- Fall, Spring, Summer, 1st Semester, 2nd Semester
  
  -- Join code for students
  join_code VARCHAR(20) UNIQUE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(subject_id, day_of_week, start_time, room_number, academic_year, semester)
);

CREATE INDEX idx_subject_classes_subject ON subject_classes(subject_id);
CREATE INDEX idx_subject_classes_teacher ON subject_classes(teacher_id);
CREATE INDEX idx_subject_classes_time_slot ON subject_classes(time_slot_id);
CREATE INDEX idx_subject_classes_day ON subject_classes(day_of_week);
CREATE INDEX idx_subject_classes_year ON subject_classes(academic_year);
CREATE INDEX idx_subject_classes_join_code ON subject_classes(join_code);

COMMENT ON TABLE subject_classes IS 'Represents actual subject class offerings that students can enroll in (e.g., Math M1 Lecture Monday 7-8 AM Room 301)';

-- ============================================
-- 4. CREATE STUDENT ENROLLMENT TABLE
-- ============================================

-- Tracks which students are enrolled in which subject classes
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_class_id UUID REFERENCES subject_classes(id) ON DELETE CASCADE NOT NULL,
  
  -- Enrollment details
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrollment_method VARCHAR(20) DEFAULT 'admin', -- admin, self-join, automatic
  enrollment_status VARCHAR(20) DEFAULT 'active', -- active, dropped, completed
  
  -- Grades and performance
  final_grade DECIMAL(5,2),
  grade_letter VARCHAR(2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, subject_class_id)
);

CREATE INDEX idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_class ON student_enrollments(subject_class_id);
CREATE INDEX idx_student_enrollments_status ON student_enrollments(enrollment_status);

COMMENT ON TABLE student_enrollments IS 'Tracks student enrollment in subject classes';

-- ============================================
-- 5. UPDATE ATTENDANCE TABLE
-- ============================================

-- Update attendance to reference subject_classes instead of classes
-- First, create new column
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS subject_class_id UUID REFERENCES subject_classes(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_attendance_subject_class ON attendance(subject_class_id);

COMMENT ON COLUMN attendance.class_id IS 'DEPRECATED: Use subject_class_id instead. This references homeroom class.';
COMMENT ON COLUMN attendance.subject_class_id IS 'References the actual subject class session';

-- ============================================
-- 6. UPDATE GRADES TABLE
-- ============================================

-- Update grades to reference subject_classes
ALTER TABLE grades ADD COLUMN IF NOT EXISTS subject_class_id UUID REFERENCES subject_classes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_grades_subject_class ON grades(subject_class_id);

COMMENT ON COLUMN grades.class_id IS 'DEPRECATED: Use subject_class_id instead. This references homeroom class.';
COMMENT ON COLUMN grades.subject_class_id IS 'References the actual subject class';

-- ============================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================

-- Generate unique join code for subject classes
CREATE OR REPLACE FUNCTION generate_subject_class_join_code()
RETURNS VARCHAR AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Avoid confusing characters like 0, O, 1, I
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  
  -- Check if code exists, regenerate if it does
  WHILE EXISTS (SELECT 1 FROM subject_classes WHERE join_code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CREATE TRIGGERS
-- ============================================

-- Update triggers for new tables
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_classes_updated_at BEFORE UPDATE ON subject_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_enrollments_updated_at BEFORE UPDATE ON student_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. CREATE VIEWS FOR CONVENIENCE
-- ============================================

-- View for complete subject class information
CREATE OR REPLACE VIEW v_subject_classes_detailed AS
SELECT 
  sc.id,
  sc.join_code,
  sc.day_of_week,
  sc.start_time,
  sc.end_time,
  sc.room_number,
  sc.capacity,
  sc.class_type,
  sc.section,
  sc.academic_year,
  sc.semester,
  sc.is_active,
  
  -- Subject info
  s.subject_name,
  s.subject_code,
  s.credit_hours,
  
  -- Teacher info
  t.id as teacher_id,
  up_t.first_name || ' ' || up_t.last_name as teacher_name,
  t.teacher_code,
  
  -- Enrollment count
  (SELECT COUNT(*) FROM student_enrollments se 
   WHERE se.subject_class_id = sc.id AND se.enrollment_status = 'active') as enrolled_count,
  
  sc.created_at,
  sc.updated_at
FROM subject_classes sc
JOIN subjects s ON s.id = sc.subject_id
LEFT JOIN teachers t ON t.id = sc.teacher_id
LEFT JOIN user_profiles up_t ON up_t.id = t.user_id;

-- View for student enrollments with details
CREATE OR REPLACE VIEW v_student_enrollments_detailed AS
SELECT 
  se.id,
  se.enrollment_status,
  se.enrolled_at,
  se.final_grade,
  se.grade_letter,
  
  -- Student info
  s.student_code,
  up_s.first_name || ' ' || up_s.last_name as student_name,
  up_s.id as user_id,
  
  -- Subject class info
  sc.join_code,
  sc.day_of_week,
  sc.start_time,
  sc.end_time,
  sc.room_number,
  sc.section,
  
  -- Subject info
  subj.subject_name,
  subj.subject_code,
  
  -- Teacher info
  up_t.first_name || ' ' || up_t.last_name as teacher_name
  
FROM student_enrollments se
JOIN students s ON s.id = se.student_id
JOIN user_profiles up_s ON up_s.id = s.user_id
JOIN subject_classes sc ON sc.id = se.subject_class_id
JOIN subjects subj ON subj.id = sc.subject_id
LEFT JOIN teachers t ON t.id = sc.teacher_id
LEFT JOIN user_profiles up_t ON up_t.id = t.user_id;

-- ============================================
-- 10. SAMPLE DATA (For Testing)
-- ============================================

-- Insert sample time slots
INSERT INTO time_slots (day_of_week, start_time, end_time, academic_year) VALUES
('Monday', '07:00', '08:00', '2024-2025'),
('Monday', '08:00', '09:00', '2024-2025'),
('Monday', '09:00', '10:00', '2024-2025'),
('Monday', '10:00', '11:00', '2024-2025'),
('Tuesday', '07:00', '08:00', '2024-2025'),
('Tuesday', '08:00', '09:00', '2024-2025'),
('Wednesday', '07:00', '08:00', '2024-2025'),
('Wednesday', '08:00', '09:00', '2024-2025'),
('Thursday', '07:00', '08:00', '2024-2025'),
('Thursday', '08:00', '09:00', '2024-2025'),
('Friday', '07:00', '08:00', '2024-2025'),
('Friday', '08:00', '09:00', '2024-2025')
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- IMPORTANT: This schema update introduces new tables while keeping old ones for backward compatibility
-- 
-- Migration Path:
-- 1. Run this script to create new tables
-- 2. Migrate existing data from old structure to new structure
-- 3. Update all API endpoints to use new tables
-- 4. Update frontend to use new workflow
-- 5. Eventually deprecate old columns/tables
--
-- Old Structure:
-- - classes table was used for both homeroom and subject classes (CONFUSING)
-- - No distinction between grade-level classes and subject offerings
-- 
-- New Structure:
-- - classes table = homeroom/grade-level groupings (ITE Year 3, CS Year 2)
-- - subject_classes table = actual subject offerings (Math M1 Lecture Monday 7-8 Room 301)
-- - student_enrollments table = tracks which students are in which subject classes
-- - time_slots table = master schedule of time periods
