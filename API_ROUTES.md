# API Routes Documentation

Complete reference for all API endpoints in the School Management System.

---

## 📍 Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

---

## 🔐 Authentication

All authenticated endpoints require a valid Supabase session cookie.

### Headers

```http
Content-Type: application/json
Cookie: sb-access-token=<token>; sb-refresh-token=<token>
```

---

## 📚 API Endpoints

### 1. Test Endpoint

#### Test Connection
- **Endpoint**: `GET /api/test`
- **Description**: Test if backend is working
- **Authentication**: Not required
- **Response**:
```json
{
  "success": true,
  "message": "Backend is working!",
  "timestamp": "2025-10-21T10:30:00.000Z",
  "environment": "development"
}
```

---

### 2. Authentication Endpoints

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: User login with email and password
- **Authentication**: Not required
- **Request Body**:
```json
{
  "email": "user@school.com",
  "password": "password123"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@school.com",
      "role": "student",
      "user_metadata": {
        "first_name": "John",
        "last_name": "Doe"
      }
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token"
    }
  }
}
```
- **Error Response (401)**:
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

#### Register
- **Endpoint**: `POST /api/auth/register`
- **Description**: Register new student with validation code
- **Authentication**: Not required
- **Request Body**:
```json
{
  "email": "newstudent@school.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "studentCode": "STU-2025-00001",
  "dateOfBirth": "2010-05-15",
  "phone": "+1234567890",
  "address": "123 Main St",
  "parentEmail": "parent@email.com",
  "parentName": "Jane Doe",
  "parentPhone": "+1234567890"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "newstudent@school.com"
    },
    "student": {
      "id": "uuid",
      "student_code": "STU-2025-00001",
      "status": "pending"
    }
  }
}
```
- **Error Response (400)**:
```json
{
  "success": false,
  "error": "Invalid student code"
}
```

#### Get Current User
- **Endpoint**: `GET /api/auth/user`
- **Description**: Get currently logged in user
- **Authentication**: Required
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@school.com",
      "role": "student"
    }
  }
}
```
- **Error Response (401)**:
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

#### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Description**: Logout current user
- **Authentication**: Required
- **Success Response (200)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 3. Student Code Validation

#### Validate Student Code
- **Endpoint**: `POST /api/validate/student-code`
- **Description**: Check if student code is valid and available
- **Authentication**: Not required
- **Request Body**:
```json
{
  "code": "STU-2025-00001"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "valid": true,
  "code": {
    "code": "STU-2025-00001",
    "status": "active",
    "expires_at": "2025-11-20T00:00:00.000Z"
  }
}
```
- **Invalid Code Response (200)**:
```json
{
  "success": true,
  "valid": false,
  "message": "Invalid or expired code"
}
```

---

### 4. Admin Endpoints

#### Generate Student Codes
- **Endpoint**: `POST /api/admin/codes`
- **Description**: Generate multiple student registration codes
- **Authentication**: Required (Admin only)
- **Request Body**:
```json
{
  "count": 50,
  "expiryDays": 90
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "codes": [
    "STU-2025-00001",
    "STU-2025-00002",
    "STU-2025-00003"
  ],
  "count": 50,
  "expiresAt": "2025-11-20T00:00:00.000Z"
}
```
- **Error Response (403)**:
```json
{
  "success": false,
  "error": "Permission denied"
}
```

#### Get All Codes
- **Endpoint**: `GET /api/admin/codes`
- **Description**: Get all generated student codes
- **Authentication**: Required (Admin only)
- **Query Parameters**:
  - `status` (optional): Filter by status (active, used, expired)
  - `limit` (optional): Number of codes to return (default: 100)
  - `offset` (optional): Pagination offset (default: 0)
- **Success Response (200)**:
```json
{
  "success": true,
  "codes": [
    {
      "id": "uuid",
      "code": "STU-2025-00001",
      "status": "active",
      "created_at": "2025-01-15T10:00:00.000Z",
      "expires_at": "2025-04-15T10:00:00.000Z",
      "used_by": null
    }
  ],
  "total": 100,
  "page": 1
}
```

---

### 5. Student Endpoints

#### Get All Students
- **Endpoint**: `GET /api/students`
- **Description**: Get list of all students
- **Authentication**: Required (Admin/Teacher)
- **Query Parameters**:
  - `status` (optional): Filter by status (active, pending, suspended)
  - `search` (optional): Search by name or email
  - `limit` (optional): Number of students (default: 50)
  - `offset` (optional): Pagination offset (default: 0)
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "student_code": "STU-2025-00001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@school.com",
        "date_of_birth": "2010-05-15",
        "phone": "+1234567890",
        "address": "123 Main St",
        "status": "active",
        "enrollment_date": "2025-01-15T00:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1
  }
}
```

