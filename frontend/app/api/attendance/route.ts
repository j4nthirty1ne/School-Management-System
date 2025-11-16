import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    // Get teacher record for current user
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id, user_id")
      .eq("user_id", currentUser.id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher record not found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { class_id, attendance_date, attendance_records } = body;

    if (!class_id || !attendance_date || !attendance_records) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the class belongs to this teacher
    const { data: classData } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", class_id)
      .single();

    if (!classData || classData.teacher_id !== teacher.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only mark attendance for your own classes",
        },
        { status: 403 }
      );
    }

    // Prepare attendance records for insertion
    const attendanceInserts = attendance_records.map((record: any) => ({
      student_id: record.student_id,
      class_id: class_id,
      attendance_date: attendance_date,
      status: record.status,
      notes: record.notes || null,
      marked_by: teacher.user_id,
    }));

    // Delete existing attendance for this date and class (to allow updates)
    await supabase
      .from("attendance")
      .delete()
      .eq("class_id", class_id)
      .eq("attendance_date", attendance_date);

    // Insert new attendance records
    const { data: attendanceData, error } = await supabase
      .from("attendance")
      .insert(attendanceInserts)
      .select();

    if (error) {
      console.error("Error creating attendance:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: attendanceData.length,
      message: "Attendance marked successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const class_id = searchParams.get("class_id");

    if (!class_id) {
      return NextResponse.json(
        { success: false, error: "class_id is required" },
        { status: 400 }
      );
    }

    // Verify the class belongs to this teacher
    const { data: classData } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", class_id)
      .single();

    if (!classData || classData.teacher_id !== teacher.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only view attendance for your own classes",
        },
        { status: 403 }
      );
    }

    // Get attendance records
    const { data: attendance, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", class_id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching attendance:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendance: attendance || [],
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
