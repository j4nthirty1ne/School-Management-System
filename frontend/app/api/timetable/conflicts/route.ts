import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// POST - Check for scheduling conflicts
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const {
      subject_class_id, // Optional: for checking existing class conflicts
      teacher_id,
      day_of_week,
      start_time,
      end_time,
      room_number,
      academic_year,
    } = body;

    if (
      !teacher_id ||
      !day_of_week ||
      !start_time ||
      !end_time ||
      !academic_year
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const conflicts: any[] = [];

    // 1. Check teacher conflicts (same teacher, same time)
    let teacherQuery = supabase
      .from("subject_classes")
      .select(
        "*, subjects(subject_name), teachers:teacher_id(first_name, last_name)"
      )
      .eq("teacher_id", teacher_id)
      .eq("day_of_week", day_of_week)
      .eq("academic_year", academic_year)
      .eq("is_active", true);

    // Exclude the class being edited
    if (subject_class_id) {
      teacherQuery = teacherQuery.neq("id", subject_class_id);
    }

    const { data: teacherClasses, error: teacherError } = await teacherQuery;

    if (!teacherError && teacherClasses) {
      for (const cls of teacherClasses) {
        if (isTimeOverlap(start_time, end_time, cls.start_time, cls.end_time)) {
          conflicts.push({
            type: "teacher_conflict",
            severity: "critical",
            message: `Teacher is already teaching ${
              cls.subjects?.subject_name || "another class"
            } (${cls.section}) at this time`,
            details: {
              class_id: cls.id,
              subject: cls.subjects?.subject_name,
              section: cls.section,
              time: `${cls.start_time} - ${cls.end_time}`,
              room: cls.room_number,
            },
          });
        }
      }
    }

    // 2. Check room conflicts (same room, same time)
    if (room_number) {
      let roomQuery = supabase
        .from("subject_classes")
        .select(
          "*, subjects(subject_name), teachers:teacher_id(first_name, last_name)"
        )
        .eq("room_number", room_number)
        .eq("day_of_week", day_of_week)
        .eq("academic_year", academic_year)
        .eq("is_active", true);

      if (subject_class_id) {
        roomQuery = roomQuery.neq("id", subject_class_id);
      }

      const { data: roomClasses, error: roomError } = await roomQuery;

      if (!roomError && roomClasses) {
        for (const cls of roomClasses) {
          if (
            isTimeOverlap(start_time, end_time, cls.start_time, cls.end_time)
          ) {
            const teacherName = cls.teachers
              ? `${cls.teachers.first_name} ${cls.teachers.last_name}`
              : "Unknown Teacher";

            conflicts.push({
              type: "room_conflict",
              severity: "critical",
              message: `Room ${room_number} is already booked for ${
                cls.subjects?.subject_name || "another class"
              } (${cls.section})`,
              details: {
                class_id: cls.id,
                subject: cls.subjects?.subject_name,
                section: cls.section,
                teacher: teacherName,
                time: `${cls.start_time} - ${cls.end_time}`,
              },
            });
          }
        }
      }
    }

    // 3. Check teacher weekly workload
    const { data: teacherSchedule, error: scheduleError } = await supabase
      .from("subject_classes")
      .select("start_time, end_time, day_of_week")
      .eq("teacher_id", teacher_id)
      .eq("academic_year", academic_year)
      .eq("is_active", true)
      .neq("id", subject_class_id || "none");

    if (!scheduleError && teacherSchedule) {
      const totalHours = calculateTotalHours([
        ...teacherSchedule,
        { start_time, end_time, day_of_week },
      ]);

      if (totalHours > 20) {
        conflicts.push({
          type: "workload_conflict",
          severity: "warning",
          message: `This assignment will exceed teacher's weekly limit (${totalHours.toFixed(
            1
          )}/20 hours)`,
          details: {
            current_load: (
              totalHours - calculateHours(start_time, end_time)
            ).toFixed(1),
            new_load: totalHours.toFixed(1),
            limit: 20,
            excess: (totalHours - 20).toFixed(1),
          },
        });
      } else if (totalHours > 18) {
        conflicts.push({
          type: "workload_warning",
          severity: "info",
          message: `Teacher will have ${totalHours.toFixed(
            1
          )}/20 hours after this assignment`,
          details: {
            current_load: (
              totalHours - calculateHours(start_time, end_time)
            ).toFixed(1),
            new_load: totalHours.toFixed(1),
            limit: 20,
            remaining: (20 - totalHours).toFixed(1),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      has_conflicts: conflicts.length > 0,
      conflicts,
      conflict_count: conflicts.length,
      critical_conflicts: conflicts.filter((c) => c.severity === "critical")
        .length,
      warnings: conflicts.filter(
        (c) => c.severity === "warning" || c.severity === "info"
      ).length,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to check if two time ranges overlap
function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert time strings to minutes for easier comparison
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Check if ranges overlap
  return s1 < e2 && e1 > s2;
}

// Helper function to calculate hours between two times
function calculateHours(start: string, end: string): number {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  return (endMin - startMin) / 60;
}

// Helper function to calculate total weekly hours
function calculateTotalHours(
  schedule: Array<{ start_time: string; end_time: string; day_of_week: string }>
): number {
  let total = 0;
  for (const slot of schedule) {
    total += calculateHours(slot.start_time, slot.end_time);
  }
  return total;
}