#### Get Student by ID
- **Endpoint**: `GET /api/students/[id]`
- **Description**: Get detailed information about a specific student
- **Authentication**: Required (Admin/Teacher or own profile)
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "student_code": "STU-2025-00001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@school.com",
      "status": "active",
      "classes": [
        {
          "id": "uuid",
          "name": "Mathematics 101",
          "teacher": "Prof. Smith"
        }
      ],
      "grades": [
        {
          "subject": "Math",
          "grade": "A",
          "semester": "Fall 2025"
        }
      ]
    }
  }
}
```

#### Get Student by Code
- **Endpoint**: `GET /api/students/code/[code]`
- **Description**: Get student by their student code
- **Authentication**: Required (Admin/Teacher)
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "student_code": "STU-2025-00001",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

#### Update Student
- **Endpoint**: `PUT /api/students/[id]`
- **Description**: Update student information
- **Authentication**: Required (Admin or own profile)
- **Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "address": "456 New St",
  "status": "active"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

#### Delete Student
- **Endpoint**: `DELETE /api/students/[id]`
- **Description**: Delete student (soft delete - sets status to inactive)
- **Authentication**: Required (Admin only)
- **Success Response (200)**:
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

---

### 6. Teacher Endpoints

#### Get All Teachers
- **Endpoint**: `GET /api/teachers`
- **Description**: Get list of all teachers
- **Authentication**: Required (Admin)
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "teachers": [
      {
        "id": "uuid",
        "teacher_code": "TCH-2025-001",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@school.com",
        "specialization": "Mathematics",
        "status": "active"
      }
    ]
  }
}
```

#### Create Teacher
- **Endpoint**: `POST /api/teachers`
- **Description**: Create new teacher account
- **Authentication**: Required (Admin only)
- **Request Body**:
```json
{
  "email": "newteacher@school.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "specialization": "Mathematics",
  "phone": "+1234567890",
  "hireDate": "2025-01-15"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "teacher": {
      "id": "uuid",
      "teacher_code": "TCH-2025-001",
      "email": "newteacher@school.com"
    }
  }
}
```

---

### 7. Class Endpoints

#### Get All Classes
- **Endpoint**: `GET /api/classes`
- **Description**: Get list of all classes
- **Authentication**: Required
- **Query Parameters**:
  - `teacher_id` (optional): Filter by teacher
  - `semester` (optional): Filter by semester
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "uuid",
        "class_code": "MATH101",
        "class_name": "Mathematics 101",
        "teacher": {
          "id": "uuid",
          "name": "Prof. Smith"
        },
        "schedule": "Mon/Wed 10:00-11:30",
        "room": "Room 201",
        "capacity": 30,
        "enrolled": 25
      }
    ]
  }
}
```

#### Enroll Student
- **Endpoint**: `POST /api/classes/[id]/enroll`
- **Description**: Enroll student in a class
- **Authentication**: Required (Admin/Teacher)
- **Request Body**:
```json
{
  "student_id": "uuid"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "message": "Student enrolled successfully"
}
```

---

### 8. Attendance Endpoints

#### Mark Attendance
- **Endpoint**: `POST /api/attendance`
- **Description**: Mark student attendance for a class session
- **Authentication**: Required (Teacher)
- **Request Body**:
```json
{
  "class_id": "uuid",
  "student_id": "uuid",
  "date": "2025-10-21",
  "status": "present",
  "notes": "Optional notes"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "attendance": {
      "id": "uuid",
      "status": "present",
      "date": "2025-10-21"
    }
  }
}
```

#### Get Attendance
- **Endpoint**: `GET /api/attendance`
- **Description**: Get attendance records
- **Authentication**: Required
- **Query Parameters**:
  - `student_id` (optional): Filter by student
  - `class_id` (optional): Filter by class
  - `date` (optional): Filter by date
  - `start_date` (optional): Date range start
  - `end_date` (optional): Date range end
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "attendance": [
      {
        "id": "uuid",
        "student": "John Doe",
        "class": "Math 101",
        "date": "2025-10-21",
        "status": "present"
      }
    ],
    "statistics": {
      "total_days": 50,
      "present": 48,
      "absent": 2,
      "percentage": 96.0
    }
  }
}
```

---

### 9. Grade Endpoints

#### Add Grade
- **Endpoint**: `POST /api/grades`
- **Description**: Add grade for student in a class
- **Authentication**: Required (Teacher)
- **Request Body**:
```json
{
  "student_id": "uuid",
  "class_id": "uuid",
  "assessment_type": "exam",
  "score": 95.5,
  "max_score": 100,
  "assessment_date": "2025-10-20",
  "notes": "Midterm exam"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "grade": {
      "id": "uuid",
      "score": 95.5,
      "percentage": 95.5,
      "letter_grade": "A"
    }
  }
}
```

