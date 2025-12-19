import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseAdmin } from "@/lib/backend/config/supabase";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

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
    const { id } = await params;
    const body = await request.json();

    // Get the student to find user_id
    const { data: studentData, error: fetchError } = await supabase
      .from("students")
      .select("user_id, class_id")
      .eq("id", id)
      .single();

    if (fetchError || !studentData) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Separate updates for students and user_profiles tables
    const userProfileFields = ["first_name", "last_name", "phone", "email"];
    const userProfileUpdates: any = {};
    const studentUpdates: any = {};

    Object.keys(body).forEach((key) => {
      if (userProfileFields.includes(key)) {
        userProfileUpdates[key] = body[key];
      } else {
        studentUpdates[key] = body[key];
      }
    });

    // Update user_profiles if needed
    if (Object.keys(userProfileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update(userProfileUpdates)
        .eq("id", studentData.user_id);

      if (profileError) {
        console.error("Error updating user profile:", profileError);
        return NextResponse.json(
          { success: false, error: profileError.message },
          { status: 500 }
        );
      }
    }

    // Update students table if needed
    if (Object.keys(studentUpdates).length > 0) {
      const { error: studentError } = await supabase
        .from("students")
        .update(studentUpdates)
        .eq("id", id);

      if (studentError) {
        console.error("Error updating student:", studentError);
        return NextResponse.json(
          { success: false, error: studentError.message },
          { status: 500 }
        );
      }
    }

    // Fetch updated student
    const { data: updatedStudent, error: refetchError } = await supabase
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
        class_id,
        created_at,
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

    if (refetchError || !updatedStudent) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch updated student" },
        { status: 500 }
      );
    }

    // Flatten the response
    const profile = Array.isArray(updatedStudent.user_profiles)
      ? updatedStudent.user_profiles[0]
      : updatedStudent.user_profiles;

    const student = {
      id: updatedStudent.id,
      student_code: updatedStudent.student_code,
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      phone: profile?.phone,
      email: profile?.email,
      user_id: profile?.id,
      enrollment_status: updatedStudent.enrollment_status,
      date_of_birth: updatedStudent.date_of_birth,
      gender: updatedStudent.gender,
      address: updatedStudent.address,
      enrollment_date: updatedStudent.enrollment_date,
      emergency_contact_name: updatedStudent.emergency_contact_name,
      emergency_contact_phone: updatedStudent.emergency_contact_phone,
      medical_notes: updatedStudent.medical_notes,
      class_id: updatedStudent.class_id,
      created_at: updatedStudent.created_at,
    };

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
    const { id } = await params;

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
