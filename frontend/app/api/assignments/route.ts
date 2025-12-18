import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    let supabase;

    try {
      supabase = createAdminClient();
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        const body = await request.json();
        return NextResponse.json({
          success: true,
          assignment: {
            id: Math.random().toString(36).substring(7),
            ...body,
            created_at: new Date().toISOString(),
          },
        });
      }
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    const body = await request.json();

    console.log("Assignment creation request:", body);

    // Get the current user from cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const userIdMatch = cookieHeader.match(/user_id=([^;]+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;

    console.log("User ID from cookie:", userId);

    // Prepare insert data
    const insertData: any = {
      class_id: body.class_id,
      title: body.title,
      description: body.description,
      type: body.type,
      due_date: body.due_date,
      max_score: body.max_score,
      instructions: body.instructions,
      file_url: body.file_url || null,
      file_name: body.file_name || null,
      status: "active",
    };

    // Only add created_by if we have a userId
    if (userId) {
      insertData.created_by = userId;
    }

    console.log("Insert data:", insertData);

    // Insert assignment into database
    const { data: assignmentData, error } = await supabase
      .from("assignments")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log("Assignment created successfully:", assignmentData);

    return NextResponse.json({
      success: true,
      assignment: assignmentData,
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "An error occurred while creating the assignment",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    let supabase;

    try {
      supabase = createAdminClient();
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          assignments: [
            {
              id: "1",
              title: "Math Assignment 1",
              type: "assignment",
              due_date: "2025-11-20",
              max_score: 100,
            },
          ],
        });
      }
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");

    let query = supabase.from("assignments").select("*");

    if (classId) {
      query = query.eq("class_id", classId);
    }

    const { data: assignments, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
