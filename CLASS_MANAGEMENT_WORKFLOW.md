# Class Management System Workflow

## Overview

This document explains the complete workflow for the School Management System, from creating timetables to students joining classes.

## System Architecture

### Core Concepts

1. **Homeroom Classes** (`classes` table)
   - Represents student groupings by grade/department (e.g., "ITE Year 3", "CS Year 2")
   - Used for administrative purposes and student organization
   - Has a unique `class_code` for identification

2. **Subjects** (`subjects` table)
   - Individual subjects offered (e.g., Mathematics, Physics, English)
   - Has `subject_code`, `subject_name`, and `credit_hours`
   - Reusable across different classes and semesters

3. **Timetable** (`time_slots` table)
   - Defines available time periods for scheduling
   - Organized by day of week, start time, and end time
   - Managed by administrator

4. **Subject Classes** (`subject_classes` table)
   - Actual class offerings that students attend
   - Links a subject with a teacher, time slot, and room
   - Example: "Math M1 Lecture - Monday 7-8 AM - Room 301"
   - Has a unique `join_code` for student enrollment

5. **Student Enrollments** (`student_enrollments` table)
   - Tracks which students are enrolled in which subject classes
   - Stores enrollment method (admin, self-join, automatic)
   - Tracks enrollment status (active, dropped, completed)

## Workflow Steps

### 1. Administrator Creates Timetable

**Purpose:** Establish the master schedule framework

**Steps:**
1. Admin logs into the admin dashboard
2. Navigate to "Timetable" tab
3. Create time slots by specifying:
   - Day of week (Monday - Friday)
   - Start time (e.g., 07:00)
   - End time (e.g., 08:00)
   - Academic year (e.g., 2024-2025)

**API Endpoint:** `POST /api/timetable`

**Example:**
```json
{
  "day_of_week": "Monday",
  "start_time": "07:00",
  "end_time": "08:00",
  "academic_year": "2024-2025"
}
```

**Database Result:**
- Time slot is created in `time_slots` table
- Available for use when creating subject classes

---

### 2. Administrator/Teacher Creates Subject Classes

**Purpose:** Create actual class offerings based on the timetable

**Who Can Do This:**
- Administrator (can create for any teacher)
- Teacher (can create for themselves)

**Steps:**
1. Navigate to "Classes" tab
2. Click "Create Class" button
3. Fill in class details:
   - **Subject:** Select from existing subjects (Math, Physics, etc.)
   - **Teacher:** Assign teacher to this class
   - **Schedule:** 
     - Day of week
     - Start time
     - End time
   - **Location:** Room number
   - **Details:**
     - Class type (Lecture, Practice, Lab, Tutorial)
     - Section (M1, M2, A, B, etc.)
     - Capacity (max students)
     - Academic year
     - Semester
4. System automatically generates a unique join code
5. Click "Create"

**API Endpoint:** `POST /api/subject-classes`

**Example:**
```json
{
  "subject_id": "uuid-of-math-subject",
  "teacher_id": "uuid-of-teacher",
  "day_of_week": "Monday",
  "start_time": "07:00",
  "end_time": "08:00",
  "room_number": "301",
  "class_type": "lecture",
  "section": "M1",
  "capacity": 30,
  "academic_year": "2024-2025",
  "semester": "Fall 2024"
}
```

**Database Result:**
- Subject class created with unique `join_code` (e.g., "ABC123XY")
- Available for student enrollment

**Example Scenario:**

A teacher has two Math classes:
- **Math M1 Lecture**
  - Monday 7:00-8:00 AM
  - Room 301
  - Join Code: ABC123XY
  - Capacity: 30 students

- **Math M2 Practice**
  - Monday 8:00-9:00 AM  
  - Room 101
  - Join Code: DEF456ZW
  - Capacity: 25 students

---

### 3. Administrator Assigns Students to Classes

**Purpose:** Enroll students in subject classes administratively

