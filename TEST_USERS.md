# Test Users for School Management System

Use these credentials to test different roles:

## Admin Account
- Email: admin@school.com
- Password: admin123
- Role: admin

## Teacher Account
- Email: teacher@school.com
- Password: teacher123
- Role: teacher

## Student Account
- Email: student@school.com
- Password: student123
- Role: student

## Parent Account
- Email: parent@school.com
- Password: parent123
- Role: parent

---

## Creating Test Users in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Note: You need to create users manually in Supabase Auth first, then run this SQL

-- After creating users in Supabase Auth, insert their profiles:

-- Example for admin (replace UUID with actual user ID from auth.users)
INSERT INTO public.user_profiles (id, role, first_name, last_name, phone)
VALUES 
  ('REPLACE-WITH-ADMIN-USER-UUID', 'admin', 'Admin', 'User', '1234567890');

-- Example for teacher
INSERT INTO public.user_profiles (id, role, first_name, last_name, phone)
VALUES 
  ('REPLACE-WITH-TEACHER-USER-UUID', 'teacher', 'John', 'Teacher', '1234567891');

-- Example for student
INSERT INTO public.user_profiles (id, role, first_name, last_name, phone)
VALUES 
  ('REPLACE-WITH-STUDENT-USER-UUID', 'student', 'Jane', 'Student', '1234567892');

-- Example for parent
INSERT INTO public.user_profiles (id, role, first_name, last_name, phone)
VALUES 
  ('REPLACE-WITH-PARENT-USER-UUID', 'parent', 'Bob', 'Parent', '1234567893');
```

---

## Alternative: Use the Registration Page

You can also create users through the registration page at `/register-user`
