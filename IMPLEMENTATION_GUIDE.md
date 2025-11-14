# Implementation Guide: New Class Management System

## Quick Start

This guide helps you implement the new class management workflow in your School Management System.

## Prerequisites

- Supabase project with existing schema
- Admin access to Supabase SQL Editor
- Access to frontend codebase

## Step-by-Step Implementation

### Phase 1: Database Setup (30 minutes)

#### 1.1 Run Schema Updates

1. Open Supabase SQL Editor
2. Copy content from `backend/database/schema_updates.sql`
3. Execute the script
4. Verify tables created:
   - ✅ `time_slots`
   - ✅ `subject_classes`
   - ✅ `student_enrollments`
5. Verify views created:
   - ✅ `v_subject_classes_detailed`
   - ✅ `v_student_enrollments_detailed`
6. Verify functions created:
   - ✅ `generate_subject_class_join_code()`

#### 1.2 Test Database

Run these queries to verify setup:

```sql
-- Test time slots
SELECT * FROM time_slots;

-- Test view
SELECT * FROM v_subject_classes_detailed;

-- Test function
SELECT generate_subject_class_join_code();
```

Expected results:
- Time slots table has sample data for Monday-Friday 7-8 AM, 8-9 AM
- Views return empty but no errors
- Function generates 8-character codes like "ABC123XY"

---

### Phase 2: API Endpoints (1 hour)

All API endpoints are already created in `frontend/app/api/`:

✅ **Created Files:**
- `/api/timetable/route.ts` - Timetable management
- `/api/subjects/route.ts` - Subject management
- `/api/subject-classes/route.ts` - Subject class management
- `/api/student-enrollments/route.ts` - Enrollment management

#### 2.1 Test API Endpoints

Start development server:
```bash
cd frontend
npm run dev
```

Test endpoints using curl or Postman:

**Get Time Slots:**
```bash
curl http://localhost:3000/api/timetable?academic_year=2024-2025
```

**Get Subjects:**
```bash
curl http://localhost:3000/api/subjects
```

**Get Subject Classes:**
```bash
curl http://localhost:3000/api/subject-classes?academic_year=2024-2025
```

---

### Phase 3: Admin Dashboard Updates (2 hours)

#### 3.1 Add Required Tabs

Update `frontend/components/admin-dashboard.tsx`:

1. Add imports:
```typescript
import { Clock, BookOpen, UserPlus } from 'lucide-react'
```

2. Add state:
```typescript
const [timetableData, setTimetableData] = useState([])
const [subjectsData, setSubjectsData] = useState([])
const [subjectClassesData, setSubjectClassesData] = useState([])
const [enrollmentsData, setEnrollmentsData] = useState([])
```

3. Add tabs to TabsList:
```tsx
<TabsTrigger value="timetable">Timetable</TabsTrigger>
<TabsTrigger value="subjects">Subjects</TabsTrigger>
<TabsTrigger value="class-schedule">Class Schedule</TabsTrigger>
<TabsTrigger value="enrollments">Enrollments</TabsTrigger>
```

4. Implement each tab content (see detailed component below)

#### 3.2 Timetable Tab Component

Create a new component for timetable management that displays:
- Grid view of weekly schedule
- Add time slot button
- Time slot cards showing day, time, and actions
- Delete functionality

#### 3.3 Subjects Tab Component

Display:
- List of all subjects
- Add subject button
- Subject cards with name, code, credit hours
- Edit/delete actions

#### 3.4 Class Schedule Tab Component

Show:
- All subject classes in calendar/list view
- Filter by teacher, day, room
- Create class button with form:
  - Select subject
  - Select teacher
  - Choose time slot from timetable
  - Enter room number
  - Set capacity
  - Specify class type and section
- Display join code for each class
- Edit/delete actions

#### 3.5 Enrollments Tab Component

Display:
- All student enrollments
- Filter by student, class, status
- Manually enroll students
- View enrollment statistics
- Export enrollment reports

---

### Phase 4: Teacher Dashboard Updates (1.5 hours)

Update `frontend/app/teacher/dashboard/page.tsx`:

#### 4.1 Fetch Teacher's Classes

Replace current class fetching with:

```typescript
const fetchClasses = async () => {
  try {
    // Get teacher ID first
    const response = await fetch('/api/auth/user')
    const { data: user } = await response.json()
    
    if (!user) return
    
    // Get teacher record
    const teacherRes = await fetch(`/api/teachers?user_id=${user.id}`)
    const { teacher } = await teacherRes.json()
    
    if (!teacher) return
    
    // Fetch subject classes for this teacher
    const classesRes = await fetch(`/api/subject-classes?teacher_id=${teacher.id}`)
    const { classes } = await classesRes.json()
    
    setClasses(classes || [])
  } catch (error) {
    console.error('Error fetching classes:', error)
  }
}
```