**Steps:**
1. Navigate to "Students" tab
2. Select a student
3. Click "Assign Classes"
4. Select subject classes to enroll the student in
5. Click "Assign"

**API Endpoint:** `POST /api/student-enrollments`

**Example:**
```json
{
  "student_id": "uuid-of-student",
  "subject_class_id": "uuid-of-subject-class",
  "enrollment_method": "admin"
}
```

**Alternative Bulk Assignment:**
- Select multiple students
- Assign all to the same class at once

---

### 4. Students Join Classes Using Join Code

**Purpose:** Allow students to self-enroll in available classes

**Steps:**
1. Student logs into student dashboard
2. Navigate to "My Classes" or "Join Class"
3. Enter the join code provided by teacher (e.g., "ABC123XY")
4. System validates:
   - Code is valid
   - Class is not full
   - Student is not already enrolled
5. Click "Join"
6. Student is enrolled in the class

**API Endpoint:** `POST /api/student-enrollments`

**Example:**
```json
{
  "join_code": "ABC123XY"
}
```

**System Checks:**
- ✅ Join code exists and is valid
- ✅ Class has available capacity
- ✅ Student is not already enrolled
- ✅ Class is active

**Success Response:**
- Student is enrolled
- Class appears in student's dashboard
- Student can see class schedule, teacher, room

---

## User Interfaces

### Admin Dashboard

**Tabs:**
1. **Overview** - System statistics
2. **Students** - Manage students, assign to classes
3. **Teachers** - Manage teachers
4. **Timetable** - Create and manage time slots
5. **Subjects** - Manage available subjects
6. **Classes** - Create and manage subject class offerings
7. **Enrollments** - View and manage student enrollments

**Key Features:**
- Create timetable slots
- Create subject classes
- Assign teachers to classes
- Assign students to classes
- View enrollment statistics
- Export reports

---

### Teacher Dashboard

**Tabs:**
1. **Overview** - Teacher statistics
2. **My Classes** - View and manage assigned classes
3. **Attendance** - Mark attendance for classes
4. **Grades** - Enter grades for students
5. **Students** - View enrolled students

**My Classes View:**
Each class card shows:
- Subject name (e.g., "Mathematics")
- Section (e.g., "M1 Lecture")
- Schedule (e.g., "Monday 7:00-8:00 AM")
- Room (e.g., "Room 301")
- Join Code (e.g., "ABC123XY")
- Enrolled students count (e.g., "28/30")

**Actions:**
- View students in class
- Mark attendance
- Enter grades
- Edit class details
- View class schedule

---

### Student Dashboard

**Tabs:**
1. **Overview** - Student statistics
2. **My Classes** - View enrolled classes
3. **Join Class** - Join using join code
4. **Attendance** - View attendance records
5. **Grades** - View grades

**My Classes View:**
Each class card shows:
- Subject name (e.g., "Mathematics")
- Teacher name (e.g., "Dr. Sarah Miller")
- Schedule (e.g., "Monday 7:00-8:00 AM")
- Room (e.g., "Room 301")
- Current grade (if available)

**Join Class:**
- Input field for join code
- "Join" button
- List of available classes (optional)

---

## Database Schema Reference

### time_slots
```sql
id UUID PRIMARY KEY
day_of_week VARCHAR(10) -- Monday, Tuesday, etc.
start_time TIME
end_time TIME
academic_year VARCHAR(20)
is_active BOOLEAN
```

### subjects
```sql
id UUID PRIMARY KEY
subject_name VARCHAR(100)
subject_code VARCHAR(20)
description TEXT
credit_hours INTEGER
is_active BOOLEAN
```

### subject_classes
```sql
id UUID PRIMARY KEY
subject_id UUID REFERENCES subjects(id)
teacher_id UUID REFERENCES teachers(id)
day_of_week VARCHAR(10)
start_time TIME
end_time TIME
room_number VARCHAR(20)
capacity INTEGER
class_type VARCHAR(50) -- lecture, practice, lab, tutorial
section VARCHAR(10) -- M1, M2, A, B, etc.
academic_year VARCHAR(20)
semester VARCHAR(20)
join_code VARCHAR(20) UNIQUE -- e.g., ABC123XY
is_active BOOLEAN
```

