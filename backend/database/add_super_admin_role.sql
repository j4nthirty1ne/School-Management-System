-- Migration: Add super_admin role
-- Run this in your Supabase SQL Editor

-- Step 1: Add 'super_admin' to the user_role enum
ALTER TYPE user_role ADD VALUE 'super_admin';

-- Step 2: Verify the change
-- You can check by running: SELECT enum_range(NULL::user_role);

-- Step 3: (Optional) Update an existing admin to super_admin for testing
-- Replace 'your-admin-user-id' with an actual admin user ID from your database
-- UPDATE user_profiles SET role = 'super_admin' WHERE id = 'your-admin-user-id';

-- Step 4: Update RLS policies to allow super_admin full access

-- Super admin can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Super admin can manage all users
CREATE POLICY "Super admins can manage all users"
ON user_profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Super admin can manage all admins
CREATE POLICY "Super admins can manage admins"
ON admins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Note: Regular admins cannot manage other admins, only super_admin can
