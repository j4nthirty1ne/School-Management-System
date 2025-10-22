# Supabase Project Setup Guide

## Step 1: Create Supabase Account and Project

### 1.1 Sign Up / Login to Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign in"
3. Sign up using:
   - GitHub account (recommended)
   - Email and password

### 1.2 Create New Project

1. After logging in, click **"New Project"**
2. Fill in the project details:
   - **Name:** `school-management-system` (or your preferred name)
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to your location (e.g., `Southeast Asia (Singapore)`)
   - **Pricing Plan:** Select **"Free"** for development

3. Click **"Create new project"**
4. Wait 2-3 minutes for project to initialize

---

## Step 2: Get Your Project Credentials

Once your project is ready:

### 2.1 Navigate to Project Settings

1. Click on the **Settings** icon (gear icon) in the left sidebar
2. Go to **API** section

### 2.2 Copy These Values

You'll see these important values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (keep this secret!)
```

### 2.3 Update Your .env File

1. Copy `backend/.env.example` to root folder as `.env`
2. Update with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Important:** Never commit `.env` file to Git!

---

## Step 3: Set Up Database Schema

### 3.1 Open SQL Editor

1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"**

### 3.2 Execute Schema Scripts

Copy and run each section from `backend/database/schema.sql` **in order**:

#### Section 1: Enable UUID Extension
```sql
-- Copy from schema.sql: Section 1
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
Click **"Run"** (or press `Ctrl+Enter`)

#### Section 2: Create ENUM Types
```sql
-- Copy from schema.sql: Section 2
-- Create all ENUM types
```
Click **"Run"**

#### Section 3: Create Tables
```sql
-- Copy from schema.sql: Section 3
-- Create all tables (user_profiles, admins, students, etc.)
```
Click **"Run"** after each table or run all at once

#### Section 4: Create Functions
```sql
-- Copy from schema.sql: Section 4
-- Create all functions and triggers
```
Click **"Run"**

#### Section 5: Enable RLS
```sql
-- Copy from schema.sql: Section 5
-- Enable Row Level Security on all tables
```
Click **"Run"**

#### Section 6: Create RLS Policies
```sql
-- Copy from schema.sql: Section 5.2-5.5
-- Create all RLS policies
```
Click **"Run"** for each policy section

### 3.3 Verify Schema

1. Click **"Table Editor"** in left sidebar
2. You should see all tables:
   - user_profiles
   - admins
   - teachers
   - students
   - parents
   - student_codes
   - classes
   - subjects
   - attendance
   - grades
   - announcements
   - assignments

---

## Step 4: Create First Admin User

### 4.1 Sign Up Admin via Supabase Auth

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email:** `admin@school.com` (or your email)
   - **Password:** Create a strong password
   - **Auto Confirm User:** ✅ Check this box

