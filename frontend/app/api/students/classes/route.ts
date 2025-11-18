import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const maybe = await (supabase as any).auth.getUser();
    const currentUser = maybe?.data?.user || maybe?.user || null;
    if (!currentUser)
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    if (!student) return NextResponse.json({ success: true, classes: [] });

    // Fetch all enrolled classes from student_class_enrollments
    const { data: enrollments, error } = await supabase
      .from("student_class_enrollments")
      .select(
        `
        id,
        enrolled_at,
        status,
        classes (*)
      `
      )
      .eq("student_id", student.id)
      .eq("status", "active")
      .order("enrolled_at", { ascending: false });

    if (error) {
      console.error("Error fetching enrollments:", error);
      return NextResponse.json({ success: true, classes: [] });
    }

    // Extract classes from enrollments
    const classes =
      enrollments?.map((enrollment) => enrollment.classes).filter(Boolean) ||
      [];

    return NextResponse.json({ success: true, classes });
  } catch (err: any) {
    console.error("Classes API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
