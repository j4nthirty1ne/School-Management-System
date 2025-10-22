-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- School Management System
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_codes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER_PROFILES POLICIES
-- =============================================

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to insert (for registration)
CREATE POLICY "Service role can insert profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- =============================================
-- STUDENTS POLICIES
-- =============================================

-- Students can view their own record
CREATE POLICY "Students can view own record"
  ON students
  FOR SELECT
  USING (user_id = auth.uid());

-- Students can update their own record
CREATE POLICY "Students can update own record"
  ON students
  FOR UPDATE
  USING (user_id = auth.uid());

-- Service role can insert (for registration)
CREATE POLICY "Service role can insert students"
  ON students
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all students
CREATE POLICY "Admins can view all students"
  ON students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Teachers can view all students
CREATE POLICY "Teachers can view all students"
  ON students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.user_id = auth.uid()
    )
  );

-- Admins can update students
CREATE POLICY "Admins can update students"
  ON students
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- =============================================
-- TEACHERS POLICIES
-- =============================================

-- Teachers can view their own record
CREATE POLICY "Teachers can view own record"
  ON teachers
  FOR SELECT
  USING (user_id = auth.uid());

-- Teachers can update their own record
CREATE POLICY "Teachers can update own record"
  ON teachers
  FOR UPDATE
  USING (user_id = auth.uid());

-- Service role can insert (for registration)
CREATE POLICY "Service role can insert teachers"
  ON teachers
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all teachers
CREATE POLICY "Admins can view all teachers"
  ON teachers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Admins can update teachers
CREATE POLICY "Admins can update teachers"
  ON teachers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- =============================================
-- ADMINS POLICIES
-- =============================================

-- Admins can view their own record
CREATE POLICY "Admins can view own record"
  ON admins
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert (for registration)
CREATE POLICY "Service role can insert admins"
  ON admins
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all admin records
CREATE POLICY "Admins can view all admins"
  ON admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- =============================================
-- STUDENT_CODES POLICIES
-- =============================================

-- Admins can manage student codes
CREATE POLICY "Admins can manage student codes"
  ON student_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Anyone can view available codes (for registration validation)
CREATE POLICY "Anyone can view available codes"
  ON student_codes
  FOR SELECT
  USING (status = 'available');

-- =============================================
-- CLASSES POLICIES
-- =============================================

-- Everyone can view active classes
CREATE POLICY "Everyone can view active classes"
  ON classes
  FOR SELECT
  USING (is_active = true);

-- Admins can manage classes
CREATE POLICY "Admins can manage classes"
  ON classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Teachers can view all classes
CREATE POLICY "Teachers can view all classes"
  ON classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.user_id = auth.uid()
    )
  );

-- =============================================
-- Success message
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '✓ RLS Policies created successfully!';
  RAISE NOTICE '  - User profiles: Users can view/update own profile';
  RAISE NOTICE '  - Students: Can view/update own record';
  RAISE NOTICE '  - Teachers: Can view/update own record';
  RAISE NOTICE '  - Admins: Can view all and manage system';
  RAISE NOTICE '  - Service role: Can insert during registration';
END $$;