#### Get Grades
- **Endpoint**: `GET /api/grades`
- **Description**: Get grade records
- **Authentication**: Required
- **Query Parameters**:
  - `student_id` (optional): Filter by student
  - `class_id` (optional): Filter by class
  - `semester` (optional): Filter by semester
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "grades": [
      {
        "id": "uuid",
        "class_name": "Math 101",
        "assessment_type": "exam",
        "score": 95.5,
        "max_score": 100,
        "percentage": 95.5,
        "letter_grade": "A",
        "date": "2025-10-20"
      }
    ],
    "summary": {
      "gpa": 3.85,
      "total_assessments": 15,
      "average_percentage": 92.3
    }
  }
}
```

---

### 10. Assignment Endpoints

#### Create Assignment
- **Endpoint**: `POST /api/assignments`
- **Description**: Create new assignment for a class
- **Authentication**: Required (Teacher)
- **Request Body**:
```json
{
  "class_id": "uuid",
  "title": "Calculus Problem Set 1",
  "description": "Complete problems 1-20",
  "due_date": "2025-10-30T23:59:59Z",
  "max_points": 100
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": "uuid",
      "title": "Calculus Problem Set 1",
      "due_date": "2025-10-30T23:59:59Z"
    }
  }
}
```

#### Get Assignments
- **Endpoint**: `GET /api/assignments`
- **Description**: Get assignments
- **Authentication**: Required
- **Query Parameters**:
  - `class_id` (optional): Filter by class
  - `student_id` (optional): Filter by student (with submission status)
  - `status` (optional): Filter by status (upcoming, past_due, completed)
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "uuid",
        "title": "Calculus Problem Set 1",
        "class_name": "Math 101",
        "due_date": "2025-10-30T23:59:59Z",
        "max_points": 100,
        "status": "upcoming",
        "submission": null
      }
    ]
  }
}
```

#### Submit Assignment
- **Endpoint**: `POST /api/assignments/[id]/submit`
- **Description**: Submit assignment (student)
- **Authentication**: Required (Student)
- **Request Body**:
```json
{
  "submission_text": "My solution...",
  "file_url": "https://storage.supabase.co/..."
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "uuid",
      "submitted_at": "2025-10-21T15:30:00Z",
      "status": "submitted"
    }
  }
}
```

---

## 🔒 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |

---

## 📋 Common Error Responses

### Authentication Error
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

### Permission Error
```json
{
  "success": false,
  "error": "Permission denied"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### Database Error
```json
{
  "success": false,
  "error": "relation \"students\" does not exist",
  "hint": "Database tables not deployed"
}
```

---

## 🧪 Testing Endpoints

### Using cURL

```bash
# Test connection
curl http://localhost:3001/api/test

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@school.com","password":"password123"}'

# Get current user (with cookie)
curl http://localhost:3001/api/auth/user \
  -H "Cookie: sb-access-token=your-token"
```

### Using Postman

1. Import the collection (create JSON with endpoints)
2. Set base URL: `http://localhost:3001/api`
3. Add environment variables for tokens
4. Test each endpoint

### Using Frontend Test Page

Visit: http://localhost:3001/test

---

## 📊 Rate Limiting

Currently not implemented. Future considerations:
- 100 requests per minute per IP
- 1000 requests per hour per user
- Special limits for admin operations

---

## 🔄 Pagination

Endpoints that return lists support pagination:

```
GET /api/students?limit=50&offset=0
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 500,
    "limit": 50,
    "offset": 0,
    "page": 1,
    "total_pages": 10
  }
}
```

---

## 🔍 Search & Filtering

Many endpoints support search and filtering:

```
GET /api/students?search=john&status=active&limit=20
```

---

## 📝 Request/Response Format

### Standard Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🚀 Implementation Status

### ✅ Implemented Endpoints

- `GET /api/test`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/user`
- `POST /api/auth/logout`
- `POST /api/validate/student-code`

### ⏳ Pending Implementation

- `/api/students/*` - Student CRUD operations
- `/api/teachers/*` - Teacher management
- `/api/classes/*` - Class management
- `/api/attendance/*` - Attendance tracking
- `/api/grades/*` - Grade management
- `/api/assignments/*` - Assignment management
- `/api/admin/codes` - Code management

---

## 📖 Related Documentation

- [Frontend-Backend Integration](./FRONTEND_BACKEND_INTEGRATION.md)
- [Backend Documentation](./backend/BACKEND.md)
- [Authentication Guide](./backend/AUTH.md)
- [Deployment Steps](./DEPLOYMENT_STEPS.md)

---

**Complete API reference for the School Management System** 🎓

Last Updated: October 21, 2025
