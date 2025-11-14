# Quick Reference Guide - Class Management System

## 🚀 Quick Start

### For Developers

**1. Database Setup (5 minutes)**
```bash
# Open Supabase SQL Editor
# Copy and paste: backend/database/schema_updates.sql
# Execute
```

**2. Test APIs (2 minutes)**
```bash
cd frontend
npm run dev

# Test endpoints
curl http://localhost:3000/api/timetable
curl http://localhost:3000/api/subjects
curl http://localhost:3000/api/subject-classes
```

**3. Read Documentation**
- `RESTRUCTURING_SUMMARY.md` - Overview
- `CLASS_MANAGEMENT_WORKFLOW.md` - Detailed workflow
- `IMPLEMENTATION_GUIDE.md` - Implementation steps

---

## 📊 Database Quick Reference

### Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `time_slots` | Master timetable | day_of_week, start_time, end_time |
| `subjects` | Subject catalog | subject_name, subject_code |
| `subject_classes` | Class offerings | subject_id, teacher_id, **join_code** |
| `student_enrollments` | Who's enrolled where | student_id, subject_class_id |

### Views

```sql
-- Get complete class info
SELECT * FROM v_subject_classes_detailed;

-- Get enrollment details
SELECT * FROM v_student_enrollments_detailed;
```

### Functions

```sql
-- Generate join code
SELECT generate_subject_class_join_code();
-- Returns: "ABC123XY"
```

---

## 🔌 API Quick Reference

### Timetable
```typescript
GET    /api/timetable?academic_year=2024-2025
POST   /api/timetable { day_of_week, start_time, end_time }
DELETE /api/timetable?id=xxx
```

### Subjects
```typescript
GET  /api/subjects
POST /api/subjects { subject_name, subject_code, credit_hours }
```

### Subject Classes
```typescript
GET    /api/subject-classes?academic_year=2024-2025
GET    /api/subject-classes?teacher_id=xxx
POST   /api/subject-classes { subject_id, teacher_id, day, time, room }
PATCH  /api/subject-classes { id, ...updates }
DELETE /api/subject-classes?id=xxx
```

### Enrollments
```typescript
GET    /api/student-enrollments?student_id=xxx
GET    /api/student-enrollments?subject_class_id=xxx
POST   /api/student-enrollments { join_code: "ABC123XY" }
POST   /api/student-enrollments { student_id, subject_class_id }
DELETE /api/student-enrollments?id=xxx
```

---

## 💻 Code Snippets

### Admin - Create Subject Class

```typescript
const createClass = async () => {
  const response = await fetch('/api/subject-classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject_id: selectedSubject,
      teacher_id: selectedTeacher,
      day_of_week: 'Monday',
      start_time: '07:00',
      end_time: '08:00',
      room_number: '301',
      class_type: 'lecture',
      section: 'M1',
      capacity: 30,
      academic_year: '2024-2025',
      semester: 'Fall 2024'
    })
  })
  
  const { success, class: newClass } = await response.json()
  if (success) {
    console.log('Join Code:', newClass.join_code)
  }
}
```

### Teacher - Fetch My Classes

```typescript
const fetchMyClasses = async () => {
  // Get current user
  const userRes = await fetch('/api/auth/user')
  const { data: user } = await userRes.json()
  
  // Get teacher profile
  const teacherRes = await fetch(`/api/teachers?user_id=${user.id}`)
  const { teacher } = await teacherRes.json()
  
  // Fetch classes
  const classesRes = await fetch(`/api/subject-classes?teacher_id=${teacher.id}`)
  const { classes } = await classesRes.json()
  
  setClasses(classes)
}
```

### Student - Join Class with Code

```typescript
const joinClass = async (joinCode: string) => {
  try {
    const response = await fetch('/api/student-enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ join_code: joinCode.toUpperCase() })
    })
    
    const result = await response.json()
    
    if (result.success) {
      toast.success('Joined class successfully!')
      fetchEnrollments() // Refresh
    } else {
      toast.error(result.error)
    }
  } catch (error) {
    toast.error('Failed to join class')
  }
}
```

### Student - Fetch Enrolled Classes

```typescript
const fetchEnrollments = async () => {
  const userRes = await fetch('/api/auth/user')
  const { data: user } = await userRes.json()
  
  const enrollRes = await fetch(`/api/student-enrollments?student_id=${user.id}`)
  const { enrollments } = await enrollRes.json()
  
  setEnrollments(enrollments)
}
```

