# Supabase Database Schema

This file contains all SQL schemas for the School Management System.

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each section below and execute them in order

---

## 1. Enable UUID Extension

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 2. Create ENUM Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');

-- Student code status
CREATE TYPE code_status AS ENUM ('available', 'used', 'expired');

-- Enrollment status
CREATE TYPE enrollment_status AS ENUM ('active', 'graduated', 'transferred', 'suspended', 'pending');

-- Teacher status
CREATE TYPE teacher_status AS ENUM ('active', 'inactive', 'on_leave');

-- Attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- Gender
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

-- Relationship type
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian', 'other');

-- Grade type
CREATE TYPE grade_type AS ENUM ('quiz', 'assignment', 'midterm', 'final', 'project');
```

---

## 3. Create Tables

### 3.1 Users Table (Extended from Supabase Auth)

```sql
-- Extended user profiles table
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

-- Create index on role for faster queries
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
```

### 3.2 Admins Table

```sql
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
```

### 3.3 Student Codes Table

```sql
CREATE TABLE public.student_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  status code_status DEFAULT 'available',
  generated_by UUID REFERENCES admins(id),
  used_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE INDEX idx_student_codes_code ON student_codes(code);
CREATE INDEX idx_student_codes_status ON student_codes(status);
CREATE INDEX idx_student_codes_used_by ON student_codes(used_by);
```

### 3.4 Classes Table

```sql
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_name VARCHAR(50) NOT NULL,
  section VARCHAR(10) NOT NULL,
  grade_level INTEGER NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  room_number VARCHAR(20),
  capacity INTEGER DEFAULT 30,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_name, section, academic_year)
);

CREATE INDEX idx_classes_academic_year ON classes(academic_year);
CREATE INDEX idx_classes_active ON classes(is_active);
```

### 3.5 Teachers Table

```sql
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  teacher_code VARCHAR(50) UNIQUE NOT NULL,
  subject_specialization VARCHAR(100),
  qualification VARCHAR(200),
  hire_date DATE NOT NULL,
  status teacher_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_code ON teachers(teacher_code);
CREATE INDEX idx_teachers_status ON teachers(status);
```

### 3.6 Students Table

```sql
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  student_code VARCHAR(50) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender_type NOT NULL,
  address TEXT,
  class_id UUID REFERENCES classes(id),
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  enrollment_status enrollment_status DEFAULT 'active',
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
```

### 3.7 Parents Table

```sql
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  occupation VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_parents_user_id ON parents(user_id);
```

### 3.8 Parent-Student Link Table

```sql
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
```

### 3.9 Subjects Table

```sql
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  credit_hours INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subjects_code ON subjects(subject_code);
CREATE INDEX idx_subjects_active ON subjects(is_active);
```

### 3.10 Class-Subject Assignment Table

```sql
CREATE TABLE public.class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, subject_id, academic_year)
);

CREATE INDEX idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_subject ON class_subjects(subject_id);
CREATE INDEX idx_class_subjects_teacher ON class_subjects(teacher_id);
```

### 3.11 Attendance Table

```sql
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  marked_by UUID REFERENCES teachers(id) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
```

### 3.12 Grades Table

```sql
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  grade_type grade_type NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  total_marks DECIMAL(5,2) NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS ((marks_obtained / total_marks) * 100) STORED,
  grade_letter VARCHAR(2),
  exam_date DATE,
  remarks TEXT,
  entered_by UUID REFERENCES teachers(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_subject ON grades(subject_id);
CREATE INDEX idx_grades_class ON grades(class_id);
CREATE INDEX idx_grades_type ON grades(grade_type);
CREATE INDEX idx_grades_date ON grades(exam_date);
```

### 3.13 Announcements Table

```sql
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id) NOT NULL,
  target_role user_role[], -- Array of roles (e.g., ['student', 'parent'])
  class_id UUID REFERENCES classes(id), -- Optional: for class-specific announcements
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_announcements_created_by ON announcements(created_by);
CREATE INDEX idx_announcements_class ON announcements(class_id);
CREATE INDEX idx_announcements_published ON announcements(is_published);
```

### 3.14 Assignments Table

```sql
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES teachers(id) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_marks DECIMAL(5,2) DEFAULT 100,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_subject ON assignments(subject_id);
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
```

---

## 4. Create Functions

### 4.1 Update Updated_at Timestamp Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Apply Trigger to All Tables

```sql
-- Apply to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_subjects_updated_at BEFORE UPDATE ON class_subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.3 Generate Teacher Code Function

