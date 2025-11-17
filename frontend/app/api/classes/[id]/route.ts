import { createAdminClient } from "@/lib/supabase/admin";
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

    const body = await request.json();

    // Build update object with only provided fields
    const updateData: any = {};

    if (body.subject_name !== undefined)
      updateData.subject_name = body.subject_name;
    if (body.subject_id !== undefined) updateData.subject_id = body.subject_id;
    if (body.academic_year !== undefined)
      updateData.academic_year = body.academic_year;
    if (body.room_number !== undefined)
      updateData.room_number = body.room_number;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.day_of_week !== undefined)
      updateData.day_of_week = body.day_of_week;
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.end_time !== undefined) updateData.end_time = body.end_time;

    const { data: classData, error } = await supabase
      .from("classes")
      .update(updateData)
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
