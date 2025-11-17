# Timetable Generation Flow - School Management System

## Overview

This document outlines the systematic flow for generating conflict-free timetables for multiple classes while respecting teacher workload constraints and avoiding scheduling conflicts.

---

## System Parameters

### Input Constraints

| Parameter                  | Value         | Description                 |
| -------------------------- | ------------- | --------------------------- |
| **Total Students**         | 200           | Total student population    |
| **Classes**                | 5 (C1-C5)     | Number of class sections    |
| **Students per Class**     | 40            | Fixed capacity per class    |
| **Subjects**               | 7 (S1-S7)     | Number of subjects to teach |
| **Teaching Days**          | 6             | Monday to Saturday          |
| **Teacher Workload Limit** | 20 hours/week | Maximum hours per teacher   |

### Time Shifts

| Shift             | Time Range         | Duration | Days Available |
| ----------------- | ------------------ | -------- | -------------- |
| **Morning (M)**   | 7:00 AM - 11:00 AM | 4 hours  | Mon-Sat        |
| **Afternoon (A)** | 1:00 PM - 5:00 PM  | 4 hours  | Mon-Sat        |
| **Evening (E)**   | 6:00 PM - 9:00 PM  | 3 hours  | Mon-Sat        |

**Total Available Slots per Week per Class:**

- Morning: 6 days × 4 hours = 24 hours
- Afternoon: 6 days × 4 hours = 24 hours
- Evening: 6 days × 3 hours = 18 hours
- **Total: 66 hours/week available**

---

## Step 1: Define Inputs & Calculate Requirements

### 1.1 Calculate Teaching Demand

```
Target Hours per Class per Week: 35 hours
Number of Classes: 5
Total Weekly Teaching Demand = 35 hours × 5 classes = 175 hours
```

### 1.2 Calculate Minimum Teachers Required

```
Total Teaching Demand: 175 hours
Teacher Capacity: 20 hours/week
Minimum Teachers Required = 175 ÷ 20 = 8.75 ≈ 9 teachers
```

**Recommendation:** Plan for 9-10 teachers to allow flexibility and buffer.

---

## Step 2: Subject Distribution Planning

### 2.1 Define Subject Hour Allocation

Example distribution across 7 subjects for 35 hours/week:

| Subject     | Code | Hours/Week   | Sessions | Session Type       |
| ----------- | ---- | ------------ | -------- | ------------------ |
| Mathematics | S1   | 6 hours      | 2×3h     | Lecture + Practice |
| Science     | S2   | 6 hours      | 2×3h     | Lecture + Lab      |
| English     | S3   | 5 hours      | 2×2.5h   | Lecture + Practice |
| History     | S4   | 4 hours      | 2×2h     | Lecture            |
| Programming | S5   | 6 hours      | 2×3h     | Lecture + Lab      |
| Database    | S6   | 4 hours      | 2×2h     | Lecture + Lab      |
| Web Tech    | S7   | 4 hours      | 2×2h     | Lecture + Lab      |
| **Total**   |      | **35 hours** |          |                    |

### 2.2 Initial Teacher Assignment

| Teacher | Assigned Subjects | Estimated Load       | Qualification    |
| ------- | ----------------- | -------------------- | ---------------- |
| T1      | S1 (Math)         | 18h (6h × 3 classes) | Mathematics      |
| T2      | S2 (Science)      | 18h (6h × 3 classes) | Science          |
| T3      | S3 (English)      | 15h (5h × 3 classes) | English          |
| T4      | S4 (History)      | 12h (4h × 3 classes) | History          |
| T5      | S5 (Programming)  | 18h (6h × 3 classes) | Computer Science |
| T6      | S6 (Database)     | 12h (4h × 3 classes) | Computer Science |
| T7      | S7 (Web Tech)     | 12h (4h × 3 classes) | Computer Science |
| T8      | S1, S2 (Support)  | Variable             | Multi-subject    |
| T9      | S3, S4 (Support)  | Variable             | Multi-subject    |

---