#### 4.2 Update Class Cards

Modify class card display to show:
```tsx
<Card key={cls.id}>
  <CardHeader>
    <div className="flex justify-between items-start">
      <div>
        <CardTitle>{cls.subject_name}</CardTitle>
        <CardDescription>
          {cls.section && `Section ${cls.section} • `}
          {cls.class_type}
        </CardDescription>
      </div>
      <Badge variant="secondary">
        {cls.enrolled_count}/{cls.capacity}
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {cls.day_of_week} {cls.start_time} - {cls.end_time}
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Room {cls.room_number}
      </div>
      <div className="flex items-center gap-2">
        <Key className="h-4 w-4" />
        Join Code: <code className="font-mono">{cls.join_code}</code>
      </div>
    </div>
    <div className="flex gap-2 mt-4">
      <Button size="sm" onClick={() => handleViewStudents(cls)}>
        View Students
      </Button>
      <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(cls)}>
        Mark Attendance
      </Button>
      <Button size="sm" variant="outline" onClick={() => handleEnterGrades(cls)}>
        Enter Grades
      </Button>
    </div>
  </CardContent>
</Card>
```

#### 4.3 Add Create Class Button

Add functionality for teachers to create their own classes:

```tsx
<Button onClick={() => setShowCreateDialog(true)}>
  <Plus className="h-4 w-4 mr-2" />
  Create Class
</Button>
```

---

### Phase 5: Student Dashboard Updates (1.5 hours)

Update `frontend/app/student/dashboard/page.tsx`:

#### 5.1 Fetch Student's Enrolled Classes

```typescript
const fetchEnrollments = async () => {
  try {
    const response = await fetch('/api/auth/user')
    const { data: user } = await response.json()
    
    if (!user) return
    
    const enrollmentsRes = await fetch(`/api/student-enrollments?student_id=${user.id}`)
    const { enrollments } = await enrollmentsRes.json()
    
    setEnrollments(enrollments || [])
  } catch (error) {
    console.error('Error fetching enrollments:', error)
  }
}
```

#### 5.2 Add Join Class Dialog

Create a dialog with join code input:

