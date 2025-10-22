-- =============================================
-- SUPABASE DATABASE SCHEMA DEPLOYMENT (CLEAN VERSION)
-- School Management System
-- This version handles existing objects
-- =============================================

-- Section 1: Drop existing objects if they exist (in reverse dependency order)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all codes" ON public.student_codes;
DROP POLICY IF EXISTS "Admins can manage codes" ON public.student_codes;
DROP POLICY IF EXISTS "Teachers can view students" ON public.students;
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Parents can view own record" ON public.parents;
DROP POLICY IF EXISTS "Admins can manage parents" ON public.parents;
DROP POLICY IF EXISTS "Teachers can view classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage grades" ON public.grades;
DROP POLICY IF EXISTS "Students can view own grades" ON public.grades;
DROP POLICY IF EXISTS "Admins can manage all grades" ON public.grades;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
DROP TRIGGER IF EXISTS update_teachers_updated_at ON public.teachers;
DROP TRIGGER IF EXISTS update_parents_updated_at ON public.parents;
DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
DROP TRIGGER IF EXISTS update_subjects_updated_at ON public.subjects;
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
DROP TRIGGER IF EXISTS update_grades_updated_at ON public.grades;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
DROP TRIGGER IF EXISTS mark_student_code_as_used ON public.students;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS mark_code_as_used() CASCADE;
DROP FUNCTION IF EXISTS get_student_gpa(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_class_average(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_attendance_percentage(UUID, UUID) CASCADE;

DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.class_subjects CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.parent_student_links CASCADE;
DROP TABLE IF EXISTS public.parents CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.student_codes CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

DROP TYPE IF EXISTS grade_type CASCADE;
DROP TYPE IF EXISTS relationship_type CASCADE;
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS teacher_status CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS code_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Section 2: Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Section 3: Create ENUM Types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE code_status AS ENUM ('available', 'used', 'expired');
CREATE TYPE enrollment_status AS ENUM ('active', 'graduated', 'transferred', 'suspended', 'pending');
CREATE TYPE teacher_status AS ENUM ('active', 'inactive', 'on_leave');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian', 'other');
CREATE TYPE grade_type AS ENUM ('quiz', 'assignment', 'midterm', 'final', 'project');

-- Section 4: Create Tables
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admins_user_id ON admins(user_id);

CREATE TABLE public.student_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  status code_status DEFAULT 'available',
  generated_by UUID REFERENCES admins(id),
  used_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_student_codes_code ON student_codes(code);
CREATE INDEX idx_student_codes_status ON student_codes(status);

CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  teacher_code VARCHAR(50) UNIQUE NOT NULL,
  specialization VARCHAR(100),
  hire_date DATE NOT NULL,
  status teacher_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_code ON teachers(teacher_code);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  student_code VARCHAR(50) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender_type NOT NULL,
  address TEXT,
  class_id UUID,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  enrollment_status enrollment_status DEFAULT 'pending',
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  medical_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_code ON students(student_code);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_status ON students(enrollment_status);

CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  occupation VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_parents_user_id ON parents(user_id);

CREATE TABLE public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  relationship relationship_type NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

CREATE INDEX idx_parent_student_parent ON parent_student_links(parent_id);
CREATE INDEX idx_parent_student_student ON parent_student_links(student_id);

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_code VARCHAR(20) UNIQUE NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subjects_code ON subjects(subject_code);

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_code VARCHAR(20) UNIQUE NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  schedule VARCHAR(200),
  room VARCHAR(50),
  capacity INTEGER DEFAULT 30,
  semester VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_classes_code ON classes(class_code);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_semester ON classes(semester);

CREATE TABLE public.class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, subject_id)
);

CREATE INDEX idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_subject ON class_subjects(subject_id);

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  assessment_type grade_type NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 100,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS ((score / max_score) * 100) STORED,
  assessment_date DATE NOT NULL,
  notes TEXT,
  graded_by UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_class ON grades(class_id);
CREATE INDEX idx_grades_type ON grades(assessment_type);
CREATE INDEX idx_grades_date ON grades(assessment_date);

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  target_role user_role,
  is_urgent BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_announcements_author ON announcements(author_id);
CREATE INDEX idx_announcements_role ON announcements(target_role);
CREATE INDEX idx_announcements_published ON announcements(published_at);

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_points INTEGER DEFAULT 100,
  created_by UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- Section 5: Create Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_code_as_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_codes 
  SET status = 'used', used_by = NEW.user_id 
  WHERE code = NEW.student_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_student_gpa(student_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  gpa DECIMAL;
BEGIN
  SELECT AVG(percentage) INTO gpa
  FROM grades
  WHERE student_id = student_uuid;
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_class_average(class_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  class_avg DECIMAL;
BEGIN
  SELECT AVG(percentage) INTO class_avg
  FROM grades
  WHERE class_id = class_uuid;
  RETURN class_avg;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_attendance_percentage(student_uuid UUID, class_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  attendance_pct DECIMAL;
BEGIN
  SELECT 
    (COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100
  INTO attendance_pct
  FROM attendance
  WHERE student_id = student_uuid AND class_id = class_uuid;
  RETURN COALESCE(attendance_pct, 0);
END;
$$ LANGUAGE plpgsql;

-- Section 6: Create Triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER mark_student_code_as_used AFTER INSERT ON students FOR EACH ROW EXECUTE FUNCTION mark_code_as_used();

-- Section 7: Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Section 8: Create RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view all codes" ON student_codes FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage codes" ON student_codes FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can view students" ON students FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "Students can view own record" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage students" ON students FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can view teachers" ON teachers FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "Teachers can view own record" ON teachers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage teachers" ON teachers FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Parents can view own record" ON parents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage parents" ON parents FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can view classes" ON classes FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "Students can view enrolled classes" ON classes FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND class_id = classes.id));
CREATE POLICY "Admins can manage classes" ON classes FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can manage attendance" ON attendance FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = attendance.student_id));
CREATE POLICY "Admins can view all attendance" ON attendance FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can manage grades" ON grades FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));
CREATE POLICY "Students can view own grades" ON grades FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = grades.student_id));
CREATE POLICY "Admins can manage all grades" ON grades FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Section 9: Generate Sample Student Codes (100 codes)
INSERT INTO student_codes (code, status, expires_at)
SELECT 
  'STU-2025-' || LPAD(generate_series::TEXT, 5, '0'),
  'available',
  NOW() + INTERVAL '90 days'
FROM generate_series(1, 100);
