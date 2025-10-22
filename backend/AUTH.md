# Authentication System Documentation

## Overview

This document describes the authentication and authorization system for the School Management System (SMS) using Supabase Auth. The system supports four user roles: **Admin**, **Teacher**, **Student**, and **Parent**, each with specific registration and login requirements.

---

## User Roles & Authentication Flow

### 🔑 Role Summary

| User Type | Registration | Login | Verification Method | Created By |
|-----------|--------------|-------|---------------------|------------|
| **Admin** | Admin Dashboard Only | ✅ Email + Password | N/A | Existing Admin |
| **Teacher** | Admin Dashboard Only | ✅ Email + Teacher Code | Teacher Code | Admin |
| **Student** | ✅ Public (with Code) | ✅ Email + Password | Student Code | Self (with valid code) |
| **Parent** | ❌ Auto-created | ✅ Email + Password | Linked to Student | System (via Student) |

---

## 1. Admin Authentication

### Registration
- **Access:** Internal only (via admin dashboard)
- **Process:**
  1. Existing admin logs into admin dashboard
  2. Navigates to "Create Admin" section
  3. Fills in admin details (email, name, password)
  4. System creates admin account with `role = 'admin'`
  5. New admin receives credentials via secure channel

### Login
- **Endpoint:** `/api/auth/login`
- **Method:** POST
- **Fields:**
  - `email` (required)
  - `password` (required)
  
```javascript
// Login Request
{
  "email": "admin@school.com",
  "password": "securePassword123"
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@school.com",
    "role": "admin",
    "name": "John Doe"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Database Schema
```sql
-- users table
id: uuid (PK)
email: varchar
password_hash: varchar (handled by Supabase Auth)
role: enum('admin', 'teacher', 'student', 'parent')
created_at: timestamp

-- admins table
id: uuid (PK)
user_id: uuid (FK -> users.id)
first_name: varchar
last_name: varchar
phone: varchar
created_at: timestamp
updated_at: timestamp
```

---

## 2. Teacher Authentication

### Registration (Admin Only)
- **Access:** Admin dashboard
- **Process:**
  1. Admin navigates to "Teachers" → "Add New Teacher"
  2. Admin fills teacher details:
     - First Name, Last Name
     - Email
     - Phone Number
     - Subject Specialization
     - Hire Date
  3. System generates unique **Teacher Code** (e.g., `TCH-2025-001`)
  4. System creates teacher account with `role = 'teacher'`
  5. Teacher receives email with:
     - Teacher Code
     - Temporary password (must change on first login)
     - Login instructions

### Login
- **Endpoint:** `/api/auth/login/teacher`
- **Method:** POST
- **Fields:**
  - `email` OR `teacher_code` (required)
  - `password` (required)

```javascript
// Login Request (Option 1: Email)
{
  "email": "teacher@school.com",
  "password": "teacherPassword123"
}