4. Click **"Create user"**
5. Copy the **User UID** (you'll need this)

### 4.2 Add Admin Profile via SQL

1. Go back to **SQL Editor**
2. Run this query (replace `USER_UID_HERE` with the copied UID):

```sql
-- Insert admin profile
INSERT INTO user_profiles (id, role, first_name, last_name, phone, is_active)
VALUES (
  'USER_UID_HERE',  -- Replace with actual User UID
  'admin',
  'System',
  'Admin',
  '+1234567890',
  true
);

-- Insert admin record
INSERT INTO admins (user_id, department)
VALUES (
  'USER_UID_HERE',  -- Replace with actual User UID
  'Administration'
);
```

3. Click **"Run"**

### 4.3 Test Admin Login

You can now use:
- **Email:** `admin@school.com`
- **Password:** (the password you set)

to login as admin in your application.

---

## Step 5: Generate Sample Student Codes (Optional)

To test student registration, generate some student codes:

```sql
-- Generate 50 student codes
INSERT INTO student_codes (code, status, expires_at)
SELECT 
  'STU-2025-' || LPAD(generate_series::TEXT, 5, '0'),
  'available',
  NOW() + INTERVAL '90 days'
FROM generate_series(1, 50);
```

Run this in SQL Editor. You'll get codes:
- `STU-2025-00001`
- `STU-2025-00002`
- ...
- `STU-2025-00050`

---

## Step 6: Configure Email Settings (Optional but Recommended)

### 6.1 Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - Confirmation email
   - Password reset email
   - Magic link email

### 6.2 Configure SMTP (for production)

1. Go to **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Add your email provider details:
   - Gmail
   - SendGrid
   - AWS SES
   - Custom SMTP

For development, Supabase's default email works fine.

---

## Step 7: Set Up Storage (Optional - for file uploads)

If you need file uploads (student photos, documents):

1. Go to **Storage** in left sidebar
2. Click **"Create a new bucket"**
3. Name it: `student-documents` or `profile-pictures`
4. Set **Public bucket** based on your needs
5. Configure storage policies

---

## Step 8: Test Database Connection

### 8.1 Test Query in SQL Editor

```sql
-- Check if everything is set up
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see all your tables with column counts.

### 8.2 Test RLS Policies

```sql
-- Check active RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

You should see all your RLS policies listed.

---

## Step 9: Set Up Realtime (Optional)

For real-time features (live attendance, notifications):

1. Go to **Database** → **Replication**
2. Enable replication for tables:
   - `attendance`
   - `announcements`
   - `grades`
3. Click **"Enable"** for each table

---

## Troubleshooting

### Issue: Can't connect to database
- Check if project is fully initialized (wait 2-3 minutes)
- Verify credentials in `.env` file
- Check if URL includes `https://`

### Issue: Permission denied errors
- Make sure RLS policies are created
- Check if user is authenticated
- Verify user role in `user_profiles` table

### Issue: Functions not found
- Make sure all functions are created (Section 4 of schema.sql)
- Check for SQL syntax errors in function creation

### Issue: Admin can't access data
- Verify admin user has correct role in `user_profiles`
- Check admin RLS policies are created
- Make sure `is_active = true` in user_profiles

---

## Next Steps After Setup

1. ✅ Supabase project created
2. ✅ Database schema deployed
3. ✅ Admin user created
4. ✅ Student codes generated
5. ⏳ Set up Next.js frontend
6. ⏳ Create API routes
7. ⏳ Build authentication UI
8. ⏳ Test all user flows

---

## Quick Reference

### Important URLs
- **Supabase Dashboard:** https://app.supabase.com
- **Project URL:** https://[your-project-ref].supabase.co
- **Documentation:** https://supabase.com/docs

### Default Test Credentials
- **Admin:** `admin@school.com` / (your password)
- **Student Codes:** `STU-2025-00001` to `STU-2025-00050`

### Useful SQL Queries

**Check all users:**
```sql
SELECT 
  up.id, 
  up.role, 
  up.first_name, 
  up.last_name, 
  up.is_active
FROM user_profiles up
ORDER BY up.created_at DESC;
```

**Check available student codes:**
```sql
SELECT code, status, expires_at
FROM student_codes
WHERE status = 'available'
ORDER BY code;
```

**Check attendance summary:**
```sql
SELECT 
  s.student_code,
  up.first_name || ' ' || up.last_name as name,
  COUNT(*) FILTER (WHERE a.status = 'present') as present,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent
FROM attendance a
JOIN students s ON s.id = a.student_id
JOIN user_profiles up ON up.id = s.user_id
WHERE a.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.id, s.student_code, up.first_name, up.last_name;
```

---

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Service role key is never used in frontend
- [ ] RLS policies are enabled on all tables
- [ ] Admin user password is strong
- [ ] Email confirmation is enabled (production)
- [ ] Rate limiting is configured
- [ ] Database backups are enabled (Settings → Database → Backups)

---

**Setup Guide Version:** 1.0  
**Last Updated:** October 21, 2025  
**For Project:** School Management System

---

## Need Help?

- 📧 Supabase Support: https://supabase.com/support
- 📚 Documentation: https://supabase.com/docs
- 💬 Discord: https://discord.supabase.com
- 🐛 GitHub Issues: https://github.com/supabase/supabase

Good luck with your setup! 🚀