---

## 🎨 UI Components

### Teacher Class Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>{cls.subject_name}</CardTitle>
    <CardDescription>Section {cls.section} • {cls.class_type}</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div>📅 {cls.day_of_week} {cls.start_time}-{cls.end_time}</div>
      <div>📍 Room {cls.room_number}</div>
      <div>🔑 Join Code: <code>{cls.join_code}</code></div>
      <div>👥 {cls.enrolled_count}/{cls.capacity} students</div>
    </div>
    <Button onClick={() => viewStudents(cls)}>View Students</Button>
  </CardContent>
</Card>
```

### Student Join Class Dialog

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Join Class</DialogTitle>
    </DialogHeader>
    <Input
      placeholder="Enter join code (e.g., ABC123XY)"
      value={joinCode}
      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
      maxLength={8}
    />
    <Button onClick={() => joinClass(joinCode)}>Join</Button>
  </DialogContent>
</Dialog>
```

### Student Enrolled Class Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>{enrollment.subject_name}</CardTitle>
    <CardDescription>{enrollment.teacher_name}</CardDescription>
  </CardHeader>
  <CardContent>
    <div>📅 {enrollment.day_of_week} {enrollment.start_time}-{enrollment.end_time}</div>
    <div>📍 Room {enrollment.room_number}</div>
    <div>👥 Section {enrollment.section}</div>
  </CardContent>
</Card>
```

---

## 🐛 Common Issues & Fixes

### Issue: "Join code not working"

**Possible Causes:**
1. Code entered incorrectly
2. Class is full
3. Already enrolled
4. Class inactive

**Debug:**
```sql
-- Check if code exists
SELECT * FROM subject_classes WHERE join_code = 'ABC123XY';

-- Check capacity
SELECT 
  sc.capacity,
  COUNT(se.id) as enrolled
FROM subject_classes sc
LEFT JOIN student_enrollments se ON se.subject_class_id = sc.id
WHERE sc.join_code = 'ABC123XY'
GROUP BY sc.id, sc.capacity;

-- Check if student already enrolled
SELECT * FROM student_enrollments 
WHERE student_id = 'xxx' AND subject_class_id = 'yyy';
```

### Issue: "Classes not showing for teacher"

**Debug:**
```sql
-- Check teacher record
SELECT * FROM teachers WHERE user_id = 'xxx';

-- Check assigned classes
SELECT * FROM subject_classes WHERE teacher_id = 'yyy';

-- Check view
SELECT * FROM v_subject_classes_detailed WHERE teacher_id = 'yyy';
```

### Issue: "Student enrollments empty"

**Debug:**
```sql
-- Check student record
SELECT * FROM students WHERE user_id = 'xxx';

-- Check enrollments
SELECT * FROM student_enrollments WHERE student_id = 'yyy';

-- Check view
SELECT * FROM v_student_enrollments_detailed 
WHERE user_id = 'xxx';
```

---

## 📝 Testing Checklist

### Database
- [ ] All tables created
- [ ] All views working
- [ ] Function generates unique codes
- [ ] Sample data inserted

### APIs
- [ ] GET endpoints return data
- [ ] POST creates records
- [ ] PATCH updates records
- [ ] DELETE removes records
- [ ] Error handling works

### Admin Dashboard
- [ ] Can create timetable
- [ ] Can create subjects
- [ ] Can create classes
- [ ] Can assign students
- [ ] Join codes displayed

### Teacher Dashboard
- [ ] Classes listed correctly
- [ ] Join codes visible
- [ ] Can create own classes
- [ ] Can view enrolled students

### Student Dashboard
- [ ] Can join with code
- [ ] Enrolled classes shown
- [ ] Invalid code shows error
- [ ] Full class shows error

---

## 🔄 Workflow Examples

### Example 1: Teacher Creates Math Lecture

```typescript
// 1. Create class
POST /api/subject-classes
{
  "subject_id": "math-uuid",
  "teacher_id": "teacher-uuid",
  "day_of_week": "Monday",
  "start_time": "07:00",
  "end_time": "08:00",
  "room_number": "301",
  "class_type": "lecture",
  "section": "M1",
  "capacity": 30
}

// Response: { success: true, class: { join_code: "ABC123XY", ... } }

// 2. Teacher shares join code with students
// 3. Students join using code
```

### Example 2: Student Joins Class

```typescript
// 1. Student enters code
POST /api/student-enrollments
{
  "join_code": "ABC123XY"
}

