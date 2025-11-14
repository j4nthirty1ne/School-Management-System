# Class Teacher Assignment & Room Conflict Prevention

## Overview
This document describes the implementation of automatic teacher assignment and room conflict detection for class creation and editing.

## Features Implemented

### 1. Automatic Teacher Assignment
When a teacher creates a class, they are automatically assigned as the teacher for that class.

**How it works:**
- System detects the current authenticated user
- Checks if the user is a teacher (by looking up in `teachers` table)
- If teacher and no `teacher_id` provided in request → auto-assigns
- If admin creates class → uses manually selected `teacher_id` from form

**Code Location:** `frontend/app/api/classes/route.ts` (POST method)

```typescript
// Get current user and check if teacher
const { data: { user } } = await supabase.auth.getUser()

if (user && !body.teacher_id) {
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  if (teacher) {
    body.teacher_id = teacher.id
  }
}
```

### 2. Room Conflict Detection
Prevents double-booking of rooms at the same time on the same day.

**Conflict occurs when:**
- Same room number
- Same day of week
- Overlapping time slots

**Time overlap scenarios checked:**
1. New class starts during existing class
2. New class ends during existing class
3. New class completely encompasses existing class

**Code Location:** 
- `frontend/app/api/classes/route.ts` (POST method - line ~75)
- `frontend/app/api/classes/route.ts` (PATCH method - line ~165)

```typescript
// Check for room conflict
if (body.room_number && body.day_of_week && body.start_time && body.end_time) {
  const { data: existingClasses } = await supabase
    .from('classes')
    .select('id, subject_name, start_time, end_time')
    .eq('room_number', body.room_number)
    .eq('day_of_week', body.day_of_week)

  if (existingClasses && existingClasses.length > 0) {
    const newStart = body.start_time
    const newEnd = body.end_time

    for (const existing of existingClasses) {
      const existingStart = existing.start_time
      const existingEnd = existing.end_time

      // Check if times overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Room ${body.room_number} is already booked on ${body.day_of_week} from ${existingStart} to ${existingEnd} for ${existing.subject_name}` 
          },
          { status: 409 }
        )
      }
    }
  }
}
```

## Error Handling

### Room Conflict Error
**Status Code:** 409 Conflict

**Example Response:**
```json
{
  "success": false,
  "error": "Room 301 is already booked on Tuesday from 09:00:00 to 10:30:00 for Mathematics"
}
```

**User Experience:**
- Error message displayed via alert dialog
- Clear information about which room, day, time, and subject has the conflict
- User can choose different room or time slot

## Usage Examples

### Teacher Creates Class
```typescript
// Frontend sends POST request
POST /api/classes
{
  "subject_name": "Physics",
  "room_number": "203",
  "day_of_week": "Monday",
  "start_time": "10:00:00",
  "end_time": "11:30:00"
  // Note: teacher_id is NOT included
}

// Backend auto-assigns teacher
// If current user is teacher with id="teacher-123":
{
  "subject_name": "Physics",
  "teacher_id": "teacher-123", // Auto-assigned
  "room_number": "203",
  // ... other fields
}
```

### Admin Creates Class
```typescript
// Frontend sends POST request
POST /api/classes
{
  "subject_name": "Chemistry",
  "teacher_id": "teacher-456", // Manually selected
  "room_number": "203",
  "day_of_week": "Monday",
  "start_time": "10:00:00",
  "end_time": "11:30:00"
}

// Backend uses provided teacher_id
// No auto-assignment occurs
```

### Room Conflict Example
```typescript
// Existing class:
// Room 301, Tuesday, 09:00-10:30, Mathematics

// New class attempt:
POST /api/classes
{
  "subject_name": "English",
  "room_number": "301",
  "day_of_week": "Tuesday",
  "start_time": "10:00:00", // Overlaps with existing!
  "end_time": "11:00:00"
}

// Response:
{
  "success": false,
  "error": "Room 301 is already booked on Tuesday from 09:00:00 to 10:30:00 for Mathematics"
}
```

## Frontend Integration

### Admin Dashboard
Location: `frontend/components/admin-dashboard.tsx`

**Create Class Form:**
- Includes teacher dropdown for manual assignment
- Shows alert if room conflict occurs
- Lines 250-290

**Edit Class Dialog:**
- Also checks for room conflicts when updating
- Excludes current class from conflict check (can keep same room/time)
- Lines 1280-1320

## Testing Checklist

- [ ] Teacher creates class → auto-assigned as teacher
- [ ] Admin creates class → uses selected teacher
- [ ] Create class in occupied room/time → shows conflict error
- [ ] Edit class to occupied room/time → shows conflict error
- [ ] Edit class keeping same room/time → no conflict (self-excluded)
- [ ] Different rooms, same time → no conflict
- [ ] Same room, different days → no conflict
- [ ] Same room, non-overlapping times → no conflict

## Database Requirements

### Tables Used
- `classes` - Stores class information
- `teachers` - Links user accounts to teacher records
- `auth.users` - Supabase authentication

### Required Columns
**classes table:**
- `id` (uuid, primary key)
- `subject_name` (text)
- `teacher_id` (uuid, foreign key to teachers)
- `room_number` (text)
- `day_of_week` (text)
- `start_time` (time)
- `end_time` (time)

**teachers table:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)

## Future Enhancements

### Potential Improvements
1. **Visual Schedule Grid**
   - Show calendar view of room bookings
   - Highlight conflicts before submission
   - Drag-and-drop scheduling

2. **Teacher Availability**
   - Check if teacher is already teaching at that time
   - Prevent teacher double-booking

3. **Bulk Import**
   - Import entire timetable from CSV/Excel
   - Validate all conflicts before importing

4. **Conflict Resolution Suggestions**
   - Suggest alternative rooms
   - Suggest alternative time slots
   - Auto-find next available slot

5. **Email Notifications**
   - Notify teacher when assigned to class
   - Notify admin of scheduling conflicts
   - Weekly schedule summaries

## Related Documentation
- [Class Management Workflow](./CLASS_MANAGEMENT_WORKFLOW.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [API Routes Documentation](./API_ROUTES.md)