## Step 3: Core Scheduling Algorithm

### 3.1 Scheduling Process Flow

```
FOR EACH Class (C1 to C5):
    Initialize empty timetable grid (6 days × 3 shifts)

    FOR EACH Subject (S1 to S7):
        Get required hours for subject
        Get assigned teacher(s) for subject

        WHILE hours_to_schedule > 0:
            1. Find available time slot
            2. CHECK CONFLICTS:
               a) Teacher not already scheduled at this time
               b) Teacher weekly load < 20 hours
               c) Room available (if applicable)
            3. IF no conflicts:
               - Assign slot
               - Update teacher load tracker
               - Mark slot as occupied
            4. ELSE:
               - Try next available slot
               - If no slots available, flag conflict
            5. Decrement hours_to_schedule

    VALIDATE class timetable:
        - All 35 hours covered
        - No double bookings
        - No gaps > 2 hours (optional quality check)
```

### 3.2 Conflict Detection Matrix

The system maintains a real-time conflict matrix:

```
Time Slot Matrix (Example for Monday Morning 7-11 AM):

Teacher | C1 | C2 | C3 | C4 | C5 | Current Load
--------|----|----|----|----|----|--------------
T1      | S1 | -- | S1 | -- | S1 | 12h / 20h
T2      | -- | S2 | -- | S2 | -- | 8h / 20h
T3      | S3 | -- | S3 | S3 | -- | 15h / 20h
...

✓ = Can schedule
✗ = Conflict detected
```

---

## Step 4: Staggering Strategy

### 4.1 Time Staggering Principles

To prevent conflicts, classes are staggered so the same teacher can teach different classes:

**Pattern Example:**

```
Monday Morning (7-11 AM):
- C1: Teacher T1 teaches S1 (Math)
- C2: Teacher T2 teaches S2 (Science)
- C3: Teacher T1 teaches S1 (Math) - CONFLICT! Must reschedule

Solution: Shift C3's Math to Monday Afternoon
- C3: Teacher T3 teaches S3 (English) instead
- C3's Math moved to a time when T1 is free
```

### 4.2 Optimization Rules

1. **Priority Scheduling:** Schedule high-hour subjects first (S1, S2, S5 with 6 hours)
2. **Load Balancing:** Distribute across shifts to avoid teacher clustering
3. **Preference Order:** Morning > Afternoon > Evening (student alertness)
4. **Lab Scheduling:** Labs (2-3h) scheduled in longer time blocks
5. **Break Management:** Ensure 1-hour breaks between sessions when possible

---

## Step 5: Example Timetable Generation

### Class 1 (C1) - Morning Section

| Day           | Morning (7-11)          | Afternoon (1-5)          | Evening (6-9)               |
| ------------- | ----------------------- | ------------------------ | --------------------------- |
| **Monday**    | S1-Math (T1, 4h)        | S2-Science (T1, 3h)      | --                          |
| **Tuesday**   | S3-English (T3, 3h)     | S4-History (T4, 2h)      | Elective (2h)               |
| **Wednesday** | S5-Programming (T5, 4h) | S6-Database (T6, 2h)     | --                          |
| **Thursday**  | S7-Web Tech (T7, 3h)    | S1-Math (T1, 2h)         | --                          |
| **Friday**    | S2-Science Lab (T2, 3h) | S3-English (T3, 2h)      | S5-Programming Lab (T5, 2h) |
| **Saturday**  | S4-History (T4, 2h)     | S6-Database Lab (T6, 2h) | --                          |

**Total:** 35 hours | **Teacher T1 Load:** 9h (from C1 only)

### Class 2 (C2) - Morning Section (Staggered)