// System checks:
// - Code exists? ✅
// - Class full? ✅ (28/30)
// - Already enrolled? ✅ (no)

// Response: { success: true, enrollment: { ... } }

// 2. Fetch updated enrollments
GET /api/student-enrollments?student_id=xxx

// Response: { enrollments: [...] }
```

### Example 3: Admin Assigns Student to Class

```typescript
// 1. Get student and class
const student = await fetch(`/api/students/${studentId}`)
const classes = await fetch('/api/subject-classes')

// 2. Create enrollment
POST /api/student-enrollments
{
  "student_id": "student-uuid",
  "subject_class_id": "class-uuid",
  "enrollment_method": "admin"
}

// Response: { success: true, enrollment: { ... } }
```

---

## 🎯 Key Concepts

### Join Code System
- **Format:** 8 uppercase alphanumeric characters (e.g., "ABC123XY")
- **Generation:** Automatic via `generate_subject_class_join_code()`
- **Uniqueness:** Guaranteed by function with retry logic
- **Usage:** Students enter code to join class

### Enrollment Methods
- `admin` - Manually assigned by administrator
- `self-join` - Student joined using join code
- `automatic` - Auto-enrolled (future feature)

### Enrollment Status
- `active` - Currently enrolled
- `dropped` - Withdrawn from class
- `completed` - Course completed

### Class Types
- `lecture` - Traditional lecture class
- `practice` - Practical/exercise class
- `lab` - Laboratory class
- `tutorial` - Tutorial/discussion class

---

## 📚 File Locations

### Backend
```
backend/
  database/
    schema.sql          # Original schema
    schema_updates.sql  # New tables/views/functions ⭐
```

### Frontend API
```
frontend/app/api/
  timetable/route.ts          # Time slot management ⭐
  subjects/route.ts           # Subject management ⭐
  subject-classes/route.ts    # Class offerings ⭐
  student-enrollments/route.ts # Enrollment management ⭐
```

### Documentation
```
CLASS_MANAGEMENT_WORKFLOW.md  # Complete workflow guide ⭐
IMPLEMENTATION_GUIDE.md        # Step-by-step implementation ⭐
RESTRUCTURING_SUMMARY.md       # Overview and summary ⭐
QUICK_REFERENCE.md             # This file ⭐
```

---

## 🎓 Learning Resources

### Understanding the System
1. Start with `RESTRUCTURING_SUMMARY.md` - Get overview
2. Read `CLASS_MANAGEMENT_WORKFLOW.md` - Understand workflow
3. Review `IMPLEMENTATION_GUIDE.md` - Learn implementation
4. Use this file for quick reference

### Database Learning
```sql
-- Study the schema
SELECT * FROM time_slots;
SELECT * FROM v_subject_classes_detailed;
SELECT * FROM v_student_enrollments_detailed;

-- Understand relationships
SELECT 
  sc.subject_name,
  s.subject_code,
  t.teacher_code,
  COUNT(se.id) as enrolled_students
FROM subject_classes sc
JOIN subjects s ON s.id = sc.subject_id
LEFT JOIN teachers t ON t.id = sc.teacher_id
LEFT JOIN student_enrollments se ON se.subject_class_id = sc.id
GROUP BY sc.id, sc.subject_name, s.subject_code, t.teacher_code;
```

---

## ⚡ Tips & Tricks

### For Admins
- Create full week timetable at once (use loop)
- Use consistent section naming (M1, M2 vs A, B)
- Set realistic class capacities
- Export join codes for teachers

### For Teachers
- Share join codes early
- Monitor enrollment numbers
- Create multiple sections for popular classes
- Use descriptive class types

### For Students
- Save join codes when received
- Join classes early (before they fill up)
- Verify schedule for conflicts
- Contact teacher if code doesn't work

---

## 🔗 Related Systems

This system integrates with:
- **Attendance System** - Uses `subject_class_id`
- **Grading System** - Uses `subject_class_id`
- **User Management** - Links teachers/students
- **Notification System** - Alerts for class updates

---

## 📞 Getting Help

**Read First:**
1. This quick reference
2. Error messages in console
3. API response messages

**Still Stuck?**
- Check documentation files
- Review code comments
- Test with sample data
- Check database directly

---

**Last Updated:** 2024-11-14  
**Version:** 2.0  
**For:** School Management System
