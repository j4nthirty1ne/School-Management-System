# Authentication System Setup Guide

## What I've Implemented

### 1. **Login Dialog Component** (`components/login-dialog.tsx`)
- Modal popup for role-based login
- Email/password authentication
- Role validation (ensures user logs in with correct role)
- Error handling with user-friendly messages
- Links to registration page

### 2. **Updated Landing Page** (`app/landing-page/page.tsx`)
- Click any role card (Admin, Teacher, Student, Parent)
- Opens login dialog for that specific role
- After successful login, shows the appropriate dashboard
- Displays user's name in header
- Logout functionality
- Session persistence (stays logged in on page refresh)

### 3. **API Routes**
- `/api/auth/login` - Login with email/password
- `/api/auth/logout` - Logout current user
- `/api/auth/me` - Get current user profile

## How to Use

### Step 1: Create Test Users in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Create users with these emails:
   - `admin@school.com` (password: `admin123`)
   - `teacher@school.com` (password: `teacher123`)
   - `student@school.com` (password: `student123`)
   - `parent@school.com` (password: `parent123`)

### Step 2: Add User Profiles

After creating users in Auth, go to **SQL Editor** and run:

```sql
-- Get the user IDs first
SELECT id, email FROM auth.users;

-- Then insert profiles (replace UUIDs with actual IDs from above)
INSERT INTO public.user_profiles (id, role, first_name, last_name, phone, is_active)
VALUES 
  ('ADMIN-USER-UUID-HERE', 'admin', 'Admin', 'User', '1234567890', true),
  ('TEACHER-USER-UUID-HERE', 'teacher', 'John', 'Smith', '1234567891', true),
  ('STUDENT-USER-UUID-HERE', 'student', 'Jane', 'Doe', '1234567892', true),
  ('PARENT-USER-UUID-HERE', 'parent', 'Bob', 'Johnson', '1234567893', true);
```

### Step 3: Test the Login Flow

1. Navigate to `/landing-page`
2. Click on "Teacher" card
3. Login dialog opens
4. Enter:
   - Email: `teacher@school.com`
   - Password: `teacher123`
5. Click "Sign in"
6. You should see the Teacher Dashboard with your name in the header

### Step 4: Test Role Validation

Try logging into Teacher with a Student account:
- Click "Teacher" card
- Enter student credentials
- You'll get an error: "This account is registered as student, not teacher"

## Features Implemented

✅ **Role-Based Authentication**
- Each role has its own dashboard
- Users can only access their assigned role
- Role validation on login

✅ **Session Management**
- Sessions stored in localStorage
- Automatic session restoration on page refresh
- Secure logout clears all session data

✅ **User Profile Display**
- Shows user's full name in header
- Profile data available to all dashboards

✅ **Error Handling**
- Invalid credentials
- Wrong role selected
- Network errors
- Missing profile data

✅ **Security**
- Passwords handled by Supabase Auth
- Role validation prevents unauthorized access
- Session tokens managed securely

## Next Steps

1. **Create Real Users**: Use the registration page at `/register-user`
2. **Customize Dashboards**: Each dashboard can now access user data:
   ```typescript
   // In any dashboard component, you can receive props:
   interface DashboardProps {
     userData?: {
       profile: {
         first_name: string
         last_name: string
         role: string
       }
     }
   }
   ```

3. **Add More Features**:
   - Forgot password
   - Email verification
   - Profile editing
   - Role-based permissions

## Troubleshooting

**Login fails with "Profile not found"**
- Make sure you created the user profile in `user_profiles` table

**Role validation error**
- Ensure the `role` in `user_profiles` matches: 'admin', 'teacher', 'student', or 'parent'

**Session not persisting**
- Check browser console for errors
- Verify localStorage is enabled
- Clear browser cache and try again

## Database Schema Required

Your `user_profiles` table should have:
```sql
- id (UUID, FK to auth.users)
- role (ENUM: 'admin', 'teacher', 'student', 'parent')
- first_name (VARCHAR)
- last_name (VARCHAR)
- phone (VARCHAR)
- avatar_url (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

This is already in your schema at `frontend/lib/backend/database/schema.sql`
