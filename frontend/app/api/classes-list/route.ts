import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get all classes from the classes table
    const { data: classes, error } = await supabase
      .from("classes")
      .select(
        `
        id,
        class_name,
        grade_level,
        section,
        room_number,
        capacity,
        created_at,
        updated_at
      `
      )
      .order("class_name", { ascending: true });

    if (error) {
      console.error("Error fetching classes:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // For each class, get the count of students
    const classesWithStudents = await Promise.all(
      (classes || []).map(async (cls: any) => {
        const { count } = await supabase
          .from("students")
          .select("id", { count: "exact" })
          .eq("class_id", cls.id);

        return {
          ...cls,
          student_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      classes: classesWithStudents,
      count: classesWithStudents.length,
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
    const supabase = createAdminClient();
    const body = await request.json();

    const { class_name, section, grade_level, academic_year } = body;

    if (!class_name || !section || grade_level === null || !academic_year) {
      return NextResponse.json(
        {
          success: false,
          error:
            "class_name, section, grade_level, and academic_year are required",
        },
        { status: 400 }
      );
    }

    // Check if class already exists
    const { data: existing } = await supabase
      .from("classes")
      .select("id")
      .eq("class_name", class_name)
      .eq("section", section)
      .eq("academic_year", academic_year)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Class ${class_name}-${section} already exists`,
        },
        { status: 400 }
      );
    }

    // Create the class with all required fields
    const { data: newClass, error } = await supabase
      .from("classes")
      .insert({
        class_name,
        section,
        grade_level: parseInt(grade_level),
        academic_year,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating class:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: { ...newClass, student_count: 0 },
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