```tsx
<Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Join Class</DialogTitle>
      <DialogDescription>
        Enter the join code provided by your teacher
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label htmlFor="joinCode">Join Code</Label>
        <Input
          id="joinCode"
          placeholder="ABC123XY"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={8}
        />
      </div>
      <Button onClick={handleJoinClass} className="w-full">
        Join Class
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

#### 5.3 Implement Join Class Logic

```typescript
const handleJoinClass = async () => {
  try {
    const response = await fetch('/api/student-enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ join_code: joinCode }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      toast.success('Successfully joined class!')
      setShowJoinDialog(false)
      setJoinCode('')
      fetchEnrollments() // Refresh list
    } else {
      toast.error(result.error || 'Failed to join class')
    }
  } catch (error) {
    toast.error('An error occurred')
  }
}
```

#### 5.4 Update My Classes Display

Show enrolled classes in a list/grid:

```tsx
<div className="grid gap-4 md:grid-cols-2">
  {enrollments.map((enrollment) => (
    <Card key={enrollment.id}>
      <CardHeader>
        <CardTitle>{enrollment.subject_name}</CardTitle>
        <CardDescription>
          {enrollment.teacher_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>📅 {enrollment.day_of_week} {enrollment.start_time} - {enrollment.end_time}</div>
          <div>📍 Room {enrollment.room_number}</div>
          <div>👥 Section {enrollment.section}</div>
        </div>
        <Button 
          size="sm" 
          className="mt-4 w-full"
          onClick={() => handleViewClassDetails(enrollment)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  ))}
</div>
```

---

### Phase 6: Testing (1 hour)

#### 6.1 Admin Tests

1. **Create Timetable:**
   - Create time slots for Monday-Friday
   - Verify they appear in list
   - Delete a slot and verify it's removed

2. **Create Subjects:**
   - Add Math, Physics, English subjects
   - Verify they appear in subjects list

3. **Create Subject Classes:**
   - Create "Math M1 Lecture" on Monday 7-8 AM
   - Verify join code is generated
   - Check it appears in class list

4. **Assign Students:**
   - Manually enroll a student in a class
   - Verify enrollment appears in enrollments list

#### 6.2 Teacher Tests

1. **View Classes:**
   - Login as teacher
   - Verify assigned classes appear
   - Check join codes are visible

2. **Create Class:**
   - Create a new class
   - Verify it's added to teacher's list

3. **View Students:**
   - Click "View Students" on a class
   - Verify enrolled students appear

#### 6.3 Student Tests

1. **View Enrolled Classes:**
   - Login as student
   - Verify enrolled classes appear

2. **Join Class:**
   - Click "Join Class"
   - Enter valid join code
   - Verify class is added to enrolled classes

3. **Test Invalid Code:**
   - Try joining with invalid code
   - Verify error message appears

4. **Test Full Class:**
   - Try joining a class at capacity
   - Verify "Class is full" error

---

### Phase 7: Deployment (30 minutes)

#### 7.1 Pre-Deployment Checklist

- [ ] All database migrations run successfully
- [ ] API endpoints tested and working
- [ ] Admin dashboard updates complete
- [ ] Teacher dashboard updates complete
- [ ] Student dashboard updates complete
- [ ] All tests passing
- [ ] Documentation reviewed

#### 7.2 Deploy to Production

1. **Database:**
   - Run `schema_updates.sql` on production Supabase
   - Verify all tables and views created
   - Insert initial time slots

2. **Frontend:**
   - Build production bundle
   - Deploy to hosting platform
   - Verify all routes accessible

3. **Post-Deployment:**
   - Test admin workflow
   - Test teacher workflow
   - Test student workflow
   - Monitor error logs

---

## Rollback Plan

If issues arise after deployment:

1. **Database Rollback:**
   ```sql
   -- Drop new tables
   DROP TABLE IF EXISTS student_enrollments CASCADE;
   DROP TABLE IF EXISTS subject_classes CASCADE;
   DROP TABLE IF EXISTS time_slots CASCADE;
   
   -- Drop views
   DROP VIEW IF EXISTS v_subject_classes_detailed;
   DROP VIEW IF EXISTS v_student_enrollments_detailed;
   ```

2. **Code Rollback:**
   - Revert to previous git commit
   - Redeploy previous version
   - Re-enable old API endpoints

3. **Communication:**
   - Notify users of temporary reversion
   - Schedule maintenance window for fixes

---

## Monitoring & Maintenance

### Key Metrics to Track

1. **Enrollment Stats:**
   - Total students enrolled
   - Classes near capacity
   - Popular time slots

2. **Usage Patterns:**
   - Peak enrollment times
   - Most used join codes
   - Class creation frequency

3. **Error Rates:**
   - Failed join attempts
   - Invalid join codes
   - Capacity errors

### Regular Maintenance

**Weekly:**
- Review enrollment numbers
- Check for scheduling conflicts
- Monitor error logs

**Monthly:**
- Clean up old academic year data
- Archive completed enrollments
- Update subjects catalog

**Yearly:**
- Create new academic year timetable
- Roll over active classes
- Generate new join codes

---

## Troubleshooting Guide

### Common Issues

**Issue: "Function generate_subject_class_join_code() does not exist"**
- **Cause:** Schema update not fully applied
- **Fix:** Re-run schema_updates.sql in SQL Editor

**Issue: "Cannot read property 'id' of null"**
- **Cause:** Teacher/student profile not found
- **Fix:** Ensure user has associated teacher/student record

**Issue: "Duplicate join code"**
- **Cause:** Function generated existing code
- **Fix:** Function has retry logic; should auto-resolve

**Issue: "Class enrollment failed"**
- **Cause:** Multiple possible (full class, already enrolled, invalid code)
- **Fix:** Check error message for specific cause

---

## Support Resources

- **Documentation:** `CLASS_MANAGEMENT_WORKFLOW.md`
- **Schema:** `backend/database/schema_updates.sql`
- **API Reference:** Check route files in `frontend/app/api/`
- **Issue Tracking:** GitHub Issues
- **Questions:** Contact dev team

---

## Next Steps

After successful implementation:

1. **User Training:**
   - Create video tutorials for each role
   - Write user guides
   - Conduct training sessions

2. **Feature Enhancements:**
   - Add conflict detection
   - Implement waiting lists
   - Add class materials section
   - Integrate virtual classrooms

3. **Analytics:**
   - Build admin analytics dashboard
   - Track enrollment trends
   - Generate reports

4. **Mobile Support:**
   - Optimize for mobile devices
   - Consider native app

---

**Implementation Status Checklist**

- [ ] Phase 1: Database Setup ✅
- [ ] Phase 2: API Endpoints ✅
- [ ] Phase 3: Admin Dashboard
- [ ] Phase 4: Teacher Dashboard
- [ ] Phase 5: Student Dashboard
- [ ] Phase 6: Testing
- [ ] Phase 7: Deployment

---

**Estimated Total Time:** 8-10 hours
**Difficulty:** Intermediate
**Team Size:** 1-2 developers

Good luck with the implementation! 🚀
