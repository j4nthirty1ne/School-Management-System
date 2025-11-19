import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GET student's enrolled classes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");

    const supabase = createAdminClient();

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: "student_id is required",
        },
        { status: 400 }
      );
    }

    // Get enrollments from class_students table with teacher info
    const { data: enrollments, error } = await supabase
      .from("class_students")
      .select(
        `
        id,
        student_id,
        class_id,
        enrolled_at,
        status,
        classes!inner(
          id,
          subject_name,
          subject_code,
          room_number,
          day_of_week,
          start_time,
          end_time,
          academic_year,
          teacher_id,
          teachers!inner(
            user_profiles!inner(
              first_name,
              last_name
            )
          )
        )
      `
      )
      .eq("student_id", studentId)
      .eq("status", "active");

    if (error) {
      console.error("Error fetching enrollments:", error);
      // If table doesn't exist, return empty array
      return NextResponse.json({
        success: true,
        enrollments: [],
        count: 0,
      });
    }

    return NextResponse.json({
      success: true,
      enrollments: enrollments || [],
      count: enrollments?.length || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      success: true,
      enrollments: [],
      count: 0,
    });
  }
}

// POST enroll student in a class
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { student_id, class_id } = body;

    if (!student_id || !class_id) {
      return NextResponse.json(
        { success: false, error: "student_id and class_id are required" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from("class_students")
      .select("id")
      .eq("student_id", student_id)
      .eq("class_id", class_id)
      .eq("status", "active")
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Already enrolled in this class" },
        { status: 400 }
      );
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from("class_students")
      .insert({
        student_id,
        class_id,
        status: "active",
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating enrollment:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE unenroll from class
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Enrollment ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Soft delete - update status
    const { error } = await supabase
      .from("class_students")
      .update({ status: "dropped" })
      .eq("id", id);

    if (error) {
      console.error("Error dropping enrollment:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
