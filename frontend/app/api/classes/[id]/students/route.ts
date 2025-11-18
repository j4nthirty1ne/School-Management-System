import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current user from auth
    const supabaseAuth = await createServerClient();
    const maybe = await (supabaseAuth as any).auth.getUser();
    const currentUser = maybe?.data?.user || maybe?.user || null;

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    let supabase;

    try {
      supabase = createAdminClient();
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          students: [],
          count: 0,
        });
      }
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    // Get teacher record for current user
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher record not found" },
        { status: 403 }
      );
    }

    // Verify the class belongs to this teacher
    const { data: classData } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", id)
      .single();

    if (!classData || classData.teacher_id !== teacher.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only view students from your own classes",
        },
        { status: 403 }
      );
    }

    // Get students enrolled in this class through student_class_enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from("student_class_enrollments")
      .select("student_id")
      .eq("class_id", id)
      .eq("status", "active");

    if (enrollError) {
      console.error("Error fetching enrollments:", enrollError);
      return NextResponse.json(
        { success: false, error: enrollError.message },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        students: [],
        count: 0,
      });
    }

    const studentIds = enrollments.map((e) => e.student_id);

    const { data: students, error } = await supabase
      .from("students")
      .select(
        `
        id,
        student_code,
        enrollment_status,
        user_profiles!inner (
          first_name,
          last_name,
          phone,
          email,
          id
        )
      `
      )
      .in("id", studentIds);

    if (error) {
      console.error("Error fetching class students:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const transformedStudents = students?.map((student: any) => ({
      id: student.id,
      student_id: student.student_code,
      student_code: student.student_code,
      first_name: student.user_profiles?.first_name,
      last_name: student.user_profiles?.last_name,
      email: student.user_profiles?.email,
      phone: student.user_profiles?.phone,
      user_id: student.user_profiles?.id,
      enrollment_status: student.enrollment_status,
    }));

    return NextResponse.json({
      success: true,
      students: transformedStudents || [],
      count: transformedStudents?.length || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
