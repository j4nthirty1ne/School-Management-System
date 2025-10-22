# 🚀 Database Deployment Guide

## ✅ Quick Deployment Steps

### **Step 1: Open Supabase SQL Editor**
1. Go to: https://app.supabase.com/project/jggpcbuluptjkedolfgc/sql/new
2. Or navigate: Dashboard → SQL Editor → New Query

### **Step 2: Deploy Database Schema**
1. Open the file: `DEPLOY_SCHEMA.sql` in this project
2. **Copy ALL content** (Ctrl+A, Ctrl+C)
3. **Paste** into Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)

⏱️ **Execution time:** ~2-5 seconds

✅ **Expected result:** 
```
Success. No rows returned
```

### **Step 3: Verify Tables Created**
Go to: **Table Editor** in Supabase dashboard

You should see **14 tables**:
- ✅ user_profiles
- ✅ admins
- ✅ teachers
- ✅ students
- ✅ parents
- ✅ parent_student_links
- ✅ student_codes (with 100 generated codes)
- ✅ classes
- ✅ subjects
- ✅ class_subjects
- ✅ attendance
- ✅ grades
- ✅ announcements
- ✅ assignments

---

## 🎯 Next Steps After Deployment

### **Step 4: Create Admin User**

1. **Go to:** Authentication → Users
2. **Click:** "Add user" → "Create new user"
3. **Fill in:**
   - Email: `admin@school.com`
   - Password: `Admin@123456` (or your choice)
   - Email confirm: ✅ Auto confirm
4. **Click:** "Create user"
5. **Copy** the User UID (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### **Step 5: Add Admin Profile**

1. Go back to **SQL Editor**
2. Run this query (replace `YOUR_USER_ID_HERE` with the UID you copied):

```sql
-- Insert admin profile
INSERT INTO user_profiles (id, role, first_name, last_name, phone)
VALUES (
  'YOUR_USER_ID_HERE',
  'admin',
  'System',
  'Admin',
  '+1234567890'
);

-- Insert admin details
INSERT INTO admins (user_id, department)
VALUES (
  'YOUR_USER_ID_HERE',
  'Administration'
);
```

---

## 🧪 Testing Backend APIs

### **Method 1: Use Test Page UI**
1. Open browser: http://localhost:3000/test
2. Click each test button to verify:
   - ✅ Test Backend Connection
   - ✅ Test Student Code Validation
   - ✅ Test Login (use admin credentials)
   - ✅ Test Get User
   - ✅ Test Logout

### **Method 2: Manual API Testing**

#### Test Database Connection:
```bash
curl http://localhost:3000/api/test
```

#### Test Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"Admin@123456"}'
```

#### Test Student Code Validation:
```bash
curl -X POST http://localhost:3000/api/validate/student-code \
  -H "Content-Type: application/json" \
  -d '{"code":"STU-2025-00001"}'
```

---

## 📊 Database Overview

### What Was Created:

#### **8 ENUM Types:**
- user_role, code_status, enrollment_status, teacher_status
- attendance_status, gender_type, relationship_type, grade_type

#### **14 Tables:**
- User management (user_profiles, admins, teachers, students, parents)
- Academic (classes, subjects, class_subjects)
- Operations (attendance, grades, assignments, announcements)
- Security (student_codes, parent_student_links)

#### **5 Functions:**
- update_updated_at_column() - Auto-update timestamps
- generate_teacher_code() - TCH-YYYY-###
- generate_student_code() - STU-YYYY-#####
- calculate_grade_letter() - A+, A, B+, etc.

#### **12 Triggers:**
- Auto-update updated_at on all tables

#### **20+ RLS Policies:**
- Students: View own data
- Teachers: View/manage class data
- Parents: View children's data
- Admins: Full access to all data

#### **100 Student Codes:**
- Format: STU-2025-00001 to STU-2025-00100
- Status: Available
- Expires: 90 days from now

---

## ⚠️ Troubleshooting

### Error: "relation already exists"
**Solution:** Schema already deployed. Skip to Step 4.

### Error: "permission denied"
**Solution:** Make sure you're logged into correct Supabase project:
- Project: jggpcbuluptjkedolfgc
- URL: https://jggpcbuluptjkedolfgc.supabase.co

### Error: "could not connect to server"
**Solution:** Check internet connection and Supabase status.

### Backend test fails
**Solution:** 
1. Verify database schema deployed (14 tables exist)
2. Check .env.local has correct credentials
3. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

---

## 📝 Important Notes

### Student Code System:
- **100 codes** generated automatically
- **Format:** STU-2025-XXXXX (5 digits)
- **Validity:** 90 days
- **Used for:** Student registration (prevents spam)

### Teacher Code System:
- **Generated** when admin creates teacher
- **Format:** TCH-YYYY-XXX (3 digits)
- **Used for:** Teacher login without admin-set password

### Authentication Flow:
- **Admin:** Login with email/password (created in Supabase Auth)
- **Teacher:** Login with teacher code OR email/password
- **Student:** Register with student code, then login with email/password
- **Parent:** Auto-created during student registration, login with email/temp password

### Row Level Security (RLS):
- ✅ **Enabled** on all tables
- ✅ **Policies** restrict data access by role
- ✅ **Students** see only their own data
- ✅ **Teachers** see data for their classes
- ✅ **Parents** see data for their children
- ✅ **Admins** see all data

---

## ✅ Success Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Executed DEPLOY_SCHEMA.sql
- [ ] Verified 14 tables exist
- [ ] Created admin user in Supabase Auth
- [ ] Added admin profile with SQL
- [ ] Tested backend API at /api/test
- [ ] Tested login with admin credentials
- [ ] Verified student codes exist (100 codes)

---

## 🎉 You're All Set!

Your database is now fully configured and ready for:
- ✅ User authentication (4 roles)
- ✅ Student registration with codes
- ✅ Teacher management
- ✅ Attendance tracking
- ✅ Grade management
- ✅ Announcements & Assignments

**Next:** Start building the UI components! 🚀
