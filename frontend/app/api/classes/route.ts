import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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
      // Development fallback
      return NextResponse.json({
        success: true,
        classes: [],
        count: 0,
      });
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    let classes;
    let error;

    // If admin, get all classes; if teacher, get only their classes
    if (userProfile?.role === "admin") {
      // Admin sees all classes
      const result = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });
      classes = result.data;
      error = result.error;
    } else {
      // Get teacher record for current user
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", currentUser.id)
        .single();

      if (!teacher) {
        return NextResponse.json({
          success: true,
          classes: [],
          count: 0,
        });
      }

      // Get only classes belonging to this teacher
      const result = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", teacher.id)
        .order("created_at", { ascending: false });
      classes = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error fetching classes:", error);
      // Return empty array instead of error
      return NextResponse.json({
        success: true,
        classes: [],
        count: 0,
      });
    }

    // If we have classes and teacher_id, try to get teacher info
    const transformedClasses = await Promise.all(
      (classes || []).map(async (cls) => {
        if (cls.teacher_id) {
          try {
            const { data: teacher } = await supabase
              .from("teachers")
              .select("id, first_name, last_name, teacher_code")
              .eq("id", cls.teacher_id)
              .single();

            return {
              ...cls,
              teacher_name: teacher
                ? `${teacher.first_name} ${teacher.last_name}`
                : null,
            };
          } catch {
            return { ...cls, teacher_name: null };
          }
        }
        return { ...cls, teacher_name: null };
      })
    );

    return NextResponse.json({
      success: true,
      classes: transformedClasses,
      count: transformedClasses.length,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    // Return empty array for any unexpected errors
    return NextResponse.json({
      success: true,
      classes: [],
      count: 0,
    });
  }
}

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
      // Development fallback
      if (process.env.NODE_ENV === "development") {
        const body = await request.json();
        return NextResponse.json({
          success: true,
          class: {
            id: "dev-class-" + Date.now(),
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

    console.log("POST /api/classes - Request body:", body);

    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    console.log("User profile:", userProfile);

    let teacherId;

    // If admin, use the teacher_id from the request body
    // If teacher, use their own teacher record
    if (userProfile?.role === "admin") {
      console.log("User is admin, teacher_id from body:", body.teacher_id);
      if (!body.teacher_id) {
        console.error("Admin user did not provide teacher_id");
        return NextResponse.json(
          { success: false, error: "Teacher ID is required for admin users" },
          { status: 400 }
        );
      }
      teacherId = body.teacher_id;
    } else {
      console.log("User is not admin, looking up teacher record");
      // Get teacher record for current user
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", currentUser.id)
        .single();

      if (!teacher) {
        console.error("Teacher record not found for user:", currentUser.id);
        return NextResponse.json(
          { success: false, error: "Teacher record not found" },
          { status: 403 }
        );
      }
      teacherId = teacher.id;
    }

    console.log("Using teacher_id:", teacherId);

    // Generate a unique 6-character subject code
    const generateSubjectCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const subjectCode = generateSubjectCode();

    // Check for room conflict (same room, same day, overlapping time)
    if (
      body.room_number &&
      body.day_of_week &&
      body.start_time &&
      body.end_time
    ) {
      const { data: existingClasses } = await supabase
        .from("classes")
        .select("id, subject_name, start_time, end_time")
        .eq("room_number", body.room_number)
        .eq("day_of_week", body.day_of_week);

      if (existingClasses && existingClasses.length > 0) {
        const newStart = body.start_time;
        const newEnd = body.end_time;

        for (const existing of existingClasses) {
          const existingStart = existing.start_time;
          const existingEnd = existing.end_time;

          // Check if times overlap
          if (
            (newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            return NextResponse.json(
              {
                success: false,
                error: `Room ${body.room_number} is already booked on ${body.day_of_week} from ${existingStart} to ${existingEnd} for ${existing.subject_name}`,
              },
              { status: 409 }
            );
          }
        }
      }
    }

    const { data: classData, error } = await supabase
      .from("classes")
      .insert({
        subject_name: body.subject_name,
        subject_code: subjectCode,
        subject_id: body.subject_id || null,
        academic_year: body.academic_year,
        teacher_id: teacherId,
        room_number: body.room_number || null,
        day_of_week: body.day_of_week || null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
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
      class: classData,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    // If not admin, verify the class belongs to this teacher
    if (userProfile?.role !== "admin") {
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
    }

    // Check for room conflict (same room, same day, overlapping time)
    if (
      updateData.room_number &&
      updateData.day_of_week &&
      updateData.start_time &&
      updateData.end_time
    ) {
      const { data: existingClasses } = await supabase
        .from("classes")
        .select("id, subject_name, start_time, end_time")
        .eq("room_number", updateData.room_number)
        .eq("day_of_week", updateData.day_of_week)
        .neq("id", id); // Exclude the class being updated

      if (existingClasses && existingClasses.length > 0) {
        const newStart = updateData.start_time;
        const newEnd = updateData.end_time;

        for (const existing of existingClasses) {
          const existingStart = existing.start_time;
          const existingEnd = existing.end_time;

          // Check if times overlap
          if (
            (newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            return NextResponse.json(
              {
                success: false,
                error: `Room ${updateData.room_number} is already booked on ${updateData.day_of_week} from ${existingStart} to ${existingEnd} for ${existing.subject_name}`,
              },
              { status: 409 }
            );
          }
        }
      }
    }

    const { data: classData, error } = await supabase
      .from("classes")
      .update({
        subject_name: updateData.subject_name,
        subject_id: updateData.subject_id || null,
        academic_year: updateData.academic_year,
        room_number: updateData.room_number || null,
        day_of_week: updateData.day_of_week || null,
        start_time: updateData.start_time || null,
        end_time: updateData.end_time || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating class:", error);
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
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