```sql
CREATE OR REPLACE FUNCTION generate_teacher_code()
RETURNS VARCHAR AS $$
DECLARE
  year VARCHAR(4);
  count INTEGER;
  new_code VARCHAR(50);
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
  SELECT COUNT(*) INTO count FROM teachers WHERE teacher_code LIKE 'TCH-' || year || '-%';
  new_code := 'TCH-' || year || '-' || LPAD((count + 1)::VARCHAR, 3, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

### 4.4 Generate Student Code Function

```sql
CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS VARCHAR AS $$
DECLARE
  year VARCHAR(4);
  count INTEGER;
  new_code VARCHAR(50);
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
  SELECT COUNT(*) INTO count FROM students WHERE student_code LIKE 'STU-' || year || '-%';
  new_code := 'STU-' || year || '-' || LPAD((count + 1)::VARCHAR, 5, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

### 4.5 Calculate Grade Letter Function

```sql
CREATE OR REPLACE FUNCTION calculate_grade_letter(percentage DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  CASE
    WHEN percentage >= 90 THEN RETURN 'A+';
    WHEN percentage >= 85 THEN RETURN 'A';
    WHEN percentage >= 80 THEN RETURN 'A-';
    WHEN percentage >= 75 THEN RETURN 'B+';
    WHEN percentage >= 70 THEN RETURN 'B';
    WHEN percentage >= 65 THEN RETURN 'B-';
    WHEN percentage >= 60 THEN RETURN 'C+';
    WHEN percentage >= 55 THEN RETURN 'C';
    WHEN percentage >= 50 THEN RETURN 'C-';
    WHEN percentage >= 45 THEN RETURN 'D';
    ELSE RETURN 'F';
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Row Level Security (RLS) Policies

### 5.1 Enable RLS on All Tables

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
```

### 5.2 User Profiles Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 5.3 Students Policies

```sql
-- Students can view their own data
CREATE POLICY "Students can view own data"
ON students FOR SELECT
USING (user_id = auth.uid());

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view class students"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    JOIN class_subjects cs ON cs.teacher_id = t.id
    JOIN students s ON s.class_id = cs.class_id
    WHERE t.user_id = auth.uid() AND s.id = students.id
  )
);

-- Parents can view their children
CREATE POLICY "Parents can view their children"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    WHERE psl.student_id = students.id AND p.user_id = auth.uid()
  )
);

-- Admins can view all students
CREATE POLICY "Admins can view all students"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can insert/update/delete students
CREATE POLICY "Admins can manage students"
ON students FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 5.4 Attendance Policies

```sql
-- Students can view their own attendance
CREATE POLICY "Students can view own attendance"
ON attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE students.id = attendance.student_id
    AND students.user_id = auth.uid()
  )
);

-- Teachers can view and manage attendance for their classes
CREATE POLICY "Teachers can manage class attendance"
ON attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    JOIN class_subjects cs ON cs.teacher_id = t.id
    WHERE t.user_id = auth.uid()
    AND cs.class_id = attendance.class_id
  )
);

-- Parents can view their children's attendance
CREATE POLICY "Parents can view children attendance"
ON attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    WHERE psl.student_id = attendance.student_id
    AND p.user_id = auth.uid()
  )
);

-- Admins can view all attendance
CREATE POLICY "Admins can manage all attendance"
ON attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 5.5 Grades Policies

```sql
-- Students can view their own grades
CREATE POLICY "Students can view own grades"
ON grades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE students.id = grades.student_id
    AND students.user_id = auth.uid()
  )
);

-- Teachers can manage grades for their subjects
CREATE POLICY "Teachers can manage subject grades"
ON grades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teachers t
    JOIN class_subjects cs ON cs.teacher_id = t.id
    WHERE t.user_id = auth.uid()
    AND cs.subject_id = grades.subject_id
    AND cs.class_id = grades.class_id
  )
);

-- Parents can view their children's grades
CREATE POLICY "Parents can view children grades"
ON grades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    WHERE psl.student_id = grades.student_id
    AND p.user_id = auth.uid()
  )
);

-- Admins can manage all grades
CREATE POLICY "Admins can manage all grades"
ON grades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## 6. Sample Data (Optional for Testing)

### 6.1 Create Test Admin

```sql
-- Note: You need to create the user in Supabase Auth first, then add to user_profiles
-- This is just the profile part after auth user is created

INSERT INTO user_profiles (id, role, first_name, last_name, phone)
VALUES (
  'your-admin-user-id-from-auth',
  'admin',
  'System',
  'Admin',
  '+1234567890'
);

INSERT INTO admins (user_id, department)
VALUES (
  'your-admin-user-id-from-auth',
  'Administration'
);
```

### 6.2 Generate Sample Student Codes

```sql
-- Generate 100 student codes
INSERT INTO student_codes (code, status, expires_at)
SELECT 
  'STU-2025-' || LPAD(generate_series::TEXT, 5, '0'),
  'available',
  NOW() + INTERVAL '90 days'
FROM generate_series(1, 100);
```

---

## 7. Useful Queries

### 7.1 Check Student Code Availability

```sql
SELECT * FROM student_codes
WHERE code = 'STU-2025-00001'
AND status = 'available'
AND (expires_at IS NULL OR expires_at > NOW());
```

### 7.2 Get Student with Parent Info

```sql
SELECT 
  s.id,
  s.student_code,
  up_student.first_name || ' ' || up_student.last_name as student_name,
  up_parent.first_name || ' ' || up_parent.last_name as parent_name,
  up_parent.phone as parent_phone,
  psl.relationship
FROM students s
JOIN user_profiles up_student ON s.user_id = up_student.id
JOIN parent_student_links psl ON psl.student_id = s.id
JOIN parents p ON p.id = psl.parent_id
JOIN user_profiles up_parent ON p.user_id = up_parent.id
WHERE s.student_code = 'STU-2025-00001';
```

### 7.3 Get Attendance Summary

```sql
SELECT 
  s.student_code,
  up.first_name || ' ' || up.last_name as student_name,
  COUNT(*) as total_days,
  COUNT(*) FILTER (WHERE a.status = 'present') as present_days,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent_days,
  COUNT(*) FILTER (WHERE a.status = 'late') as late_days,
  ROUND(
    (COUNT(*) FILTER (WHERE a.status = 'present')::DECIMAL / COUNT(*)) * 100,
    2
  ) as attendance_percentage
FROM attendance a
JOIN students s ON s.id = a.student_id
JOIN user_profiles up ON up.id = s.user_id
WHERE a.date >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.student_code, up.first_name, up.last_name
ORDER BY attendance_percentage DESC;
```

---

**Schema Version:** 1.0  
**Last Updated:** October 21, 2025  
**Database:** PostgreSQL (Supabase)
