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
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher record not found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      class_id,
      assignment_id,
      grade_type,
      max_score,
      grade_date,
      notes,
      grades,
    } = body;

    if (!class_id || !grade_type || !max_score || !grades) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the class belongs to this teacher
    const { data: classData } = await supabase
      .from("classes")
      .select("teacher_id, subject_id")
      .eq("id", class_id)
      .single();

    if (!classData || classData.teacher_id !== teacher.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only enter grades for your own classes",
        },
        { status: 403 }
      );
    }

    // Prepare grade records for insertion
    const gradeInserts = grades.map((grade: any) => {
      const gradeRecord: any = {
        student_id: grade.student_id,
        class_id: class_id,
        score: parseFloat(grade.score),
        assessment_type: grade_type || "assignment",
        assessment_date: grade_date || new Date().toISOString().split("T")[0],
      };

      // Add subject_id if available
      if (classData.subject_id) {
        gradeRecord.subject_id = classData.subject_id;
      }

      // Add notes - include assignment info if grading from assignment
      if (notes || assignment_id) {
        let noteText = notes || "";
        if (assignment_id && !noteText.includes("Assignment ID:")) {
          noteText = noteText
            ? `${noteText} (Assignment ID: ${assignment_id})`
            : `Assignment ID: ${assignment_id}`;
        }
        gradeRecord.notes = noteText;
      }

      return gradeRecord;
    });

    // Insert grade records
    const { data: gradeData, error } = await supabase
      .from("grades")
      .insert(gradeInserts)
      .select();

    if (error) {
      console.error("Error creating grades:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: gradeData.length,
      message: "Grades submitted successfully",
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
          error: "You can only view grades for your own classes",
        },
        { status: 403 }
      );
    }

    // Get grade records
    const { data: grades, error } = await supabase
      .from("grades")
      .select("*")
      .eq("class_id", class_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching grades:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform grades to match frontend expectations
    const transformedGrades = (grades || []).map((grade) => ({
      ...grade,
    }));

    return NextResponse.json({
      success: true,
      grades: transformedGrades,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
          error: "You can only delete grades for your own classes",
        },
        { status: 403 }
      );
    }

    // Delete all grades for this class
    const { error } = await supabase
      .from("grades")
      .delete()
      .eq("class_id", class_id);

    if (error) {
      console.error("Error deleting grades:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "All grades deleted successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
