import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// POST - Student enrolls in a class using join code
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { join_code, student_id } = body;

    if (!join_code || !student_id) {
      return NextResponse.json(
        { success: false, error: "Join code and student ID are required" },
        { status: 400 }
      );
    }

    // 1. Find the subject class by join code
    const { data: subjectClass, error: findError } = await supabase
      .from("subject_classes")
      .select("*, subjects(subject_name, subject_code)")
      .eq("join_code", join_code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (findError || !subjectClass) {
      return NextResponse.json(
        { success: false, error: "Invalid join code or class not found" },
        { status: 404 }
      );
    }

    // 2. Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("student_enrollments")
      .select("id")
      .eq("student_id", student_id)
      .eq("subject_class_id", subjectClass.id)
      .eq("is_active", true)
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "You are already enrolled in this class" },
        { status: 400 }
      );
    }

    // 3. Enroll the student
    const { data: enrollment, error: enrollError } = await supabase
      .from("student_enrollments")
      .insert({
        student_id: student_id,
        subject_class_id: subjectClass.id,
        enrollment_date: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (enrollError) {
      console.error("Error enrolling student:", enrollError);
      return NextResponse.json(
        { success: false, error: enrollError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment,
      class: {
        subject_name: subjectClass.subjects?.subject_name,
        subject_code: subjectClass.subjects?.subject_code,
        section: subjectClass.section,
        room_number: subjectClass.room_number,
        day_of_week: subjectClass.day_of_week,
        start_time: subjectClass.start_time,
        end_time: subjectClass.end_time,
      },
      message: `Successfully enrolled in ${
        subjectClass.subjects?.subject_name || "class"
      }!`,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
