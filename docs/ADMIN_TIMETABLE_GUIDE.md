# Admin Timetable Quick Start Guide

## Creating a Class Schedule in 3 Steps

### Step 1: Ensure Subjects Exist

Before creating schedules, make sure subjects are created:

1. Go to Admin Dashboard
2. Not yet implemented in Timetable tab, but subjects can be added via API

### Step 2: Create a Timetable Schedule

1. **Navigate to Timetable Tab**

   - Admin Dashboard → Click "Timetable" tab

2. **Click "Create Schedule"**

3. **Fill in the Form:**

   - **Subject\*** - Select from dropdown (e.g., Mathematics - MATH101)
   - **Teacher\*** - Select from dropdown (e.g., John Doe)
   - **Day of Week\*** - Select day (Monday-Saturday)
   - **Class Type\*** - Select type:
     - Lecture (main teaching)
     - Practice (exercises)
     - Lab (practical work)
     - Tutorial (small group)
   - **Start Time\*** - Set start time (e.g., 07:00)
   - **End Time\*** - Set end time (e.g., 08:00)
   - **Section\*** - Enter section code (e.g., M1, A2, E3)
     - M = Morning
     - A = Afternoon
     - E = Evening
   - **Room Number\*** - Enter room (e.g., Room 301)
   - **Capacity\*** - Enter max students (e.g., 30)
   - **Semester** - Optional (e.g., Fall 2024)

4. **Click "Create Schedule"**

5. **Note the Join Code** - A unique code will be displayed (e.g., ABC123XY)
   - Teachers will use this to share with students

### Step 3: Share Join Code with Teacher

The teacher can now:

- View this schedule in their timetable
- Share the join code with students for enrollment

---

## Example Schedule Creation

### Example 1: Morning Math Lecture

```
Subject: Mathematics (MATH101)
Teacher: John Smith
Day: Monday
Time: 07:00 - 08:00
Section: M1
Room: Room 301
Class Type: Lecture
Capacity: 30

→ System generates: Join Code ABC123
```

### Example 2: Afternoon Programming Lab

```
Subject: Programming (CS101)
Teacher: Jane Doe
Day: Tuesday
Time: 14:00 - 16:00
Section: A1
Room: Computer Lab 2
Class Type: Lab
Capacity: 25

→ System generates: Join Code XYZ789
```

---

## Managing Existing Schedules

### View All Schedules

- Schedules are organized by day (Monday-Saturday)
- Each day shows all classes scheduled
- Color-coded by class type

### Edit a Schedule

1. Find the schedule in the day view
2. Click the three-dot menu (⋮)
3. Select "Edit"
4. Modify fields as needed
5. Click "Update Schedule"

### Delete a Schedule

1. Find the schedule in the day view
2. Click the three-dot menu (⋮)
3. Select "Delete"
4. Confirm deletion

### View Details

1. Find the schedule in the day view
2. Click the three-dot menu (⋮)
3. Select "View Details"

- See full information including join code

---

## Understanding Sections

**Section Naming Convention:**

- **M** = Morning shift (typically 7 AM - 12 PM)
- **A** = Afternoon shift (typically 1 PM - 5 PM)
- **E** = Evening shift (typically 6 PM - 9 PM)
- **Number** = Group/Division (1, 2, 3, etc.)

**Examples:**

- **M1** = Morning Group 1
- **M2** = Morning Group 2
- **A1** = Afternoon Group 1
- **E3** = Evening Group 3

**Student Assignment:**
Each student belongs to a section (e.g., Student Yean belongs to M1). They attend all classes scheduled for their section.

---

## Class Types Explained

| Type         | Purpose                | Duration  | Example                   |
| ------------ | ---------------------- | --------- | ------------------------- |
| **Lecture**  | Main teaching session  | 1-2 hours | Theory lessons            |
| **Practice** | Exercises and problems | 1-2 hours | Problem-solving           |
| **Lab**      | Hands-on practical     | 2-3 hours | Computer lab, Science lab |
| **Tutorial** | Small group discussion | 1 hour    | Q&A, Review               |

---

## Common Workflows

### Creating a Full Day Schedule for Class M1

**Monday - Class M1:**

```
7:00-8:00   Math (Lecture)     Room 301    Teacher: John
8:00-9:00   Physics (Lecture)  Room 302    Teacher: Mary
9:00-10:00  Break
10:00-11:00 English (Practice) Room 101    Teacher: Bob
```

**Steps:**

1. Create Math schedule (Monday, 7:00-8:00, M1, Lecture)
2. Create Physics schedule (Monday, 8:00-9:00, M1, Lecture)
3. Create English schedule (Monday, 10:00-11:00, M1, Practice)

### Creating Same Subject for Multiple Sections

**Math for all morning sections:**

```
Monday 7:00-8:00 → Math M1 (Room 301)
Monday 8:00-9:00 → Math M2 (Room 302)
Monday 9:00-10:00 → Math M3 (Room 303)
```

**Steps:**

1. Create schedule for M1
2. Create schedule for M2 (different room, different time)
3. Create schedule for M3 (different room, different time)

---

## Tips and Best Practices

### ✅ Do's

- ✅ Use clear section names (M1, A2, etc.)
- ✅ Ensure room numbers are unique per time slot
- ✅ Set realistic capacity based on room size
- ✅ Use consistent naming for subjects
- ✅ Note down join codes for teachers
- ✅ Create schedules at least one week before semester starts

### ❌ Don'ts

- ❌ Don't schedule same teacher in two places at once
- ❌ Don't exceed room capacity
- ❌ Don't use confusing section names
- ❌ Don't create schedules without confirming teacher availability
- ❌ Don't forget to share join codes with teachers

---

## Troubleshooting

### Problem: Can't create schedule

**Solution:**

- Ensure all required fields (\*) are filled
- Check that subject exists
- Verify teacher is in the system
- Confirm academic year is correct

### Problem: Join code not showing

**Solution:**

- Join code appears after successful creation
- Check the success message
- View schedule details to see join code

### Problem: Schedule not appearing for teacher

**Solution:**

- Verify correct teacher was selected
- Check academic year matches
- Ensure teacher is logged in correctly
- Refresh the page

### Problem: Need to change schedule

**Solution:**

- Use Edit function to modify
- Or delete and recreate if major changes needed

---

## Quick Reference

### Required Fields

- Subject
- Teacher
- Day of Week
- Class Type
- Start Time
- End Time
- Section
- Room Number
- Capacity

### Days Available

Monday, Tuesday, Wednesday, Thursday, Friday, Saturday

### Class Types

Lecture, Practice, Lab, Tutorial

### Academic Year Format

YYYY-YYYY (e.g., 2024-2025)

---

## Support

If you encounter any issues:

1. Check all required fields are filled
2. Verify data in dropdowns is correct
3. Refresh the page
4. Contact system administrator

---

## Navigation

- **Admin Dashboard** → Timetable Tab
- **Teacher View** → /teacher/timetable
- **Student View** → /student/timetable
