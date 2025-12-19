# School Management System - Database Documentation

**Version:** 1.0  
**Last Updated:** December 19, 2025  
**Database:** PostgreSQL (Supabase)

---

## Table of Contents

1. [Overview](#overview)
2. [Complete Table Reference](#complete-table-reference)
3. [Table Relationships](#table-relationships)
4. [Data Types & Enums](#data-types--enums)
5. [Constraints & Indexes](#constraints--indexes)
6. [Key Features](#key-features)

---

## Overview

The School Management System database consists of **15 normalized tables** organized into 6 logical domains:

- **User Management** (4 tables) - Authentication and role-based users
- **Student Management** (3 tables) - Student profiles, codes, and parent links
- **Academic Structure** (4 tables) - Classes, subjects, and assignments
- **Academic Records** (2 tables) - Attendance and grades
- **Communication** (1 table) - Announcements
- **Assignments** (2 tables) - Assignment management and submissions

---

## Complete Table Reference

### 1. user_profiles

**Purpose:** Extended authentication profiles with role-based access  
**Inherits from:** Supabase `auth.users` table

| Column     | Type             | Nullable | Description                                  |
| ---------- | ---------------- | -------- | -------------------------------------------- |
| id         | UUID             | NO       | Primary key, references auth.users(id)       |
| role       | user_role (enum) | NO       | Role type: admin, teacher, student, parent   |
| first_name | VARCHAR(100)     | NO       | User first name                              |
| last_name  | VARCHAR(100)     | NO       | User last name                               |
| phone      | VARCHAR(20)      | YES      | Contact phone number                         |
| avatar_url | TEXT             | YES      | Profile picture URL                          |
| is_active  | BOOLEAN          | NO       | Account active status (default: true)        |
| created_at | TIMESTAMP        | NO       | Record creation timestamp                    |
| updated_at | TIMESTAMP        | NO       | Record last update (auto-triggers on update) |

**Indexes:** `idx_user_profiles_role`, `idx_user_profiles_active`

**Relationships:**

- ← Supabase `auth.users` (1:1 ON DELETE CASCADE)
- → `admins` (1:1 user_id FK)
- → `teachers` (1:1 user_id FK)
- → `students` (1:1 user_id FK)
- → `parents` (1:1 user_id FK)

---

### 2. admins

**Purpose:** Administrator-specific information

| Column     | Type         | Nullable | Description                               |
| ---------- | ------------ | -------- | ----------------------------------------- |
| id         | UUID         | NO       | Primary key                               |
| user_id    | UUID         | NO       | References user_profiles(id) UNIQUE       |
| department | VARCHAR(100) | YES      | Admin department (e.g., "Administration") |
| created_at | TIMESTAMP    | NO       | Record creation timestamp                 |
| updated_at | TIMESTAMP    | NO       | Record last update                        |

**Indexes:** `idx_admins_user_id`

**Relationships:**

- → `user_profiles` (1:1 user_id FK, ON DELETE CASCADE)

---

### 3. teachers

**Purpose:** Teacher profiles and qualifications

| Column                 | Type                  | Nullable | Description                                          |
| ---------------------- | --------------------- | -------- | ---------------------------------------------------- |
| id                     | UUID                  | NO       | Primary key                                          |
| user_id                | UUID                  | NO       | References user_profiles(id) UNIQUE                  |
| teacher_code           | VARCHAR(50)           | NO       | Unique teacher identifier (e.g., TCH-2025-001)       |
| subject_specialization | VARCHAR(100)          | YES      | Main subject expertise                               |
| qualification          | VARCHAR(200)          | YES      | Educational qualifications                           |
| hire_date              | DATE                  | NO       | Employment date                                      |
| status                 | teacher_status (enum) | NO       | Status: active, inactive, on_leave (default: active) |
| created_at             | TIMESTAMP             | NO       | Record creation timestamp                            |
| updated_at             | TIMESTAMP             | NO       | Record last update                                   |

**Indexes:** `idx_teachers_user_id`, `idx_teachers_code`, `idx_teachers_status`

**Unique Constraints:** `teacher_code` UNIQUE

**Relationships:**

- → `user_profiles` (1:1 user_id FK, ON DELETE CASCADE)
- ← `class_subjects` (1:N teacher_id FK)
- ← `attendance` (1:N marked_by FK)
- ← `grades` (1:N entered_by FK)
- ← `assignment_submissions` (1:N graded_by FK)

---

### 4. parents

**Purpose:** Parent/Guardian information

| Column     | Type         | Nullable | Description                         |
| ---------- | ------------ | -------- | ----------------------------------- |
| id         | UUID         | NO       | Primary key                         |
| user_id    | UUID         | NO       | References user_profiles(id) UNIQUE |
| occupation | VARCHAR(100) | YES      | Parent's occupation                 |
| address    | TEXT         | YES      | Residential address                 |
| created_at | TIMESTAMP    | NO       | Record creation timestamp           |
| updated_at | TIMESTAMP    | NO       | Record last update                  |

**Indexes:** `idx_parents_user_id`

**Relationships:**

- → `user_profiles` (1:1 user_id FK, ON DELETE CASCADE)
- ← `parent_student_links` (1:N parent_id FK)

---

### 5. student_codes

**Purpose:** Registration/enrollment codes for student onboarding

| Column       | Type               | Nullable | Description                                               |
| ------------ | ------------------ | -------- | --------------------------------------------------------- |
| id           | UUID               | NO       | Primary key                                               |
| code         | VARCHAR(50)        | NO       | Unique registration code (e.g., STU-2025-00001)           |
| status       | code_status (enum) | NO       | Status: available, used, expired (default: available)     |
| generated_by | UUID               | YES      | References admins(id) - who generated this code           |
| used_by      | UUID               | YES      | References auth.users(id) - who registered with this code |
| generated_at | TIMESTAMP          | NO       | Code generation timestamp (default: NOW())                |
| used_at      | TIMESTAMP          | YES      | When the code was used                                    |
| expires_at   | TIMESTAMP          | YES      | Code expiration date                                      |
| notes        | TEXT               | YES      | Additional notes about the code                           |

**Indexes:** `idx_student_codes_code`, `idx_student_codes_status`, `idx_student_codes_used_by`

**Unique Constraints:** `code` UNIQUE

**Relationships:**

- → `admins` (N:1 generated_by FK)
- → `auth.users` (N:1 used_by FK)

---

### 6. classes

**Purpose:** Physical classroom groups/sections

| Column        | Type        | Nullable | Description                                   |
| ------------- | ----------- | -------- | --------------------------------------------- |
| id            | UUID        | NO       | Primary key                                   |
| class_name    | VARCHAR(50) | NO       | Class name (e.g., "Mathematics", "Chemistry") |
| section       | VARCHAR(10) | NO       | Class section (e.g., "M1", "A1")              |
| grade_level   | INTEGER     | NO       | Grade/Year level                              |
| academic_year | VARCHAR(20) | NO       | Academic year (e.g., "2024-2025")             |
| room_number   | VARCHAR(20) | YES      | Classroom location/room number                |
| capacity      | INTEGER     | YES      | Max student capacity (default: 30)            |
| description   | TEXT        | YES      | Class description                             |
| is_active     | BOOLEAN     | NO       | Class active status (default: true)           |
| created_at    | TIMESTAMP   | NO       | Record creation timestamp                     |
| updated_at    | TIMESTAMP   | NO       | Record last update                            |

**Indexes:** `idx_classes_academic_year`, `idx_classes_active`

**Unique Constraints:** `UNIQUE(class_name, section, academic_year)`

**Relationships:**

- ← `students` (1:N class_id FK)
- ← `class_subjects` (1:N class_id FK)
- ← `attendance` (1:N class_id FK)
- ← `grades` (1:N class_id FK)
- ← `assignments` (1:N class_id FK)
- ← `announcements` (1:N class_id FK, optional)

---

### 7. students

**Purpose:** Student academic profiles

| Column                  | Type                     | Nullable | Description                                                                  |
| ----------------------- | ------------------------ | -------- | ---------------------------------------------------------------------------- |
| id                      | UUID                     | NO       | Primary key                                                                  |
| user_id                 | UUID                     | NO       | References user_profiles(id) UNIQUE                                          |
| student_code            | VARCHAR(50)              | NO       | Unique student identifier (e.g., STU-2025-00001)                             |
| date_of_birth           | DATE                     | NO       | Birth date for age calculation                                               |
| gender                  | gender_type (enum)       | NO       | Gender: male, female, other                                                  |
| address                 | TEXT                     | YES      | Residential address                                                          |
| class_id                | UUID                     | YES      | References classes(id) - assigned classroom                                  |
| enrollment_date         | DATE                     | NO       | Date of enrollment (default: CURRENT_DATE)                                   |
| enrollment_status       | enrollment_status (enum) | NO       | Status: active, graduated, transferred, suspended, pending (default: active) |
| emergency_contact_name  | VARCHAR(100)             | YES      | Emergency contact name                                                       |
| emergency_contact_phone | VARCHAR(20)              | YES      | Emergency contact phone                                                      |
| medical_notes           | TEXT                     | YES      | Medical information/allergies                                                |
| created_at              | TIMESTAMP                | NO       | Record creation timestamp                                                    |
| updated_at              | TIMESTAMP                | NO       | Record last update                                                           |

**Indexes:** `idx_students_user_id`, `idx_students_code`, `idx_students_class_id`, `idx_students_status`

**Unique Constraints:** `student_code` UNIQUE

**Relationships:**

- → `user_profiles` (1:1 user_id FK, ON DELETE CASCADE)
- → `classes` (N:1 class_id FK, optional)
- ← `parent_student_links` (1:N student_id FK)
- ← `attendance` (1:N student_id FK)
- ← `grades` (1:N student_id FK)
- ← `assignment_submissions` (1:N student_id FK)

---

### 8. parent_student_links

**Purpose:** Junction table for parent-student relationships (supports multiple parents per student)

| Column       | Type                     | Nullable | Description                                   |
| ------------ | ------------------------ | -------- | --------------------------------------------- |
| id           | UUID                     | NO       | Primary key                                   |
| parent_id    | UUID                     | NO       | References parents(id)                        |
| student_id   | UUID                     | NO       | References students(id)                       |
| relationship | relationship_type (enum) | NO       | Relationship: father, mother, guardian, other |
| is_primary   | BOOLEAN                  | NO       | Primary contact indicator (default: false)    |
| created_at   | TIMESTAMP                | NO       | Record creation timestamp                     |

**Indexes:** `idx_parent_student_parent`, `idx_parent_student_student`

**Unique Constraints:** `UNIQUE(parent_id, student_id)`

**Relationships:**

- → `parents` (N:1 parent_id FK, ON DELETE CASCADE)
- → `students` (N:1 student_id FK, ON DELETE CASCADE)

---

### 9. subjects

**Purpose:** Course/subject definitions

| Column       | Type         | Nullable | Description                                   |
| ------------ | ------------ | -------- | --------------------------------------------- |
| id           | UUID         | NO       | Primary key                                   |
| subject_name | VARCHAR(100) | NO       | Subject name (e.g., "Mathematics", "English") |
| subject_code | VARCHAR(20)  | NO       | Unique subject code (e.g., "MATH101")         |
| description  | TEXT         | YES      | Subject description and curriculum overview   |
| credit_hours | INTEGER      | YES      | Credit hours/units (default: 1)               |
| is_active    | BOOLEAN      | NO       | Subject active status (default: true)         |
| created_at   | TIMESTAMP    | NO       | Record creation timestamp                     |
| updated_at   | TIMESTAMP    | NO       | Record last update                            |

**Indexes:** `idx_subjects_code`, `idx_subjects_active`

**Unique Constraints:** `subject_code` UNIQUE

**Relationships:**

- ← `class_subjects` (1:N subject_id FK)
- ← `grades` (1:N subject_id FK)

---

### 10. class_subjects

**Purpose:** Junction table linking teachers, classes, and subjects (timetable management)

| Column        | Type        | Nullable | Description                                                     |
| ------------- | ----------- | -------- | --------------------------------------------------------------- |
| id            | UUID        | NO       | Primary key                                                     |
| class_id      | UUID        | NO       | References classes(id)                                          |
| subject_id    | UUID        | NO       | References subjects(id)                                         |
| teacher_id    | UUID        | YES      | References teachers(id) - assigned teacher (ON DELETE SET NULL) |
| academic_year | VARCHAR(20) | NO       | Academic year for this assignment                               |
| created_at    | TIMESTAMP   | NO       | Record creation timestamp                                       |
| updated_at    | TIMESTAMP   | NO       | Record last update                                              |

**Indexes:** `idx_class_subjects_class`, `idx_class_subjects_subject`, `idx_class_subjects_teacher`

**Unique Constraints:** `UNIQUE(class_id, subject_id, academic_year)`

**Relationships:**

- → `classes` (N:1 class_id FK, ON DELETE CASCADE)
- → `subjects` (N:1 subject_id FK, ON DELETE CASCADE)
- → `teachers` (N:1 teacher_id FK, ON DELETE SET NULL)

---

### 11. attendance

**Purpose:** Daily attendance tracking by class

| Column     | Type                     | Nullable | Description                                             |
| ---------- | ------------------------ | -------- | ------------------------------------------------------- |
| id         | UUID                     | NO       | Primary key                                             |
| student_id | UUID                     | NO       | References students(id)                                 |
| class_id   | UUID                     | NO       | References classes(id)                                  |
| date       | DATE                     | NO       | Attendance date                                         |
| status     | attendance_status (enum) | NO       | Status: present, absent, late, excused                  |
| marked_by  | UUID                     | NO       | References teachers(id) - teacher who marked attendance |
| remarks    | TEXT                     | YES      | Additional remarks/notes                                |
| created_at | TIMESTAMP                | NO       | Record creation timestamp                               |
| updated_at | TIMESTAMP                | NO       | Record last update                                      |

**Indexes:** `idx_attendance_student`, `idx_attendance_class`, `idx_attendance_date`, `idx_attendance_status`

**Unique Constraints:** `UNIQUE(student_id, class_id, date)`

**Relationships:**

- → `students` (N:1 student_id FK, ON DELETE CASCADE)
- → `classes` (N:1 class_id FK, ON DELETE CASCADE)
- → `teachers` (N:1 marked_by FK)

---

### 12. grades

**Purpose:** Student academic marks and grades

| Column         | Type              | Nullable | Description                                                          |
| -------------- | ----------------- | -------- | -------------------------------------------------------------------- |
| id             | UUID              | NO       | Primary key                                                          |
| student_id     | UUID              | NO       | References students(id)                                              |
| subject_id     | UUID              | NO       | References subjects(id)                                              |
| class_id       | UUID              | NO       | References classes(id)                                               |
| grade_type     | grade_type (enum) | NO       | Type: quiz, assignment, midterm, final, project                      |
| marks_obtained | DECIMAL(5,2)      | NO       | Marks scored                                                         |
| total_marks    | DECIMAL(5,2)      | NO       | Maximum possible marks                                               |
| percentage     | DECIMAL(5,2)      | NO       | **GENERATED:** Auto-calculated (marks_obtained / total_marks) \* 100 |
| grade_letter   | VARCHAR(2)        | YES      | Letter grade (A+, A, B+, etc.)                                       |
| exam_date      | DATE              | YES      | Date of exam/assessment                                              |
| remarks        | TEXT              | YES      | Teacher remarks/feedback                                             |
| entered_by     | UUID              | NO       | References teachers(id) - teacher who entered grade                  |
| created_at     | TIMESTAMP         | NO       | Record creation timestamp                                            |
| updated_at     | TIMESTAMP         | NO       | Record last update                                                   |

**Indexes:** `idx_grades_student`, `idx_grades_subject`, `idx_grades_class`, `idx_grades_type`, `idx_grades_date`

**Relationships:**

- → `students` (N:1 student_id FK, ON DELETE CASCADE)
- → `subjects` (N:1 subject_id FK, ON DELETE CASCADE)
- → `classes` (N:1 class_id FK, ON DELETE CASCADE)
- → `teachers` (N:1 entered_by FK)

---

### 13. announcements

**Purpose:** School-wide notifications and announcements

| Column       | Type         | Nullable | Description                                                   |
| ------------ | ------------ | -------- | ------------------------------------------------------------- |
| id           | UUID         | NO       | Primary key                                                   |
| title        | VARCHAR(200) | NO       | Announcement title                                            |
| content      | TEXT         | NO       | Full announcement content                                     |
| created_by   | UUID         | NO       | References user_profiles(id) - creator                        |
| target_role  | user_role[]  | YES      | Array of target roles (e.g., ['student', 'parent'])           |
| class_id     | UUID         | YES      | References classes(id) - optional class-specific announcement |
| priority     | VARCHAR(20)  | NO       | Priority: low, normal, high, urgent (default: normal)         |
| is_published | BOOLEAN      | NO       | Publication status (default: false)                           |
| published_at | TIMESTAMP    | YES      | When the announcement was published                           |
| expires_at   | TIMESTAMP    | YES      | Expiration date for the announcement                          |
| created_at   | TIMESTAMP    | NO       | Record creation timestamp                                     |
| updated_at   | TIMESTAMP    | NO       | Record last update                                            |

**Indexes:** `idx_announcements_created_by`, `idx_announcements_class`, `idx_announcements_published`

**Relationships:**

- → `user_profiles` (N:1 created_by FK)
- → `classes` (N:1 class_id FK, optional)

---

### 14. assignments

**Purpose:** Assignment management and distribution

| Column       | Type         | Nullable | Description                                                     |
| ------------ | ------------ | -------- | --------------------------------------------------------------- |
| id           | UUID         | NO       | Primary key                                                     |
| class_id     | UUID         | YES      | References classes(id)                                          |
| title        | VARCHAR(200) | NO       | Assignment title                                                |
| description  | TEXT         | YES      | Detailed assignment description                                 |
| type         | VARCHAR(50)  | NO       | Type: assignment, quiz, homework, project (default: assignment) |
| due_date     | DATE         | YES      | Assignment due date                                             |
| max_score    | INTEGER      | YES      | Maximum score (default: 100)                                    |
| instructions | TEXT         | YES      | Detailed instructions for students                              |
| file_url     | TEXT         | YES      | Attachment file URL                                             |
| file_name    | VARCHAR(255) | YES      | Original filename                                               |
| status       | VARCHAR(50)  | NO       | Status: active, archived, draft (default: active)               |
| created_by   | UUID         | YES      | References user_profiles(id) - creator                          |
| created_at   | TIMESTAMP    | NO       | Record creation timestamp                                       |
| updated_at   | TIMESTAMP    | NO       | Record last update                                              |

**Indexes:** `idx_assignments_class_id`, `idx_assignments_type`, `idx_assignments_status`, `idx_assignments_due_date`, `idx_assignments_created_by`

**Relationships:**

- → `classes` (N:1 class_id FK, ON DELETE CASCADE)
- → `user_profiles` (N:1 created_by FK)
- ← `assignment_submissions` (1:N assignment_id FK)

---

### 15. assignment_submissions

**Purpose:** Track student submissions for assignments

| Column          | Type         | Nullable | Description                                                   |
| --------------- | ------------ | -------- | ------------------------------------------------------------- |
| id              | UUID         | NO       | Primary key                                                   |
| assignment_id   | UUID         | NO       | References assignments(id)                                    |
| student_id      | UUID         | NO       | References students(id)                                       |
| submission_text | TEXT         | YES      | Text-based submission content                                 |
| file_url        | TEXT         | YES      | Submitted file URL                                            |
| file_name       | VARCHAR(255) | YES      | Submitted filename                                            |
| submitted_at    | TIMESTAMP    | NO       | Submission timestamp (default: NOW())                         |
| grade           | DECIMAL(5,2) | YES      | Grade/score assigned                                          |
| feedback        | TEXT         | YES      | Teacher feedback on submission                                |
| graded_by       | UUID         | YES      | References teachers(id) - teacher who graded                  |
| graded_at       | TIMESTAMP    | YES      | When the submission was graded                                |
| status          | VARCHAR(50)  | NO       | Status: submitted, graded, late, missing (default: submitted) |
| created_at      | TIMESTAMP    | NO       | Record creation timestamp                                     |
| updated_at      | TIMESTAMP    | NO       | Record last update                                            |

**Indexes:** `idx_assignment_submissions_assignment`, `idx_assignment_submissions_student`, `idx_assignment_submissions_status`

**Unique Constraints:** `UNIQUE(assignment_id, student_id)`

**Relationships:**

- → `assignments` (N:1 assignment_id FK, ON DELETE CASCADE)
- → `students` (N:1 student_id FK, ON DELETE CASCADE)
- → `teachers` (N:1 graded_by FK)

---

## Table Relationships

### Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Auth (auth.users)                   │
└────────────────┬────────────────────────────────────────────────┘
                 │ 1:1 (id)
                 ↓
         ┌─────────────────────┐
         │   user_profiles     │ ← Main user table with role
         │  (role: enum)       │
         └─────┬───────────────┘
              │
      ┌───────┼───────┬──────────┐
      │       │       │          │
      1:1     1:1     1:1        1:1
      │       │       │          │
      ↓       ↓       ↓          ↓
    admins teachers students  parents
                │       │         │
                │       │    (1:N parent_student_links)
                │       │         │
            (1:N)   (1:N)    ←─────┘
                │       │
         class_subjects students
                │       │
         (N:1)  │       │ (N:1)
                │       │
         ┌──────┴───────┴──────┐
         │    classes          │
         │ (Master class list) │
         └──────┬──────────────┘
                │
         (1:N)  │
    ┌───────────┼───────────┬──────────────┬──────────┐
    │           │           │              │          │
    ↓           ↓           ↓              ↓          ↓
attendance   grades   assignments   announcements  (students)
                          │
                     (1:N)│
                          ↓
                  assignment_submissions
```

### Key Relationship Patterns

**User Management Hierarchy:**

```
auth.users (Supabase)
    ↓ 1:1 with id
user_profiles (role)
    ├─→ admins (admin users)
    ├─→ teachers (teacher users)
    ├─→ students (student users)
    └─→ parents (parent users)
```

**Class-Centered Academic Data:**

```
classes (Physical classroom)
    ├─→ students (N:1) - Students assigned to classes
    ├─→ class_subjects (1:N) - Subjects taught in class
    │   └─→ teachers via class_subjects
    ├─→ attendance (1:N) - Daily attendance per student per class
    ├─→ grades (1:N) - Student grades per subject per class
    └─→ assignments (1:N) - Assignments for class
        └─→ assignment_submissions (N:1)
```

**Parent-Student Relationships:**

```
parents (1:N)
    ↓
parent_student_links (Junction)
    ↓ N:1
students
```

**Teacher-Subject-Class Assignment:**

```
teachers → class_subjects ← subjects
           ↓
        classes
```

---

## Data Types & Enums

### ENUM Types

**user_role**

```
- admin: System administrators
- teacher: Teaching staff
- student: Student users
- parent: Parent/Guardian users
```

**code_status**

```
- available: Code ready to use
- used: Code has been used for registration
- expired: Code has expired
```

**enrollment_status**

```
- active: Currently enrolled
- graduated: Completed program
- transferred: Transferred to another school
- suspended: Temporarily suspended
- pending: Pending activation
```

**teacher_status**

```
- active: Currently teaching
- inactive: Not active
- on_leave: On leave (temporary)
```

**attendance_status**

```
- present: Student was present
- absent: Student was absent
- late: Student arrived late
- excused: Absence was excused
```

**gender_type**

```
- male: Male
- female: Female
- other: Other
```

**relationship_type**

```
- father: Father
- mother: Mother
- guardian: Guardian
- other: Other relationship
```

**grade_type**

```
- quiz: Quiz assessment
- assignment: Assignment submission
- midterm: Midterm exam
- final: Final exam
- project: Project work
```

### Data Types Used

| Type                     | Description                                  |
| ------------------------ | -------------------------------------------- |
| UUID                     | Universally unique identifier (primary keys) |
| VARCHAR(n)               | Variable-length strings with max length      |
| TEXT                     | Unlimited-length text                        |
| DATE                     | Calendar date (YYYY-MM-DD)                   |
| TIMESTAMP WITH TIME ZONE | Date and time with timezone                  |
| INTEGER                  | Whole numbers                                |
| DECIMAL(5,2)             | Fixed-point decimals (precision, scale)      |
| BOOLEAN                  | True/False values                            |
| ENUM                     | User-defined enumerated types                |
| ARRAY                    | Array of types (e.g., user_role[])           |

---

## Constraints & Indexes

### Primary Constraints

| Constraint Type    | Count | Purpose                              |
| ------------------ | ----- | ------------------------------------ |
| PRIMARY KEY        | 15    | Unique identifier per table          |
| FOREIGN KEY        | ~25   | Referential integrity                |
| UNIQUE             | 8     | Prevent duplicates (codes, emails)   |
| NOT NULL           | ~60   | Mandatory field enforcement          |
| ON DELETE CASCADE  | ~15   | Auto-delete dependent records        |
| ON DELETE SET NULL | 2     | Preserve parent, nullify foreign key |

### Key Unique Constraints

```sql
-- Classes: Prevent duplicate class definitions per year
UNIQUE(class_name, section, academic_year)

-- Student Codes: Each code can only be used once
UNIQUE(code)

-- Teachers: Unique teacher codes
UNIQUE(teacher_code)

-- Subjects: Unique subject codes
UNIQUE(subject_code)

-- Class-Subjects: One subject per class per year
UNIQUE(class_id, subject_id, academic_year)

-- Attendance: One attendance record per student per class per day
UNIQUE(student_id, class_id, date)

-- Parent-Student: Prevent duplicate parent-child links
UNIQUE(parent_id, student_id)

-- Assignment Submissions: One submission per student per assignment
UNIQUE(assignment_id, student_id)
```

### Indexes for Performance

**Core User Lookups:**

- `idx_user_profiles_role` - Filter users by role
- `idx_user_profiles_active` - Find active users
- `idx_admins_user_id` - Find admin by user
- `idx_teachers_user_id` - Find teacher by user
- `idx_teachers_code` - Find teacher by code
- `idx_teachers_status` - Filter by teacher status
- `idx_parents_user_id` - Find parent by user

**Student Lookups:**

- `idx_students_user_id` - Find student by user
- `idx_students_code` - Find student by code
- `idx_students_class_id` - Find students by class
- `idx_students_status` - Filter by enrollment status
- `idx_student_codes_code` - Find student code by value
- `idx_student_codes_status` - Filter codes by status
- `idx_student_codes_used_by` - Find codes used by user

**Academic Lookups:**

- `idx_classes_academic_year` - Find classes by year
- `idx_classes_active` - Filter active classes
- `idx_subjects_code` - Find subject by code
- `idx_subjects_active` - Filter active subjects
- `idx_class_subjects_class` - Find subjects for class
- `idx_class_subjects_subject` - Find classes for subject
- `idx_class_subjects_teacher` - Find assignments for teacher

**Academic Records:**

- `idx_attendance_student` - Find attendance by student
- `idx_attendance_class` - Find attendance by class
- `idx_attendance_date` - Query attendance by date
- `idx_attendance_status` - Filter by attendance status
- `idx_grades_student` - Find grades by student
- `idx_grades_subject` - Find grades by subject
- `idx_grades_class` - Find grades by class
- `idx_grades_type` - Filter grades by type
- `idx_grades_date` - Query grades by date

**Communications:**

- `idx_announcements_created_by` - Find announcements by creator
- `idx_announcements_class` - Find class-specific announcements
- `idx_announcements_published` - Filter published announcements
- `idx_assignments_class_id` - Find assignments for class
- `idx_assignments_type` - Filter assignments by type
- `idx_assignments_status` - Filter by status
- `idx_assignments_due_date` - Query by due date
- `idx_assignments_created_by` - Find assignments by creator
- `idx_assignment_submissions_assignment` - Find submissions for assignment
- `idx_assignment_submissions_student` - Find submissions by student
- `idx_assignment_submissions_status` - Filter submissions by status

---

## Key Features

### Automatic Features

✅ **Timestamp Automation**

- `created_at`: Auto-set on record creation
- `updated_at`: Auto-updated on every modification via trigger
- Database function: `update_updated_at_column()`

✅ **Cascading Operations**

- Deleting a user automatically deletes related admins, teachers, students, parents
- Deleting a class cascades to students, attendance, grades, assignments
- Deleting assignments cascades to submissions
- Some deletions SET NULL instead to preserve historical data

✅ **Generated Columns**

- `grades.percentage`: Auto-calculated from marks_obtained/total_marks

✅ **Code Generation Functions**

```
generate_teacher_code() → "TCH-2025-001"
generate_student_code() → "STU-2025-00001"
calculate_grade_letter(percentage) → "A+", "B-", etc.
```

### Security Features

✅ **Row Level Security (RLS)**

- All tables have RLS enabled
- 15+ RLS policies control access by role
- Users can only see their own data (or data they're authorized to see)
- Admin users have full access

✅ **Access Control by Role**

- **Admin**: Full CRUD on all tables
- **Teacher**: Can manage their class assignments, mark attendance, enter grades
- **Student**: Can view own grades, attendance, announcements
- **Parent**: Can view their child's grades, attendance, assignments

✅ **Authentication**

- All user data linked to Supabase Auth
- Deletion of auth user cascades to user_profiles and related records

### Query Optimization

✅ **Indexes on Foreign Keys**

- All FK relationships are indexed for join performance
- Date/status columns indexed for filtering

✅ **Denormalization Strategies**

- `student_enrollments` table references both student and class
- Allows fast lookups without complex joins

✅ **Unique Constraints as Indexes**

- Multi-column UNIQUE constraints serve double duty as indexes

---

## Common Queries

### Get Student with Class Info

```sql
SELECT
  s.student_code,
  up.first_name || ' ' || up.last_name as student_name,
  c.class_name,
  c.section,
  s.enrollment_status
FROM students s
JOIN user_profiles up ON s.user_id = up.id
JOIN classes c ON s.class_id = c.id
WHERE s.id = 'student-uuid';
```

### Get Teacher's Assigned Classes and Subjects

```sql
SELECT
  t.teacher_code,
  up.first_name || ' ' || up.last_name as teacher_name,
  c.class_name,
  c.section,
  s.subject_name
FROM teachers t
JOIN user_profiles up ON t.user_id = up.id
JOIN class_subjects cs ON t.id = cs.teacher_id
JOIN classes c ON cs.class_id = c.id
JOIN subjects s ON cs.subject_id = s.id
WHERE t.id = 'teacher-uuid'
ORDER BY c.class_name, s.subject_name;
```

### Get Student's Parent Information

```sql
SELECT
  s.student_code,
  psl.relationship,
  up_parent.first_name || ' ' || up_parent.last_name as parent_name,
  up_parent.phone
FROM students s
JOIN parent_student_links psl ON psl.student_id = s.id
JOIN parents p ON psl.parent_id = p.id
JOIN user_profiles up_parent ON p.user_id = up_parent.id
WHERE s.id = 'student-uuid'
ORDER BY psl.is_primary DESC;
```

### Get Class Attendance Summary

```sql
SELECT
  s.student_code,
  up.first_name || ' ' || up.last_name as student_name,
  COUNT(*) as total_days,
  COUNT(*) FILTER (WHERE a.status = 'present') as present_days,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent_days,
  ROUND(
    (COUNT(*) FILTER (WHERE a.status = 'present')::DECIMAL / COUNT(*)) * 100,
    2
  ) as attendance_percentage
FROM attendance a
JOIN students s ON s.id = a.student_id
JOIN user_profiles up ON up.id = s.user_id
WHERE a.class_id = 'class-uuid'
  AND a.date >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.student_code, up.first_name, up.last_name
ORDER BY attendance_percentage DESC;
```

### Get Student's Recent Grades by Subject

```sql
SELECT
  s.subject_name,
  g.grade_type,
  g.marks_obtained,
  g.total_marks,
  g.percentage,
  g.grade_letter,
  g.exam_date
FROM grades g
JOIN subjects s ON g.subject_id = s.id
WHERE g.student_id = 'student-uuid'
ORDER BY g.exam_date DESC;
```

---

## Database Maintenance

### Regular Backups

- Automated daily backups via Supabase
- Point-in-time recovery available

### Cleanup Tasks

- Archive old announcements (expires_at < NOW())
- Archive old assignments (due_date < NOW() - INTERVAL '6 months')
- Expire old student codes (expires_at < NOW())

### Monitoring

- Monitor RLS policy performance
- Check index usage and rebuild as needed
- Monitor table sizes and growth trends

---

## Revision History

| Version | Date         | Changes                                    |
| ------- | ------------ | ------------------------------------------ |
| 1.0     | Dec 19, 2025 | Initial comprehensive schema documentation |
