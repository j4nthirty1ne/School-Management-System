import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let supabase;

    try {
      supabase = createAdminClient();
    } catch (err: any) {
      // Development fallback
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

    // Fetch students from Supabase with user profile join
    const { data: students, error } = await supabase
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
          first_name,
          last_name,
          phone,
          id
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching students:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform the data to flatten user_profiles
    const transformedStudents = students?.map((student: any) => ({
      id: student.id,
      student_code: student.student_code,
      first_name: student.user_profiles?.first_name,
      last_name: student.user_profiles?.last_name,
      phone: student.user_profiles?.phone,
      user_id: student.user_profiles?.id,
      enrollment_status: student.enrollment_status,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      address: student.address,
      enrollment_date: student.enrollment_date,
      emergency_contact_name: student.emergency_contact_name,
      emergency_contact_phone: student.emergency_contact_phone,
      medical_notes: student.medical_notes,
      class_id: student.class_id,
      created_at: student.created_at,
    }));

    return NextResponse.json({
      success: true,
      students: transformedStudents || [],
      count: transformedStudents?.length || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let supabase;

    try {
      supabase = createAdminClient();
    } catch (err: any) {
      // Development fallback
      if (process.env.NODE_ENV === "development") {
        const body = await request.json();
        return NextResponse.json({
          success: true,
          student: {
            id: "dev-student-" + Date.now(),
            student_code: body.student_code || "DEV-" + Date.now(),
            ...body,
            created_at: new Date().toISOString(),
          },
        });
      }
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    const body = await request.json();

    // First create the user profile (this should be done through proper auth flow)
    // For now, assuming user_id is provided or needs to be created first

    // Insert student record
    const { data: student, error } = await supabase
      .from("students")
      .insert({
        user_id: body.user_id, // Must reference an existing user_profile
        student_code: body.student_code,
        date_of_birth: body.date_of_birth,
        gender: body.gender,
        address: body.address,
        enrollment_status: body.enrollment_status || "pending",
        enrollment_date:
          body.enrollment_date || new Date().toISOString().split("T")[0],
        emergency_contact_name: body.emergency_contact_name,
        emergency_contact_phone: body.emergency_contact_phone,
        medical_notes: body.medical_notes,
        class_id: body.class_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating student:", error);
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

export async function PATCH(request: Request) {
  try {
    let supabase;

    try {
      supabase = createAdminClient();
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Update student record
    const { data: student, error } = await supabase
      .from("students")
      .update({
        class_id: body.class_id,
      })
      .eq("id", body.id)
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