### student_enrollments
```sql
id UUID PRIMARY KEY
student_id UUID REFERENCES students(id)
subject_class_id UUID REFERENCES subject_classes(id)
enrollment_method VARCHAR(20) -- admin, self-join, automatic
enrollment_status VARCHAR(20) -- active, dropped, completed
final_grade DECIMAL(5,2)
grade_letter VARCHAR(2)
enrolled_at TIMESTAMP
```

---

## Example User Journey

### Scenario: Student A Enrolls in ITE Department Classes

**Background:**
- Student A is in ITE Year 3
- Department offers 7 subjects
- Each subject has multiple class sections

**Step-by-Step:**

1. **Admin Creates Timetable** (Monday-Friday, 7 AM - 5 PM slots)

2. **Teachers Create Classes:**
   - Prof. Smith creates "Math M1 Lecture" (Mon 7-8 AM, Room 301, Code: ABC123)
   - Prof. Smith creates "Math M2 Practice" (Mon 8-9 AM, Room 101, Code: DEF456)
   - Prof. Johnson creates "Physics Lecture" (Tue 10-11 AM, Room 205, Code: GHI789)
   - ... and so on for 7 subjects

3. **Student A Logs In:**
   - Sees "Join Class" option
   - Teacher provides join codes (or posted on class board)

4. **Student A Joins Classes:**
   - Enters "ABC123" → Enrolled in Math M1 Lecture
   - Enters "DEF456" → Enrolled in Math M2 Practice
   - Enters "GHI789" → Enrolled in Physics Lecture
   - ... joins all 7 subject classes

5. **Student A's Dashboard Now Shows:**
   ```
   My Classes (7 Active)
   
   📚 Mathematics M1 Lecture
   Monday 7:00-8:00 AM • Room 301 • Prof. Smith
   [View] [Attendance] [Grades]
   
   📚 Mathematics M2 Practice
   Monday 8:00-9:00 AM • Room 101 • Prof. Smith
   [View] [Attendance] [Grades]
   
   🔬 Physics Lecture
   Tuesday 10:00-11:00 AM • Room 205 • Prof. Johnson
   [View] [Attendance] [Grades]
   
   ... (4 more classes)
   ```

6. **Teacher Dashboard Shows:**
   ```
   My Classes (3 Active)
   
   Math M1 Lecture
   Monday 7:00-8:00 AM • Room 301
   Join Code: ABC123
   Enrolled: 28/30 students
   [Mark Attendance] [Enter Grades] [View Students]
   
   Math M2 Practice
   Monday 8:00-9:00 AM • Room 101
   Join Code: DEF456
   Enrolled: 25/25 students (FULL)
   [Mark Attendance] [Enter Grades] [View Students]
   ```

---

## Migration Guide

### From Old System to New System

**Old System Issues:**
- `classes` table was used for both homeroom classes AND subject classes (confusing)
- No distinction between "Math as a subject" and "Math M1 Lecture on Monday 7 AM"
- No join code system
- No enrollment tracking

**New System Benefits:**
- ✅ Clear separation: homeroom classes vs subject classes
- ✅ Timetable-based scheduling
- ✅ Join code system for easy enrollment
- ✅ Comprehensive enrollment tracking
- ✅ Support for multiple sections of same subject

**Migration Steps:**

1. **Run Schema Updates:**
   ```sql
   -- Execute schema_updates.sql in Supabase SQL Editor
   ```

2. **Migrate Existing Data:**
   - Map old `classes` records to new `subject_classes`
   - Create corresponding `subjects` if needed
   - Generate join codes for existing classes

3. **Update APIs:**
   - Use new endpoints (`/api/subject-classes`, `/api/student-enrollments`)
   - Deprecate old `/api/classes` endpoint

4. **Update Frontend:**
   - Use new dashboard components
   - Implement join code functionality
   - Show class details properly

