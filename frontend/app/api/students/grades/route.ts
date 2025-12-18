import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabaseAuth = await createServerClient();
    const maybe = await (supabaseAuth as any).auth.getUser();
    const currentUser = maybe?.data?.user || maybe?.user || null;
    if (!currentUser) {
      return NextResponse.json({ success: true, grades: [] });
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    if (!student || studentError) {
      return NextResponse.json({ success: true, grades: [] });
    }

    // Fetch grades with class information
    const { data: grades, error } = await supabase
      .from("grades")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Grades fetch error:", error);
      return NextResponse.json({ success: true, grades: [] });
    }

    if (!grades || grades.length === 0) {
      return NextResponse.json({ success: true, grades: [] });
    }

    // Get unique class IDs from grades
    const classIds = [
      ...new Set(grades.map((g) => g.class_id).filter(Boolean)),
    ];

    // Fetch class details
    const { data: classes } = await supabase
      .from("classes")
      .select("id, subject_name, subject_code")
      .in("id", classIds);

    // Create a map of class details
    const classMap = new Map();
    classes?.forEach((cls) => {
      classMap.set(cls.id, cls);
    });

    // Transform grades to include class information
    const transformedGrades = grades.map((grade: any) => {
      const classInfo = classMap.get(grade.class_id);
      return {
        ...grade,
        subject: classInfo?.subject_name || "Unknown Subject",
        subject_code: classInfo?.subject_code || "",
        percentage:
          grade.total_marks > 0
            ? Math.round(
                (grade.marks_obtained / grade.total_marks) * 100 * 10
              ) / 10
            : 0,
      };
    });

    return NextResponse.json({ success: true, grades: transformedGrades });
  } catch (err: any) {
    console.error("Grades route error:", err);
    return NextResponse.json({ success: true, grades: [] });
  }
}
