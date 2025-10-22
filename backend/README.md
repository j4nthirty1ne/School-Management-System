# School Management System - Backend

Backend services for the School Management System using Supabase and Next.js API routes.

## 📁 Structure

```
backend/
├── config/
│   └── supabase.ts          # Supabase client configuration
├── database/
│   └── schema.sql           # Complete database schema with RLS policies
├── services/
│   ├── authService.ts       # Authentication services
│   ├── studentService.ts    # Student CRUD operations
│   ├── studentCodeService.ts # Student code management
│   └── teacherService.ts    # Teacher CRUD operations
├── utils/
│   ├── validation.ts        # Input validation utilities
│   └── helpers.ts           # Helper functions
├── .env.example             # Environment variables template
└── AUTH.md                  # Authentication documentation
```

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note your project URL and API keys

### 2. Set Up Database

1. Navigate to SQL Editor in Supabase dashboard
2. Copy the contents of `database/schema.sql`
3. Execute the SQL in the following order:
   - Enable UUID extension
   - Create ENUM types
   - Create tables
   - Create functions
   - Enable RLS
   - Create RLS policies

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env` (in project root)
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Install Dependencies

The backend services will be used in Next.js API routes. Install Supabase client:

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

## 📚 Services Overview

### Authentication Service (`authService.ts`)

Handles user authentication for all roles:

- `registerUser()` - Create new user account
- `loginUser()` - Login with email/password
- `logoutUser()` - Sign out user
- `getCurrentUser()` - Get current session
- `changePassword()` - Update password
- `resetPassword()` - Send password reset email

### Student Service (`studentService.ts`)

Manages student operations:

- `registerStudent()` - Register student with parent account creation
- `getStudentById()` - Get student details
- `getStudentByCode()` - Find student by code
- `getAllStudents()` - List all students with filters
- `updateStudent()` - Update student information
- `deleteStudent()` - Soft delete (suspend) student

### Student Code Service (`studentCodeService.ts`)

Manages student registration codes:

- `validateStudentCode()` - Check if code is valid
- `markStudentCodeAsUsed()` - Mark code as used
- `generateStudentCodes()` - Generate codes (Admin only)
- `getAllStudentCodes()` - List codes with filters
- `deleteStudentCode()` - Delete unused code

### Teacher Service (`teacherService.ts`)

Manages teacher operations:

- `createTeacher()` - Create teacher account (Admin only)
- `generateTeacherCode()` - Generate unique teacher code
- `getTeacherById()` - Get teacher details
- `getTeacherByCode()` - Find teacher by code
- `getAllTeachers()` - List all teachers
- `updateTeacher()` - Update teacher information
- `updateTeacherStatus()` - Change teacher status
- `loginWithTeacherCode()` - Login using teacher code

## 🔐 Authentication Flow

### Admin
```typescript
// Login only (no public registration)
const result = await loginUser({
  email: 'admin@school.com',
  password: 'password123'
})
```

### Teacher
```typescript
// Login with teacher code
const result = await loginWithTeacherCode(
  'TCH-2025-001',
  'password123'
)

// Or login with email
const result = await loginUser({
  email: 'teacher@school.com',
  password: 'password123'
})
```

### Student
```typescript
// Step 1: Validate student code
const codeCheck = await validateStudentCode('STU-2025-00001')

// Step 2: Register if valid
if (codeCheck.success) {
  const result = await registerStudent({
    email: 'student@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    studentCode: 'STU-2025-00001',
    // ... other fields
  })
}

// Step 3: Login
const result = await loginUser({
  email: 'student@example.com',
  password: 'password123'
})
```

### Parent
```typescript
// Parents are auto-created during student registration
// Login with credentials sent via email
const result = await loginUser({
  email: 'parent@example.com',
  password: 'temporaryPassword'
})
```

## 🛡️ Security Features

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Students can only view their own data
- Teachers can view students in their classes
- Parents can view their children's data
- Admins have full access

### Validation

- Email format validation
- Strong password requirements (8+ chars, uppercase, lowercase, number, special char)
- Phone number validation
- Code format validation
- Rate limiting on authentication endpoints

## 📊 Database Schema

### Key Tables

- `user_profiles` - Extended user information
- `admins` - Admin-specific data
- `teachers` - Teacher records with codes
- `students` - Student records with codes
- `parents` - Parent records
- `student_codes` - Pre-generated registration codes
- `classes` - Class/section information
- `subjects` - Subject catalog
- `attendance` - Daily attendance records
- `grades` - Student grades and results
- `announcements` - School announcements
- `assignments` - Homework and assignments

### Relationships

- Students ↔ Parents (many-to-many via `parent_student_links`)
- Students → Classes (many-to-one)
- Teachers → Subjects (many-to-many via `class_subjects`)
- Students → Attendance (one-to-many)
- Students → Grades (one-to-many)

## 🔧 Utilities

### Validation (`validation.ts`)

- Email, password, phone validation
- Code format validation
- Required field checking
- Rate limiting
- Authorization checks

### Helpers (`helpers.ts`)

- Date formatting and calculations
- Grade calculations
- Attendance percentage
- Pagination and sorting
- Academic year helpers

## 📝 Usage Examples

### Generate Student Codes (Admin)

```typescript
const result = await generateStudentCodes(100, adminId)
// Generates STU-2025-00001 through STU-2025-00100
```

### Create Teacher (Admin)

```typescript
const code = await generateTeacherCode()
const result = await createTeacher({
  email: 'teacher@school.com',
  password: 'temp123',
  firstName: 'Jane',
  lastName: 'Smith',
  teacherCode: code.code,
  subjectSpecialization: 'Mathematics',
  hireDate: '2025-01-01'
})
```

### Register Student with Parent

```typescript
const result = await registerStudent({
  // Student info
  email: 'student@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  studentCode: 'STU-2025-00001',
  dateOfBirth: '2010-05-15',
  gender: 'male',
  
  // Parent info
  parentEmail: 'parent@example.com',
  parentFirstName: 'Mary',
  parentLastName: 'Doe',
  parentPhone: '+1234567890',
  parentRelationship: 'mother'
})
```

## 🚨 Error Handling

All service functions return a consistent response format:

```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: "Error message"
}
```

## 📖 Documentation

- [AUTH.md](./AUTH.md) - Complete authentication documentation
- [schema.sql](./database/schema.sql) - Database schema with comments

## 🔄 Next Steps

1. ✅ Database schema created
2. ✅ Authentication services implemented
3. ✅ Student/Teacher services created
4. ⏳ Create Next.js API routes
5. ⏳ Build frontend components
6. ⏳ Test all authentication flows

## 🤝 Contributing

When adding new services:
1. Follow the existing service pattern
2. Add proper TypeScript types
3. Include error handling
4. Update this README
5. Add RLS policies if needed

---

**Last Updated:** October 21, 2025  
**Version:** 1.0
