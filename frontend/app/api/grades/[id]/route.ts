import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH - Update a single grade
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a teacher
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: "Not a teacher" }, { status: 403 });
    }

    const gradeId = params.id;
    const { score } = await request.json();

    if (score === undefined || score === null || isNaN(parseFloat(score))) {
      return NextResponse.json(
        { error: "Valid score is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get the grade to verify teacher owns the class
    const { data: grade, error: fetchError } = await adminClient
      .from("grades")
      .select("*, classes!inner(teacher_id)")
      .eq("id", gradeId)
      .single();

    if (fetchError || !grade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Check if teacher owns this class
    if (grade.classes.teacher_id !== teacher.id) {
      return NextResponse.json(
        { error: "You can only edit grades for your own classes" },
        { status: 403 }
      );
    }

    // Update the grade
    const { data: updatedGrade, error: updateError } = await adminClient
      .from("grades")
      .update({
        score: parseFloat(score),
        percentage: grade.max_score
          ? ((parseFloat(score) / grade.max_score) * 100).toFixed(1)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gradeId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating grade:", updateError);
      return NextResponse.json(
        { error: "Failed to update grade" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      grade: updatedGrade,
    });
  } catch (error) {
    console.error("Error in PATCH /api/grades/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a single grade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a teacher
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: "Not a teacher" }, { status: 403 });
    }

    const gradeId = params.id;
    const adminClient = createAdminClient();

    // Get the grade to verify teacher owns the class
    const { data: grade, error: fetchError } = await adminClient
      .from("grades")
      .select("*, classes!inner(teacher_id)")
      .eq("id", gradeId)
      .single();

    if (fetchError || !grade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Check if teacher owns this class
    if (grade.classes.teacher_id !== teacher.id) {
      return NextResponse.json(
        { error: "You can only delete grades for your own classes" },
        { status: 403 }
      );
    }

    // Delete the grade
    const { error: deleteError } = await adminClient
      .from("grades")
      .delete()
      .eq("id", gradeId);

    if (deleteError) {
      console.error("Error deleting grade:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete grade" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Grade deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/grades/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