// Login Request (Option 2: Teacher Code)
{
  "teacher_code": "TCH-2025-001",
  "password": "teacherPassword123"
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "teacher@school.com",
    "role": "teacher",
    "teacher_code": "TCH-2025-001",
    "name": "Jane Smith",
    "subjects": ["Mathematics", "Physics"]
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Database Schema
```sql
-- teachers table
id: uuid (PK)
user_id: uuid (FK -> users.id)
teacher_code: varchar (UNIQUE, indexed)
first_name: varchar
last_name: varchar
email: varchar (UNIQUE)
phone: varchar
subject_specialization: varchar
hire_date: date
status: enum('active', 'inactive')
created_at: timestamp
updated_at: timestamp
```

### Teacher Code Generation
```javascript
// Format: TCH-YYYY-###
// Example: TCH-2025-001, TCH-2025-002, etc.

function generateTeacherCode() {
  const year = new Date().getFullYear();
  const count = await getTeacherCountForYear(year);
  const sequence = String(count + 1).padStart(3, '0');
  return `TCH-${year}-${sequence}`;
}
```

---

## 3. Student Authentication

### Registration (Public with Code Verification)
- **Access:** Public registration page
- **Process:**
  1. Student visits `/register/student`
  2. Student enters **Student Code** (provided by school)
  3. System validates student code:
     - Code exists in database
     - Code is not already used
     - Code is not expired
  4. If valid, student fills registration form:
     - Personal Information (name, DOB, gender)
     - Contact Information (email, phone)
     - Parent/Guardian Information
     - Academic Information (class, section)
     - Password
  5. System creates student account with `role = 'student'`
  6. System marks student code as **used**
  7. System creates linked parent account(s)
  8. Confirmation email sent to student

### Login
- **Endpoint:** `/api/auth/login/student`
- **Method:** POST
- **Fields:**
  - `email` OR `student_code` (required)
  - `password` (required)

```javascript
// Login Request (Option 1: Email)
{
  "email": "student@example.com",
  "password": "studentPassword123"
}

// Login Request (Option 2: Student Code)
{
  "student_code": "STU-2025-001",
  "password": "studentPassword123"
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "role": "student",
    "student_code": "STU-2025-001",
    "name": "Alex Johnson",
    "class": "10-A",
    "enrollment_status": "active"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Database Schema
```sql
-- student_codes table (Pre-generated by admin)
id: uuid (PK)
code: varchar (UNIQUE, indexed) -- STU-2025-001
status: enum('available', 'used', 'expired')
generated_by: uuid (FK -> admins.id)
used_by: uuid (FK -> students.id, nullable)
generated_at: timestamp
used_at: timestamp (nullable)
expires_at: timestamp (nullable)

-- students table
id: uuid (PK)
user_id: uuid (FK -> users.id)
student_code: varchar (UNIQUE, indexed)
first_name: varchar
last_name: varchar
email: varchar (UNIQUE)
phone: varchar
date_of_birth: date
gender: enum('male', 'female', 'other')
class_id: uuid (FK -> classes.id)
section: varchar
enrollment_date: date
enrollment_status: enum('active', 'graduated', 'transferred', 'suspended')
created_at: timestamp
updated_at: timestamp

-- parent_student_link table
id: uuid (PK)
parent_id: uuid (FK -> parents.id)
student_id: uuid (FK -> students.id)
relationship: enum('father', 'mother', 'guardian')
is_primary: boolean
created_at: timestamp
```

### Student Code Generation (Admin)
```javascript
// Format: STU-YYYY-#####
// Example: STU-2025-00001, STU-2025-00002, etc.

function generateStudentCodes(count) {
  const year = new Date().getFullYear();
  const startingNumber = await getLastStudentNumberForYear(year);
  const codes = [];
  
  for (let i = 1; i <= count; i++) {
    const sequence = String(startingNumber + i).padStart(5, '0');
    codes.push({
      code: `STU-${year}-${sequence}`,
      status: 'available',
      generated_at: new Date(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    });
  }
  
  return codes;
}
```

### Anti-Spam Measures
1. **Code Verification:** Only students with valid codes can register
2. **One-Time Use:** Each code can only be used once
3. **Expiration:** Codes expire after 90 days if unused
4. **Rate Limiting:** Limit registration attempts per IP
5. **Email Verification:** Require email verification after registration
6. **CAPTCHA:** Add reCAPTCHA on registration page

---

## 4. Parent Authentication

### Registration (Automatic)
- **Access:** N/A (Created automatically during student registration)
- **Process:**
  1. During student registration, parent information is collected
  2. System checks if parent email already exists
  3. If new, system creates parent account with `role = 'parent'`
  4. System links parent to student via `parent_student_link` table
  5. Parent receives welcome email with:
     - Login credentials (email + temporary password)
     - Student information
     - Instructions to change password

### Login
- **Endpoint:** `/api/auth/login/parent`
- **Method:** POST
- **Fields:**
  - `email` (required)
  - `password` (required)
  - `student_code` (optional, for multi-student parents)

```javascript
// Login Request
{
  "email": "parent@example.com",
  "password": "parentPassword123"
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "parent@example.com",
    "role": "parent",
    "name": "Mary Johnson",
    "children": [
      {
        "student_id": "uuid",
        "student_code": "STU-2025-001",
        "name": "Alex Johnson",
        "class": "10-A",
        "relationship": "mother"
      }
    ]
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Database Schema
```sql
-- parents table
id: uuid (PK)
user_id: uuid (FK -> users.id)
first_name: varchar
last_name: varchar
email: varchar (UNIQUE)
phone: varchar
occupation: varchar (nullable)
address: text (nullable)
created_at: timestamp
updated_at: timestamp
```

---

## Security Implementation

### 1. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

### 2. JWT Token Structure
```javascript
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "student",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 3. Role-Based Access Control (RBAC)

**Supabase Row Level Security (RLS) Policies:**

```sql
-- Example: Students can only view their own data
CREATE POLICY "Students can view own data"
ON students
FOR SELECT
USING (auth.uid() = user_id);

-- Example: Teachers can view students in their classes
CREATE POLICY "Teachers can view class students"
ON students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = students.class_id
    AND classes.teacher_id = (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  )
);

-- Example: Parents can view their children's data
CREATE POLICY "Parents can view their children"
ON students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_student_link psl
    JOIN parents p ON p.id = psl.parent_id
    WHERE psl.student_id = students.id
    AND p.user_id = auth.uid()
  )
);

