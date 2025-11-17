# Timetable Management System - Implementation Guide

## Overview

The timetable management system allows administrators to create class schedules, while teachers and students can view their personalized timetables. The system is built on top of the existing `subject_classes` and `subjects` tables with a complete UI implementation.

---

## System Architecture

### Database Schema

The system uses the following existing tables:

#### 1. **subjects** table

Stores subject information (Math, Programming, etc.)

- `id` - UUID primary key
- `subject_name` - Name of the subject
- `subject_code` - Unique code (e.g., MATH101)
- `credit_hours` - Credit hours
- `is_active` - Active status

#### 2. **subject_classes** table

Stores the actual class schedules

- `id` - UUID primary key
- `subject_id` - Foreign key to subjects
- `teacher_id` - Foreign key to teachers
- `day_of_week` - Monday, Tuesday, etc.
- `start_time` - Class start time (e.g., 07:00)
- `end_time` - Class end time (e.g., 08:00)
- `room_number` - Room location
- `capacity` - Maximum students
- `class_type` - lecture, practice, lab, tutorial
- `section` - Class section (M1, A2, E3, etc.)
- `academic_year` - Academic year (2024-2025)
- `semester` - Semester name
- `join_code` - Unique code for students to join (auto-generated)
- `is_active` - Active status

### API Endpoints

All endpoints are already implemented:

#### Timetable Management

- `GET /api/timetable` - Get time slots (not actively used in new implementation)
- `POST /api/timetable` - Create time slot

#### Subject Management

- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create new subject

#### Subject Classes (Timetable Entries)

- `GET /api/subject-classes?academic_year=2024-2025` - Get all schedules for academic year
- `GET /api/subject-classes?teacher_id=xxx` - Get teacher's schedules
- `POST /api/subject-classes` - Create new schedule (auto-generates join code)
- `PATCH /api/subject-classes` - Update schedule
- `DELETE /api/subject-classes?id=xxx` - Delete schedule

---

## Features Implemented

### For Administrators

#### Admin Dashboard - Timetable Tab

**Location:** `/admin/dashboard` → Timetable tab

**Features:**

1. **Create Schedule**

   - Select subject from existing subjects
   - Assign teacher
   - Set day of week (Monday-Saturday)
   - Set start and end times
   - Specify class type (lecture, practice, lab, tutorial)
   - Define section (M1, A2, E3, etc.)
   - Set room number and capacity
   - Auto-generates unique join code for students

2. **View Timetable**

   - Weekly view organized by day
   - See all schedules at a glance
   - Shows subject, teacher, time, room, and join code
   - Badge indicators for class type and section

3. **Edit Schedule**

   - Modify any aspect of the schedule
   - Update teacher assignments
   - Change room or time

4. **Delete Schedule**
   - Remove schedules with confirmation

**Component:** `frontend/components/timetable-management.tsx`

### For Teachers

#### Teacher Timetable Page

**Location:** `/teacher/timetable`

**Access:** Click on "This Week" card in teacher dashboard or navigate directly

**Features:**

1. **View Teaching Schedule**

   - Weekly view of all assigned classes
   - Shows subject, section, time, and room
   - Displays join codes for each class
   - Color-coded class types
   - Weekly summary statistics

2. **Class Details**
   - Subject name and code
   - Time and location
   - Capacity information
   - Join code for student enrollment
   - Semester information

**Component:** `frontend/components/timetable-view.tsx`
**Page:** `frontend/app/teacher/timetable/page.tsx`

### For Students

#### Student Timetable Page

**Location:** `/student/timetable`

**Access:** Click on "My Timetable" card in student dashboard

**Features:**

1. **View Class Schedule**

   - Weekly view of enrolled classes
   - Shows subject, teacher, time, and room
   - Color-coded class types
   - Weekly summary statistics

2. **Class Details**
   - Subject name and code
   - Teacher information
   - Time and location
   - Capacity information
   - Semester information

**Component:** `frontend/components/timetable-view.tsx` (shared with teachers)
**Page:** `frontend/app/student/timetable/page.tsx`

---

## Usage Workflow

### 1. Admin Creates Subjects (if not exist)

```
Admin Dashboard → Subjects → Add Subject
- Subject Name: Mathematics
- Subject Code: MATH101
- Credit Hours: 3
```

### 2. Admin Creates Timetable Schedule

```
Admin Dashboard → Timetable Tab → Create Schedule

Example:
- Subject: Mathematics (MATH101)
- Teacher: John Doe
- Day: Monday
- Time: 07:00 - 08:00
- Section: M1 (Morning Class 1)
- Room: Room 301
- Class Type: Lecture
- Capacity: 30

System auto-generates: Join Code (e.g., ABC123XY)
```

### 3. Teacher Views Schedule

```
Teacher Dashboard → Click "This Week" card
OR
Navigate to /teacher/timetable

- See all assigned classes organized by day
- Access join codes to share with students
```

### 4. Students Enroll and View Schedule

```
Student Dashboard → Click "My Timetable" card
OR
Navigate to /student/timetable

- View all enrolled classes
- See weekly schedule
```

---

## Component Structure

### 1. TimetableManagement Component

**File:** `frontend/components/timetable-management.tsx`

**Purpose:** Admin interface for creating and managing schedules

**Key Features:**

- CRUD operations for schedules
- Form validation
- Real-time data fetching
- Day-wise organization
- Join code display

### 2. TimetableView Component

**File:** `frontend/components/timetable-view.tsx`

