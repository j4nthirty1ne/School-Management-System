-- =============================================
-- DATABASE TRIGGERS FOR AUTOMATIC USER PROFILE CREATION
-- Run this in your Supabase SQL Editor
-- =============================================

-- This trigger automatically creates a user_profile record
-- when a new user signs up via Supabase Auth
-- The profile data comes from the metadata passed during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles using data from auth.users metadata
  INSERT INTO public.user_profiles (
    id,
    role,
    first_name,
    last_name,
    phone,
    is_active
  )
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'phone',
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Optional: Trigger to update user_profiles.updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- Success message
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '✓ Triggers created successfully!';
  RAISE NOTICE '  - handle_new_user() will automatically create user profiles';
  RAISE NOTICE '  - handle_updated_at() will update timestamps automatically';
END $$;