| Day           | Morning (7-11)           | Afternoon (1-5)             | Evening (6-9)        |
| ------------- | ------------------------ | --------------------------- | -------------------- |
| **Monday**    | S2-Science (T2, 4h)      | S1-Math (T1, 3h)            | --                   |
| **Tuesday**   | S5-Programming (T5, 3h)  | S3-English (T3, 2h)         | S7-Web Tech (T7, 2h) |
| **Wednesday** | S1-Math (T1, 4h)         | S4-History (T4, 2h)         | --                   |
| **Thursday**  | S6-Database (T6, 3h)     | S5-Programming Lab (T5, 2h) | --                   |
| **Friday**    | S3-English (T3, 3h)      | S2-Science Lab (T2, 2h)     | Elective (2h)        |
| **Saturday**  | S7-Web Tech Lab (T7, 2h) | S6-Database Lab (T6, 2h)    | --                   |

**Total:** 35 hours | **Teacher T1 Load (from C1+C2):** 16h

---

## Step 6: Validation & Conflict Resolution

### 6.1 Validation Checklist

```javascript
function validateTimetable(allClasses) {
  const errors = [];
  const teacherLoads = new Map();
  const timeSlots = new Map();

  // Check 1: All classes have required hours
  for (const classSchedule of allClasses) {
    const totalHours = calculateTotalHours(classSchedule);
    if (totalHours < 35) {
      errors.push(`${classSchedule.name} only has ${totalHours} hours`);
    }
  }

  // Check 2: Teacher load limits
  for (const [day, shifts] of allClasses) {
    for (const [shift, session] of shifts) {
      const teacher = session.teacher;
      teacherLoads.set(
        teacher,
        (teacherLoads.get(teacher) || 0) + session.hours
      );
    }
  }

  for (const [teacher, load] of teacherLoads) {
    if (load > 20) {
      errors.push(`${teacher} overloaded: ${load} hours (limit: 20)`);
    }
  }

  // Check 3: Teacher conflicts (double booking)
  for (const classSchedule of allClasses) {
    for (const slot of classSchedule.slots) {
      const key = `${slot.day}-${slot.shift}-${slot.teacher}`;
      if (timeSlots.has(key)) {
        errors.push(`Conflict: ${slot.teacher} at ${slot.day} ${slot.shift}`);
      }
      timeSlots.set(key, slot);
    }
  }

  return errors;
}
```

### 6.2 Automatic Conflict Resolution Strategies

**When Teacher Overload Detected:**

1. **Redistribute Hours:** Move some sessions to support teacher (T8, T9)
2. **Reduce Session Duration:** Break 4-hour blocks into 3+1 hour sessions
3. **Hire Additional Teacher:** Flag need for new teacher hire

**When Time Conflict Detected:**

1. **Swap Sessions:** Exchange sessions between classes
2. **Shift to Next Available Slot:** Move to afternoon/evening
3. **Weekend Scheduling:** Use Saturday slots more aggressively

**When Room Conflict Detected:**

1. **Assign Alternative Room:** Move to available room
2. **Shift Time:** Move to when room is available
3. **Virtual Session:** Consider online delivery if applicable

---

## Step 7: Final Output Generation

### 7.1 Timetable Report Format

For each class, generate:

```markdown
# Class M1 (Morning Section 1) - Timetable

**Academic Year:** 2024-2025
**Semester:** Fall 2024
**Total Weekly Hours:** 35

## Monday

- **07:00-11:00** | Math (S1) | Lecture | T1-John Smith | Room 301 | Code: ABC123
- **13:00-16:00** | Science (S2) | Lab | T1-John Smith | Room 302 | Code: DEF456

## Teacher Load Summary

- T1-John Smith: 16/20 hours (80%)
- T2-Jane Doe: 18/20 hours (90%)
  ...

## Statistics

- Morning Sessions: 14 hours (40%)
- Afternoon Sessions: 12 hours (34%)
- Evening Sessions: 9 hours (26%)
```

### 7.2 Conflict Report

```markdown
# Scheduling Conflicts & Resolutions

## Resolved Conflicts

1. **Teacher Overload - T1**

   - Issue: 22 hours assigned (exceeds 20h limit)
   - Resolution: Moved 2h of S1 from C5 to T8
   - Status: ✓ Resolved

2. **Time Conflict - Monday 7-11 AM**
   - Issue: T3 assigned to both C1 and C3
   - Resolution: Moved C3's English to Monday 1-5 PM
   - Status: ✓ Resolved

## Remaining Issues

None - All conflicts resolved.
```

