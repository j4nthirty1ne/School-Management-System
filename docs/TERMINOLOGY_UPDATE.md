# Terminology Update: Class vs Group

## Overview

This document explains the terminology changes made to clarify the distinction between student groups and subject-based groups in the School Management System.

## Problem Statement

The previous use of "class" for both concepts caused confusion:

- **For Admins/Teachers**: "Class" referred to main student groups (e.g., M1 with 50 students, M2 with 40 students)
- **For Students**: "Class" referred to subject-based groups (e.g., Math, Physics)

This ambiguity led to misunderstandings among users and within the system.

## Solution

### New Terminology

| Old Term | Context            | New Term  | Example                            |
| -------- | ------------------ | --------- | ---------------------------------- |
| Class    | Main student group | **Class** | M1 (50 students), A2 (35 students) |
| Class    | Subject group      | **Group** | Math Group, Physics Group          |

### Key Changes

#### 1. **Class (Unchanged)**

- Refers to the main group of students assigned by admins
- Examples: M1, M2, A1, A2
- Used in:
  - Admin panel for student management
  - Class creation and assignment
  - Student roster management

#### 2. **Group (New)**

- Refers to subject-based groups where students and teachers interact
- Examples: Math Group, Physics Group, English Group
- Used in:
  - Student dashboard ("Join New Group" instead of "Join New Class")
  - Teacher-student communication
  - Attendance tracking
  - Grade recording
  - Assignment submission

## Workflow

1. **Admin Creates Classes**

   - Admin creates classes (e.g., M1, M2)
   - Assigns students to each class
   - Creates timetables for each class

2. **Teacher Receives Timetable**

   - Teachers get their schedule for different classes
   - Each timetable entry represents a subject group

3. **Students Join Groups**
   - Students use join codes to enroll in subject groups
   - These groups are where they:
     - Communicate with teachers
     - Submit assignments
     - View grades
     - Track attendance

## Files Updated

### Components

- `frontend/components/join-group-dialog.tsx` (renamed from `join-class-dialog.tsx`)
  - Updated all UI text from "Class" to "Group"
  - Updated function names (JoinClassDialog → JoinGroupDialog)
  - Updated success/error messages

### Pages

- `frontend/app/student/dashboard/page.tsx`

  - Changed "Join New Class" to "Join New Group"
  - Updated dialog titles and descriptions
  - Changed state management from "classes" to "groups"
  - Updated all button labels and card content

- `frontend/components/timetable-view.tsx`
  - Updated empty state message for students
  - Changed "enroll in classes" to "enroll in groups"

## Database Schema

**Note**: Database table names remain unchanged to maintain backward compatibility:

- `subject_classes` table continues to exist
- Backend APIs continue to use existing endpoints
- Only frontend UI terminology has been updated

## User Impact

### For Students

- **Before**: "Join New Class" (confusing - which class?)
- **After**: "Join New Group" (clear - joining a subject group)
- More intuitive understanding of subject enrollment

### For Teachers

- **Before**: Managing "classes" (ambiguous)
- **After**: Managing "groups" for subjects, while still viewing main "classes"
- Clearer distinction between student roster and subject groups

### For Admins

- **Before**: Creating "classes" (could mean student groups or subjects)
- **After**: Creating "Classes" for student groups, managing "Groups" for subjects
- Reduced ambiguity in system navigation

## Migration Notes

### Breaking Changes

- Component import paths changed:

  ```typescript
  // Old
  import { JoinClassDialog } from "@/components/join-class-dialog";

  // New
  import { JoinGroupDialog } from "@/components/join-group-dialog";
  ```

### Non-Breaking Changes

- All API endpoints remain the same
- Database schema unchanged
- Backend logic unchanged
- Only frontend UI text updated

## Future Considerations

1. **Gradual Backend Updates**: Consider updating backend terminology in future releases
2. **Documentation**: Update all user-facing documentation to reflect new terminology
3. **Training**: Provide user training materials explaining the distinction
4. **Consistency**: Ensure all new features use consistent terminology

## Summary

This update provides clarity by using:

- **"Class"** for main student groups (organizational units)
- **"Group"** for subject-based learning groups (where learning happens)

This distinction helps all users better understand the system's organization and improves the overall user experience.
