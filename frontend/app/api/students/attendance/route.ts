import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    let supabase;

    try {
      supabase = await createServerClient();
    } catch (err: any) {
      // Return empty data in development or when Supabase not configured
      return NextResponse.json({ success: true, attendance: [] });
    }

    // get current user from cookies/session
    const maybe = await (supabase as any).auth.getUser();
    const currentUser = maybe?.data?.user || maybe?.user || null;
    if (!currentUser) {
      // Return empty instead of 401 to avoid breaking UI
      return NextResponse.json({ success: true, attendance: [] });
    }

    // find student record for this user
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    if (!student || studentError) {
      return NextResponse.json({ success: true, attendance: [] });
    }

    const { data: attendance, error } = await supabase
      .from("attendance")
      .select(
        `
        id,
        attendance_date,
        status,
        notes,
        created_at,
        classes:class_id (
          id,
          subject_name,
          subject_code,
          room_number,
          start_time,
          end_time,
          day_of_week
        )
      `
      )
      .eq("student_id", student.id)
      .order("attendance_date", { ascending: false });

    if (error) {
      console.error("Attendance fetch error:", error);
      return NextResponse.json({ success: true, attendance: [] });
    }

    // Transform data to include class information
    const transformedAttendance = (attendance || []).map((record: any) => ({
      id: record.id,
      date: record.attendance_date,
      status: record.status,
      notes: record.notes,
      created_at: record.created_at,
      class_name: record.classes?.subject_name || "Unknown Class",
      class_code: record.classes?.subject_code || "",
      room_number: record.classes?.room_number || "",
      start_time: record.classes?.start_time || "",
      end_time: record.classes?.end_time || "",
      day_of_week: record.classes?.day_of_week || "",
    }));

    return NextResponse.json({
      success: true,
      attendance: transformedAttendance,
    });
  } catch (err: any) {
    console.error("Attendance route error:", err);
    return NextResponse.json({ success: true, attendance: [] });
  }
}