---

## API Endpoints Reference

### Timetable Management
- `GET /api/timetable` - Get all time slots
- `POST /api/timetable` - Create time slot
- `DELETE /api/timetable?id=xxx` - Delete time slot

### Subject Management
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject

### Subject Class Management
- `GET /api/subject-classes` - Get all subject classes
- `GET /api/subject-classes?teacher_id=xxx` - Get teacher's classes
- `POST /api/subject-classes` - Create subject class
- `PATCH /api/subject-classes` - Update subject class
- `DELETE /api/subject-classes?id=xxx` - Delete subject class

### Student Enrollment Management
- `GET /api/student-enrollments?student_id=xxx` - Get student's enrollments
- `GET /api/student-enrollments?subject_class_id=xxx` - Get class enrollments
- `POST /api/student-enrollments` - Enroll student (with join_code or admin)
- `DELETE /api/student-enrollments?id=xxx` - Drop enrollment

---

## Best Practices

### For Administrators
1. Create timetable slots at the beginning of each academic year
2. Create subjects library before scheduling classes
3. Use consistent naming for sections (M1, M2, etc.)
4. Monitor class capacity and create additional sections if needed
5. Export enrollment reports regularly

### For Teachers
1. Share join codes with students clearly
2. Create classes well before semester starts
3. Monitor enrollment numbers
4. Use descriptive class types (Lecture, Practice, Lab)
5. Keep room numbers accurate

### For Students
1. Join classes as soon as join codes are provided
2. Verify schedule to avoid conflicts
3. Check class capacity before joining
4. Contact teacher if join code doesn't work

---

## Troubleshooting

### Common Issues

**Problem:** "Join code not found"
- **Solution:** Verify code is entered correctly (case-sensitive)
- Check if class is still active
- Contact teacher for correct code

**Problem:** "Class is full"
- **Solution:** Contact teacher for additional section
- Ask admin to increase capacity if room allows

**Problem:** "Already enrolled"
- **Solution:** Check My Classes to see existing enrollment
- Contact admin if you see duplicate classes

**Problem:** "Time conflict"
- **Solution:** Review your schedule
- Choose different section of same subject
- Contact advisor for guidance

---

## Security & Permissions

### Role-Based Access Control

**Admin:**
- ✅ Create/edit/delete timetable
- ✅ Create/edit/delete subjects
- ✅ Create/edit/delete subject classes
- ✅ Assign students to classes
- ✅ View all enrollments

**Teacher:**
- ✅ Create subject classes for themselves
- ✅ Edit their own classes
- ✅ View students in their classes
- ✅ Mark attendance
- ✅ Enter grades
- ❌ Cannot assign students administratively

**Student:**
- ✅ View available classes
- ✅ Join classes with join code
- ✅ View their enrollments
- ✅ Drop classes (if allowed)
- ❌ Cannot create classes
- ❌ Cannot see other students' enrollments

---

## Future Enhancements

1. **Automatic Conflict Detection**
   - Prevent students from enrolling in overlapping classes
   - Alert when trying to join conflicting schedules

2. **Prerequisite System**
   - Define prerequisites for subjects
   - Check if student has completed prerequisites before enrollment

3. **Waiting List**
   - Allow students to join waiting list when class is full
   - Auto-enroll when spot becomes available

4. **Class Materials**
   - Upload syllabus, lecture notes, assignments
   - Share resources with enrolled students

5. **Virtual Classroom Integration**
   - Link online meeting rooms to classes
   - One-click join for online sessions

6. **Analytics Dashboard**
   - Track enrollment trends
   - Monitor popular classes
   - Identify scheduling conflicts

---

## Support

For questions or issues with the class management system:

- **Technical Issues:** Contact IT support
- **Enrollment Issues:** Contact admin office
- **Class Content:** Contact respective teacher
- **System Suggestions:** Submit feedback form

---

**Last Updated:** 2024-11-14  
**Version:** 2.0  
**System:** School Management System