---

## Step 8: System Implementation Workflow

### 8.1 Admin Interface Flow

```
1. Admin logs in to Admin Dashboard
2. Navigate to Timetable → Auto-Generate
3. Configure Parameters:
   ├─ Select Academic Year
   ├─ Select Classes (C1-C5)
   ├─ Confirm Subject Hours Distribution
   ├─ Review Teacher Assignments
   └─ Set Constraints (max teacher hours, preferred shifts)
4. Click "Generate Timetable"
5. System runs algorithm (Step 3)
6. Review Generated Timetables
7. System shows conflict report
8. Admin resolves flagged conflicts:
   ├─ Manual adjustments
   ├─ Run auto-resolve
   └─ Approve changes
9. Publish timetables to teachers and students
```

### 8.2 API Integration Points

```typescript
// API Endpoints for Timetable Generation

// 1. Generate timetable
POST /api/timetable/generate
Body: {
  academic_year: "2024-2025",
  classes: ["C1", "C2", "C3", "C4", "C5"],
  subjects: [...],
  teachers: [...],
  constraints: {
    max_teacher_hours: 20,
    target_class_hours: 35
  }
}
Response: {
  success: true,
  timetables: [...],
  conflicts: [...],
  statistics: {...}
}

// 2. Validate timetable
POST /api/timetable/validate
Body: { timetables: [...] }
Response: {
  valid: true/false,
  errors: [...],
  warnings: [...]
}

// 3. Resolve conflicts
POST /api/timetable/resolve-conflicts
Body: {
  conflicts: [...],
  strategy: "auto" | "manual"
}
Response: {
  resolved: [...],
  remaining: [...]
}

// 4. Publish timetables
POST /api/timetable/publish
Body: {
  timetables: [...],
  notify: true/false
}
Response: { success: true }
```

---

## Step 9: Quality Metrics

### 9.1 Success Criteria

| Metric                    | Target   | Description                            |
| ------------------------- | -------- | -------------------------------------- |
| **Coverage**              | 100%     | All subject hours assigned             |
| **Teacher Load Balance**  | 85-95%   | Teachers at 17-19h (not underutilized) |
| **Conflict Resolution**   | 100%     | Zero conflicts in final timetable      |
| **Student Break Quality** | >80%     | Classes with proper breaks             |
| **Shift Distribution**    | 50/30/20 | Morning/Afternoon/Evening ratio        |

### 9.2 Optimization Scores

```
Timetable Quality Score =
  (0.3 × Coverage Score) +
  (0.3 × Load Balance Score) +
  (0.2 × Conflict Resolution Score) +
  (0.1 × Break Quality Score) +
  (0.1 × Distribution Score)

Target: >90% overall quality score
```

---

## Step 10: Maintenance & Iteration

### 10.1 Weekly Adjustments

- Monitor teacher absences
- Handle room changes
- Accommodate special events
- Process schedule change requests

### 10.2 Semester Review

- Analyze actual vs. planned hours
- Collect teacher feedback
- Review student performance correlation
- Adjust next semester's parameters

---

## Conclusion

This timetable generation flow ensures:
✅ **Systematic approach** to complex scheduling
✅ **Conflict-free** schedules for all classes
✅ **Balanced workload** for all teachers
✅ **Optimal learning** environment for students
✅ **Scalable process** for any school size

The iterative process of **Assign → Check → Resolve → Validate** is the core of automated timetable generation, ensuring a high-quality result that meets all constraints while maximizing resource utilization.

---

## Quick Reference Commands

```bash
# Generate timetable for all classes
npm run timetable:generate

# Validate existing timetable
npm run timetable:validate

# Export to PDF/Excel
npm run timetable:export

# Check teacher loads
npm run timetable:check-loads
```

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Status:** Ready for Implementation
