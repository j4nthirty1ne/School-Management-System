import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let supabase;

    try {
      supabase = createAdminClient();
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          class: {
            id: id,
            class_name: "Dev Class",
            grade_level: "10",
            section: "A",
          },
        });
      }
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    const { data: classData, error } = await supabase
      .from("classes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: classData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      if (process.env.NODE_ENV === "development") {
        const body = await request.json();
        return NextResponse.json({
          success: true,
          class: {
            id: id,
            ...body,
            updated_at: new Date().toISOString(),
          },
        });
      }
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

    // Verify the class belongs to this teacher
    const { data: existingClass } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", id)
      .single();

    if (!existingClass || existingClass.teacher_id !== teacher.id) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own classes" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { data: classData, error } = await supabase
      .from("classes")
      .update({
        subject_name: body.subject_name,
        subject_id: body.subject_id || null,
        academic_year: body.academic_year,
        room_number: body.room_number || null,
        capacity: body.capacity,
        day_of_week: body.day_of_week || null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: classData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          message: "Class deleted successfully (dev mode)",
        });
      }
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

    // Verify the class belongs to this teacher
    const { data: existingClass } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", id)
      .single();

    if (!existingClass || existingClass.teacher_id !== teacher.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own classes" },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("classes").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