-- Example: Admins can view all data
CREATE POLICY "Admins can view all students"
ON students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

### 4. Middleware Protection

```javascript
// middleware.js (Next.js)
export async function middleware(request) {
  const supabase = createMiddlewareClient({ req: request });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Role-based route protection
  const userRole = session.user.role;
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  if (path.startsWith('/teacher') && userRole !== 'teacher') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // Continue
  return NextResponse.next();
}
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/auth/register/student        # Student registration with code
POST   /api/auth/login                   # Universal login (detects role)
POST   /api/auth/login/admin             # Admin-specific login
POST   /api/auth/login/teacher           # Teacher-specific login
POST   /api/auth/login/student           # Student-specific login
POST   /api/auth/login/parent            # Parent-specific login
POST   /api/auth/logout                  # Logout (all roles)
POST   /api/auth/refresh                 # Refresh access token
POST   /api/auth/forgot-password         # Password reset request
POST   /api/auth/reset-password          # Password reset confirmation
GET    /api/auth/verify-email            # Email verification
POST   /api/auth/change-password         # Change password (authenticated)
```

### Admin Endpoints (Protected)

```
POST   /api/admin/teachers/create        # Create new teacher
POST   /api/admin/codes/generate         # Generate student codes
GET    /api/admin/codes                  # List all codes
POST   /api/admin/admins/create          # Create new admin
```

### Validation Endpoints

```
POST   /api/validate/student-code        # Validate student code
POST   /api/validate/teacher-code        # Validate teacher code
GET    /api/validate/email               # Check email availability
```

---

## Error Handling

### Common Error Responses

```javascript
// Invalid Credentials
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}

// Invalid Student Code
{
  "success": false,
  "error": {
    "code": "INVALID_STUDENT_CODE",
    "message": "Student code is invalid, already used, or expired"
  }
}

// Unauthorized Access
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You don't have permission to access this resource"
  }
}

// Email Already Exists
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists"
  }
}
```

---

## Testing Checklist

### Admin
- [ ] Admin can login with email and password
- [ ] Admin can create new teachers
- [ ] Admin can generate student codes
- [ ] Admin can create other admins
- [ ] Admin cannot access without proper credentials

### Teacher
- [ ] Teacher can login with email/teacher code
- [ ] Teacher must change password on first login
- [ ] Teacher can only access teacher routes
- [ ] Teacher code is unique and validated

### Student
- [ ] Student can register with valid code
- [ ] Student code validation works correctly
- [ ] Used codes cannot be reused
- [ ] Expired codes are rejected
- [ ] Student can login after registration
- [ ] Parent account is created automatically

### Parent
- [ ] Parent receives login credentials after student registration
- [ ] Parent can view all linked children
- [ ] Parent can only access parent routes
- [ ] Parent can view child's attendance and grades

---

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=your_session_secret

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=5
```

---

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Create database tables and RLS policies
3. ✅ Implement authentication endpoints
4. ✅ Create registration and login pages
5. ✅ Add role-based middleware protection
6. ✅ Implement student code generation system
7. ✅ Test all authentication flows
8. ✅ Add email notifications
9. ✅ Implement password reset functionality
10. ✅ Add rate limiting and security measures

---

**Last Updated:** October 21, 2025  
**Version:** 1.0  
**Status:** Documentation Complete
