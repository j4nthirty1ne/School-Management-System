# Backend Documentation

Complete documentation for the School Management System backend built with Supabase and Next.js API Routes.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Services](#services)
5. [API Routes](#api-routes)
6. [Utilities](#utilities)
7. [Authentication Flow](#authentication-flow)
8. [Testing Guide](#testing-guide)
9. [Deployment](#deployment)

---

## 🏗️ Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Pages     │  │ Components  │  │  Middleware │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                 │                 │            │
│         └─────────────────┴─────────────────┘            │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────┐
│                  API Routes (Next.js)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  /api/test        - Database connection test     │   │
│  │  /api/auth/*      - Authentication endpoints     │   │
│  │  /api/validate/*  - Validation endpoints         │   │
│  │  /api/admin/*     - Admin operations             │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                   │
└───────────────────────┼───────────────────────────────────┘
                        │
┌───────────────────────┼───────────────────────────────────┐
│                    Services Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ authService  │  │studentService│  │teacherService│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         studentCodeService                        │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────┼───────────────────────────────────┘
                        │
┌───────────────────────┼───────────────────────────────────┐
│                Supabase (Backend as a Service)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │  Auth (JWT)  │  │  Storage     │  │
│  │  Database    │  │   + RLS      │  │  (Files)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Key Components

- **Frontend**: Next.js 14+ with App Router, React Server Components
- **API Layer**: Next.js API Routes (serverless functions)
- **Business Logic**: Service layer with TypeScript
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **Authentication**: Supabase Auth (JWT-based)
- **File Storage**: Supabase Storage (for avatars, attachments)

---

## 🛠️ Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14+ | Full-stack React framework |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Supabase** | Latest | Backend as a Service (BaaS) |
| **PostgreSQL** | 15+ | Relational database |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |

### Key Libraries

```json
{
  "@supabase/supabase-js": "^2.x",     // Supabase client
  "@supabase/ssr": "^0.x",              // Server-side rendering support
  "next": "15.x",                       // React framework
  "react": "^18.x",                     // UI library
  "typescript": "^5.x"                  // Type system
}
```

---

## 🗄️ Database Schema

### Overview

The database consists of **14 tables**, **8 ENUM types**, and **20+ RLS policies**.

### ENUM Types

```sql
-- User roles
user_role: 'admin' | 'teacher' | 'student' | 'parent'

-- Status types
code_status: 'available' | 'used' | 'expired'
enrollment_status: 'active' | 'graduated' | 'transferred' | 'suspended' | 'pending'
teacher_status: 'active' | 'inactive' | 'on_leave'
attendance_status: 'present' | 'absent' | 'late' | 'excused'

-- Other types
gender_type: 'male' | 'female' | 'other'
relationship_type: 'father' | 'mother' | 'guardian' | 'other'
grade_type: 'quiz' | 'assignment' | 'midterm' | 'final' | 'project'
```

### Core Tables

#### 1. **user_profiles** (Extended Auth Users)
```sql
id UUID PRIMARY KEY (references auth.users)
role user_role NOT NULL
first_name VARCHAR(100)
last_name VARCHAR(100)
phone VARCHAR(20)
avatar_url TEXT
is_active BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 2. **admins**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES user_profiles (UNIQUE)
department VARCHAR(100)
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 3. **teachers**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES user_profiles (UNIQUE)
teacher_code VARCHAR(50) UNIQUE (e.g., 'TCH-2025-001')
subject_specialization VARCHAR(100)
qualification VARCHAR(200)
hire_date DATE
status teacher_status
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 4. **students**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES user_profiles (UNIQUE)
student_code VARCHAR(50) UNIQUE (e.g., 'STU-2025-00001')
date_of_birth DATE
gender gender_type
address TEXT
class_id UUID REFERENCES classes
enrollment_date DATE
enrollment_status enrollment_status
emergency_contact_name VARCHAR(100)
emergency_contact_phone VARCHAR(20)
medical_notes TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 5. **parents**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES user_profiles (UNIQUE)
occupation VARCHAR(100)
address TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 6. **student_codes**
```sql
id UUID PRIMARY KEY
code VARCHAR(50) UNIQUE (e.g., 'STU-2025-00001')
status code_status
generated_by UUID REFERENCES admins
used_by UUID REFERENCES auth.users
generated_at TIMESTAMP
used_at TIMESTAMP
expires_at TIMESTAMP
notes TEXT
```

### Academic Tables

- **classes**: Grade levels, sections, academic years
- **subjects**: Subject names, codes, credit hours
- **class_subjects**: Links classes with subjects and teachers
- **attendance**: Daily attendance records
- **grades**: Exam scores and grades
- **assignments**: Homework and projects
- **announcements**: School-wide or class-specific notices

### Relationship Tables

- **parent_student_links**: Many-to-many relationship between parents and students

### Database Features

- ✅ **Row Level Security (RLS)**: All tables protected
- ✅ **Automatic Timestamps**: `updated_at` auto-updated via triggers
- ✅ **Foreign Keys**: Enforced referential integrity
- ✅ **Indexes**: Optimized for common queries
- ✅ **Functions**: Helper functions for code generation, grade calculation

---

## 📦 Services

### 1. authService.ts

**Purpose**: Handle all authentication operations

**Functions**:

```typescript
// Register new user
registerUser(email, password, userData)
  → Creates user in Supabase Auth
  → Returns: { user, session, error }

// Login user
loginUser(email, password)
  → Authenticates user
  → Returns: { user, session, error }

// Logout user
logoutUser()
  → Clears session
  → Returns: { error }

// Get current user
getCurrentUser()
  → Gets authenticated user from session
  → Returns: { user, error }

// Change password
changePassword(newPassword)
  → Updates user password
  → Returns: { error }

// Reset password (forgot password)
resetPassword(email)
  → Sends password reset email
  → Returns: { error }

// Verify email
verifyEmail(token)
  → Confirms email address
  → Returns: { error }

// Refresh session
refreshSession()
  → Refreshes JWT token
  → Returns: { session, error }
```

**Usage Example**:
```typescript
import { loginUser } from '@/lib/backend/services/authService'

const result = await loginUser('user@school.com', 'password123')
if (result.error) {
  console.error('Login failed:', result.error)
} else {
  console.log('Logged in:', result.user)
}
```

---

### 2. studentService.ts

**Purpose**: Manage student records and parent account creation

**Functions**:

```typescript
// Register student (also creates parent account)
registerStudent(studentData, parentData)
  → Creates student auth user
  → Creates parent auth user with temp password
  → Creates student profile
  → Creates parent profile
  → Links parent to student
  → Returns: { student, parent, tempPassword }

// Get student by ID
getStudentById(studentId)
  → Fetches student details
  → Returns: { student, error }

// Get student by code
getStudentByCode(studentCode)
  → Finds student by unique code
  → Returns: { student, error }

// Get all students
getAllStudents(filters?)
  → Lists students with optional filtering
  → Supports pagination
  → Returns: { students, count, error }

// Update student
updateStudent(studentId, updates)
  → Updates student information
  → Returns: { student, error }

// Delete student
deleteStudent(studentId)
  → Soft delete (marks as inactive)
  → Returns: { success, error }

// Get student's parents
getStudentParents(studentId)
  → Gets linked parent accounts
  → Returns: { parents, error }
```

**Usage Example**:
```typescript
import { registerStudent } from '@/lib/backend/services/studentService'

const result = await registerStudent(
  {
    email: 'student@test.com',
    password: 'pass123',
    firstName: 'John',
    lastName: 'Doe',
    studentCode: 'STU-2025-00001',
    dateOfBirth: '2010-05-15',
    gender: 'male'
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'parent@test.com',
    phone: '+1234567890',
    relationship: 'mother'
  }
)

// Parent receives temp password: result.tempPassword
```

---

### 3. teacherService.ts

**Purpose**: Manage teacher accounts and authentication

**Functions**:

```typescript
// Create teacher (admin only)
createTeacher(teacherData)
  → Creates teacher auth user
  → Generates unique teacher code
  → Creates teacher profile
  → Returns: { teacher, teacherCode }

// Generate teacher code
generateTeacherCode()
  → Format: TCH-YYYY-XXX (e.g., TCH-2025-001)
  → Returns: { code }

// Get teacher by ID
getTeacherById(teacherId)
  → Fetches teacher details
  → Returns: { teacher, error }

// Get teacher by code
getTeacherByCode(teacherCode)
  → Finds teacher by unique code
  → Returns: { teacher, error }

// Login with teacher code
loginWithTeacherCode(teacherCode, password?)
  → Alternative login method for teachers
  → Returns: { user, session, error }

// Update teacher
updateTeacher(teacherId, updates)
  → Updates teacher information
  → Returns: { teacher, error }

// Update teacher status
updateTeacherStatus(teacherId, status)
  → Changes: active, inactive, on_leave
  → Returns: { teacher, error }

// Get teacher's classes
getTeacherClasses(teacherId)
  → Lists assigned classes
  → Returns: { classes, error }

// Delete teacher
deleteTeacher(teacherId)
  → Soft delete (marks as inactive)
  → Returns: { success, error }
```

**Usage Example**:
```typescript
import { createTeacher, generateTeacherCode } from '@/lib/backend/services/teacherService'

const code = await generateTeacherCode() // TCH-2025-001

const result = await createTeacher({
  email: 'teacher@school.com',
  password: 'securepass',
  firstName: 'Mary',
  lastName: 'Smith',
  teacherCode: code,
  subjectSpecialization: 'Mathematics',
  qualification: 'Masters in Education',
  hireDate: '2025-09-01'
})
```

---

### 4. studentCodeService.ts

**Purpose**: Manage student registration codes (anti-spam system)

**Functions**:

```typescript
// Validate student code
validateStudentCode(code)
  → Checks if code exists
  → Verifies not used
  → Verifies not expired
  → Returns: { valid: boolean, code?, error? }

// Mark code as used
markStudentCodeAsUsed(code, userId)
  → Updates status to 'used'
  → Records who used it
  → Records timestamp
  → Returns: { success, error }

// Generate student codes (admin only)
generateStudentCodes(count, expiryDays?)
  → Format: STU-YYYY-XXXXX (e.g., STU-2025-00001)
  → Default expiry: 90 days
  → Returns: { codes: string[], count }

// Get all codes
getAllStudentCodes(filter?)
  → Lists codes with status
  → Supports filtering by status
  → Returns: { codes, count, error }

// Delete code (admin only)
deleteStudentCode(codeId)
  → Removes code from system
  → Returns: { success, error }
```

**Usage Example**:
```typescript
import { validateStudentCode, generateStudentCodes } from '@/lib/backend/services/studentCodeService'

// Admin generates codes
const result = await generateStudentCodes(50, 90) // 50 codes, 90 days expiry
// Returns: ['STU-2025-00001', 'STU-2025-00002', ...]

// Student validates code during registration
const validation = await validateStudentCode('STU-2025-00001')
if (validation.valid) {
  // Proceed with registration
} else {
  console.error('Invalid code:', validation.error)
}
```

---

## 🌐 API Routes

### Base URL: `http://localhost:3000/api`

### Authentication Endpoints

#### POST `/api/auth/register`
**Purpose**: Create new user account

**Request Body**:
```json
{
  "email": "user@school.com",
  "password": "securepass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@school.com",
    "created_at": "2025-10-21T..."
  }
}
```

---

#### POST `/api/auth/login`
**Purpose**: Authenticate user

**Request Body**:
```json
{
  "email": "user@school.com",
  "password": "securepass123"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@school.com",
    "role": "student"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

#### POST `/api/auth/logout`
**Purpose**: End user session

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### GET `/api/auth/user`
**Purpose**: Get current authenticated user

**Response (Logged in)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@school.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response (Not logged in)**:
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

---

### Validation Endpoints

#### POST `/api/validate/student-code`
**Purpose**: Validate student registration code

**Request Body**:
```json
{
  "code": "STU-2025-00001"
}
```

**Response (Valid)**:
```json
{
  "success": true,
  "valid": true,
  "message": "Student code is valid",
  "code": {
    "code": "STU-2025-00001",
    "expires_at": "2026-01-19T...",
    "status": "available"
  }
}
```

**Response (Invalid)**:
```json
{
  "success": false,
  "valid": false,
  "error": "Code already used"
}
```

---

### Admin Endpoints

#### POST `/api/admin/codes/generate`
**Purpose**: Generate student registration codes (admin only)

**Request Body**:
```json
{
  "count": 50,
  "expiryDays": 90
}
```

**Response**:
```json
{
  "success": true,
  "message": "Generated 50 student codes",
  "codes": [
    "STU-2025-00001",
    "STU-2025-00002",
    "..."
  ],
  "count": 50
}
```

---

### Test Endpoints

#### GET `/api/test`
**Purpose**: Test database connection

**Response (Connected)**:
```json
{
  "success": true,
  "message": "Database connection successful",
  "timestamp": "2025-10-21T10:30:00Z",
  "database": "jggpcbuluptjkedolfgc",
  "userCount": 5
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "relation \"user_profiles\" does not exist"
}
```

---

## 🔧 Utilities

### validation.ts

**Purpose**: Input validation and security checks

**Functions**:

```typescript
// Validate email format
validateEmail(email: string): boolean

// Validate password strength
validatePassword(password: string): { valid: boolean, errors: string[] }
  → Minimum 8 characters
  → At least 1 uppercase, 1 lowercase, 1 number

// Validate phone number
validatePhone(phone: string): boolean

// Validate student code format
validateStudentCodeFormat(code: string): boolean
  → Format: STU-YYYY-XXXXX

// Validate teacher code format
validateTeacherCodeFormat(code: string): boolean
  → Format: TCH-YYYY-XXX

// Rate limiting
checkRateLimit(userId: string, action: string): boolean

// Authorization checks
isAdmin(userId: string): Promise<boolean>
isTeacher(userId: string): Promise<boolean>
isStudent(userId: string): Promise<boolean>
isParent(userId: string): Promise<boolean>
```

---

### helpers.ts

**Purpose**: Common utility functions

**Functions**:

```typescript
// Date formatting
formatDate(date: Date, format: string): string
getAcademicYear(): string // e.g., "2025-2026"

// Grade calculations
calculateGPA(grades: Grade[]): number
calculateAttendancePercentage(attendance: Attendance[]): number
getGradeLetter(percentage: number): string

// Pagination
paginate(items: any[], page: number, limit: number): any[]
getPaginationInfo(total: number, page: number, limit: number): PaginationInfo

// Password generation
generateTemporaryPassword(): string
  → 12 characters, includes special chars

// Code generation
generateRandomCode(prefix: string, length: number): string
```

---

## 🔐 Authentication Flow

### User Registration Flow

```
1. User visits registration page
   ↓
2. Fills form with email, password, details
   ↓
3. (If student) Validates student code
   ↓
4. POST /api/auth/register
   ↓
5. Creates user in Supabase Auth
   ↓
6. (If student) Creates parent account too
   ↓
7. Creates user_profile record
   ↓
8. Creates role-specific record (student/teacher/parent)
   ↓
9. Returns success with user ID
```

### Login Flow

```
1. User visits login page
   ↓
2. Enters email/password
   ↓
3. POST /api/auth/login
   ↓
4. Supabase Auth validates credentials
   ↓
5. Returns JWT access token + refresh token
   ↓
6. Tokens stored in httpOnly cookies
   ↓
7. Middleware validates token on each request
   ↓
8. Redirects to role-specific dashboard
```

### Authorization Flow

```
1. User makes request to protected route
   ↓
2. Middleware checks for valid JWT
   ↓
3. Extracts user ID from token
   ↓
4. Queries user_profiles for role
   ↓
5. Checks if role matches route requirements
   ↓
6. If authorized: Allow access
   ↓
7. If not: Redirect to login or 403 error
```

### Row Level Security (RLS) Flow

```
1. User queries database (e.g., SELECT * FROM students)
   ↓
2. PostgreSQL checks RLS policies
   ↓
3. Gets user ID from auth.uid()
   ↓
4. Applies role-specific policy:
   - Admin: See all students
   - Teacher: See students in their classes
   - Student: See only their own record
   - Parent: See their children's records
   ↓
5. Returns filtered results
```

---

## 🧪 Testing Guide

### Local Testing

#### 1. Test Database Connection
```bash
curl http://localhost:3000/api/test
```

#### 2. Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@school.com",
    "password": "Test@123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### 3. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@school.com",
    "password": "Test@123456"
  }'
```

#### 4. Test Student Code Validation
```bash
curl -X POST http://localhost:3000/api/validate/student-code \
  -H "Content-Type: application/json" \
  -d '{"code": "STU-2025-00001"}'
```

### Interactive Testing

Visit: **http://localhost:3000/test**

The test page provides a UI for testing all API endpoints with real-time results.

---

## 🚀 Deployment

### Prerequisites

1. ✅ Supabase project created
2. ✅ Database schema deployed
3. ✅ Environment variables configured
4. ✅ Admin user created

### Environment Variables

**Production (.env.production)**:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy automatically

### Post-Deployment Checklist

- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Admin user created
- [ ] Student codes generated
- [ ] API endpoints tested
- [ ] Authentication tested
- [ ] File uploads configured (if using Storage)

---

## 📊 Performance Considerations

### Database Optimization

- ✅ **Indexes**: Created on frequently queried columns
- ✅ **Pagination**: Implemented for large datasets
- ✅ **Connection Pooling**: Handled by Supabase
- ✅ **Query Optimization**: Use specific SELECT columns

### Caching Strategy

- **Static Pages**: Cached at CDN level (Vercel)
- **API Routes**: Implement Redis for session caching (optional)
- **Database**: Supabase provides built-in caching

### Security Best Practices

- ✅ **RLS Policies**: All tables protected
- ✅ **Input Validation**: Server-side validation on all inputs
- ✅ **Rate Limiting**: Implemented in validation.ts
- ✅ **JWT Tokens**: HttpOnly cookies, short expiry
- ✅ **Password Hashing**: Handled by Supabase Auth
- ✅ **SQL Injection**: Protected by Supabase SDK

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: "relation does not exist"
- **Solution**: Deploy database schema from DEPLOY_SCHEMA.sql

**Issue**: "Invalid credentials"
- **Solution**: Verify user exists in Supabase Auth dashboard

**Issue**: "Not authenticated"
- **Solution**: Login first, check cookies enabled

**Issue**: "Permission denied for table"
- **Solution**: Check RLS policies, verify user role

**Issue**: "Code already used"
- **Solution**: Generate new student codes or use a different code

---

**Last Updated**: October 21, 2025  
**Version**: 1.0  
**Maintained by**: Development Team
