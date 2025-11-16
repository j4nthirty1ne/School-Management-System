import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a student
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "student") {
      return NextResponse.json(
        { success: false, error: "Only students can join classes" },
        { status: 403 }
      );
    }

    const { subjectCode } = await req.json();

    if (!subjectCode) {
      return NextResponse.json(
        { success: false, error: "Class code is required" },
        { status: 400 }
      );
    }

    const classCode = subjectCode.toUpperCase();

    // Find class by subject_code (like QTBJ4M)
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("subject_code", classCode)
      .maybeSingle();

    console.log("Class lookup by subject_code:", {
      classCode,
      classData,
      classError,
    });

    if (!classData) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid class code. Please check and try again.",
        },
        { status: 404 }
      );
    }

    // Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id, class_id")
      .eq("user_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Student record not found. Please complete your profile first.",
        },
        { status: 404 }
      );
    }

    // Check if already enrolled in this class
    const { data: existingEnrollment } = await supabase
      .from("student_class_enrollments")
      .select("id")
      .eq("student_id", student.id)
      .eq("class_id", classData.id)
      .maybeSingle();

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "You are already enrolled in this class" },
        { status: 400 }
      );
    }

    // Enroll student in the class
    const { error: enrollError } = await supabase
      .from("student_class_enrollments")
      .insert({
        student_id: student.id,
        class_id: classData.id,
        status: "active",
      });

    if (enrollError) {
      console.error("Enrollment error:", enrollError);
      return NextResponse.json(
        { success: false, error: "Failed to join class. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined class",
      className: classData.subject_name || classData.class_name,
      subjectCode: classData.subject_code,
    });
  } catch (error: any) {
    console.error("Join class error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
