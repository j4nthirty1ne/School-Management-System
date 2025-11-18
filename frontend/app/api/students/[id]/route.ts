import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseAdmin } from "@/lib/backend/config/supabase";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    // Select student and join user_profiles to include name/phone
    const { data: studentRaw, error } = await supabase
      .from("students")
      .select(
        `
        id,
        student_code,
        enrollment_status,
        date_of_birth,
        gender,
        address,
        enrollment_date,
        emergency_contact_name,
        emergency_contact_phone,
        medical_notes,
        created_at,
        class_id,
        user_profiles!inner (
          id,
          first_name,
          last_name,
          phone,
          email
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching student:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!studentRaw) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Flatten the joined profile to match list shape
    const profile = Array.isArray(studentRaw.user_profiles)
      ? studentRaw.user_profiles[0]
      : studentRaw.user_profiles;

    const student = {
      id: studentRaw.id,
      student_code: studentRaw.student_code,
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      phone: profile?.phone,
      email: profile?.email,
      user_id: profile?.id,
      enrollment_status: studentRaw.enrollment_status,
      date_of_birth: studentRaw.date_of_birth,
      gender: studentRaw.gender,
      address: studentRaw.address,
      enrollment_date: studentRaw.enrollment_date,
      emergency_contact_name: studentRaw.emergency_contact_name,
      emergency_contact_phone: studentRaw.emergency_contact_phone,
      medical_notes: studentRaw.medical_notes,
      class_id: studentRaw.class_id,
      created_at: studentRaw.created_at,
    };

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
    const body = await request.json();

    const { data: student, error } = await supabase
      .from("students")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating student:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    // First, get the student to find the user_id
    const { data: student, error: fetchError } = await supabase
      .from("students")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Delete from students table (this will cascade to parent_student_links)
    const { error: deleteStudentError } = await supabaseAdmin
      .from("students")
      .delete()
      .eq("id", id);

    if (deleteStudentError) {
      console.error("Error deleting student record:", deleteStudentError);
      return NextResponse.json(
        { success: false, error: deleteStudentError.message },
        { status: 500 }
      );
    }

    // Delete user profile (this will cascade to related tables)
    const { error: deleteProfileError } = await supabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("id", student.user_id);

    if (deleteProfileError) {
      console.error("Error deleting user profile:", deleteProfileError);
      return NextResponse.json(
        { success: false, error: deleteProfileError.message },
        { status: 500 }
      );
    }

    // Delete auth user using admin API
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(student.user_id);

    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError);
      // Don't fail here since the database records are already deleted
      console.warn(
        "Auth user deletion failed but database records were cleaned up"
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
