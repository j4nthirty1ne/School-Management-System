import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GET all subject classes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academic_year") || "2024-2025";
    const teacherId = searchParams.get("teacher_id");

    const supabase = createAdminClient();

    // Use the view for detailed information
    let query = supabase
      .from("v_subject_classes_detailed")
      .select("*")
      .eq("academic_year", academicYear)
      .eq("is_active", true);

    if (teacherId) {
      query = query.eq("teacher_id", teacherId);
    }

    const { data: classes, error } = await query
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching subject classes:", error);
      return NextResponse.json({
        success: true,
        classes: [],
        count: 0,
      });
    }

    return NextResponse.json({
      success: true,
      classes: classes || [],
      count: classes?.length || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      success: true,
      classes: [],
      count: 0,
    });
  }
}

// POST create new subject class
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Generate join code
    const { data: joinCodeData } = await supabase.rpc(
      "generate_subject_class_join_code"
    );
    const joinCode =
      joinCodeData || `CLS${Date.now().toString(36).toUpperCase()}`;

    const { data: subjectClass, error } = await supabase
      .from("subject_classes")
      .insert({
        subject_id: body.subject_id,
        teacher_id: body.teacher_id,
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        room_number: body.room_number,
        class_type: body.class_type || "lecture",
        section: body.section,
        academic_year: body.academic_year || "2024-2025",
        semester: body.semester,
        join_code: joinCode,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subject class:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: subjectClass,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE subject class
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subject class ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("subject_classes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subject class:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH update subject class
export async function PATCH(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subject class ID is required" },
        { status: 400 }
      );
    }

    const { data: subjectClass, error } = await supabase
      .from("subject_classes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subject class:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: subjectClass,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