**Purpose:** Shared component for displaying timetables to teachers and students

**Props:**

- `userId` - User ID to filter schedules
- `userType` - 'teacher' or 'student'
- `showJoinCode` - Boolean to show/hide join codes

**Key Features:**

- Responsive weekly view
- Color-coded class types
- Time formatting (12-hour format)
- Empty state handling
- Summary statistics

### 3. Navigation Integration

**Teacher Dashboard:**

- Modified card: "This Week" → Clickable, navigates to `/teacher/timetable`

**Student Dashboard:**

- New card: "My Timetable" → Navigates to `/student/timetable`

---

## Class Identification System

### Understanding the Terminology

**"Class" in Academic Context:**

- **Academic Classes** (Homeroom): M1, A2, E3
  - M = Morning shift
  - A = Afternoon shift
  - E = Evening shift
  - Number = Group/division
  - Used for student identification
  - Example: "Student Yean, Class M1"

**"Subject Classes" (Timetable Entries):**

- Actual teaching sessions
- Example: "Math M1 Lecture - Monday 7-8 AM"
- Students from Class M1 attend this subject class

### Join Code System

Each subject class has a unique join code (e.g., `ABC123XY`) that:

- Is auto-generated when admin creates a schedule
- Allows students to enroll in the class
- Is displayed to teachers for sharing
- Enables easy class enrollment

---

## Color Coding

### Class Types

- **Lecture** → Blue (`bg-blue-500/10 text-blue-700`)
- **Practice** → Green (`bg-green-500/10 text-green-700`)
- **Lab** → Purple (`bg-purple-500/10 text-purple-700`)
- **Tutorial** → Orange (`bg-orange-500/10 text-orange-700`)

---

## Time Format

All times are displayed in 12-hour format with AM/PM:

- Database: `07:00` (24-hour)
- Display: `7:00 AM` (12-hour)

---

## Future Enhancements

### Potential Features to Add:

1. **Conflict Detection**

   - Prevent double-booking of rooms
   - Prevent teacher schedule conflicts
   - Warn about student schedule conflicts

2. **Calendar View**

   - Month view option
   - Daily view option
   - Print-friendly version

3. **Notifications**

   - Remind teachers of upcoming classes
   - Notify students of schedule changes
   - Alert for room changes

4. **Bulk Operations**

   - Import schedules from CSV/Excel
   - Duplicate schedules for multiple sections
   - Copy schedule to next semester

5. **Analytics**

   - Room utilization reports
   - Teacher workload analysis
   - Student enrollment statistics

6. **Student Enrollment API**
   - Currently, timetable view for students fetches all classes
   - Need to implement enrollment system using join codes
   - Create student enrollment tracking

---

## File Structure

```
frontend/
├── app/
│   ├── admin/
│   │   └── dashboard/
│   │       └── page.tsx (includes Timetable tab)
│   ├── teacher/
│   │   ├── dashboard/
│   │   │   └── page.tsx (modified for navigation)
│   │   └── timetable/
│   │       └── page.tsx (NEW)
│   ├── student/
│   │   ├── dashboard/
│   │   │   └── page.tsx (modified for navigation)
│   │   └── timetable/
│   │       └── page.tsx (NEW)
│   └── api/
│       ├── subjects/
│       │   └── route.ts (existing)
│       ├── subject-classes/
│       │   └── route.ts (existing)
│       └── timetable/
│           └── route.ts (existing)
└── components/
    ├── timetable-management.tsx (NEW)
    ├── timetable-view.tsx (NEW)
    └── admin-dashboard.tsx (modified)
```

---

## Testing Checklist

- [ ] Admin can create subjects
- [ ] Admin can create schedules with all fields
- [ ] Join codes are auto-generated and unique
- [ ] Admin can view all schedules by day
- [ ] Admin can edit existing schedules
- [ ] Admin can delete schedules
- [ ] Teacher can view their assigned schedules
- [ ] Teacher can see join codes for their classes
- [ ] Student can navigate to timetable page
- [ ] Student can view enrolled classes (once enrollment implemented)
- [ ] Times display in 12-hour format
- [ ] Class types are color-coded
- [ ] Weekly summary shows correct counts
- [ ] Empty states display properly
- [ ] Navigation works from dashboards
- [ ] Responsive design works on mobile

---

## Notes

1. **Student Enrollment:** The current implementation shows the timetable view for students, but the actual enrollment system (using join codes) needs to be implemented separately. Students would need an API endpoint to enroll in classes using join codes.

2. **Data Filtering:** For teachers, the timetable view filters by `teacher_id`. For students, you'll need to implement enrollment tracking to filter classes properly.

3. **Academic Year:** Currently hardcoded to `2024-2025`. Can be made dynamic with a selector.

4. **Time Slots:** The `time_slots` table exists but is not actively used in the current implementation. The system directly uses `start_time` and `end_time` fields in `subject_classes`.

---

## Summary

✅ **Completed:**

- Full timetable management interface for admins
- Timetable viewing for teachers (with join codes)
- Timetable viewing for students
- Navigation integration in dashboards
- Reusable components
- API integration
- Responsive design
- Color-coded class types
- Weekly organization
- Summary statistics

🔄 **Next Steps:**

- Implement student enrollment system using join codes
- Add conflict detection
- Add bulk operations
- Enhance filtering and search
- Add export/print functionality

---

## Support

For issues or questions:

1. Check the API endpoints are working correctly
2. Verify database tables exist with correct schema
3. Ensure proper user authentication
4. Review console logs for errors
