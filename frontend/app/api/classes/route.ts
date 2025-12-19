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

    let subjectClassesData: any[] = [];
    let error;

    // If admin, get all subject_classes; if teacher, get only their classes
    if (userProfile?.role === "admin") {
      // Admin sees all classes with teacher and subject info
      const result = await supabase
        .from("subject_classes")
        .select(
          `
          id,
          subject_id,
          teacher_id,
          class_id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          class_type,
          section,
          academic_year,
          semester,
          join_code,
          is_active,
          created_at,
          updated_at,
          subjects(id, subject_name, subject_code, description),
          teachers(id, user_id, teacher_code, status, subject_specialization, user_profiles(first_name, last_name)),
          classes(id, class_name, section, grade_level, room_number, capacity)
        `
        )
        .order("created_at", { ascending: false });
      subjectClassesData = result.data || [];
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
        .from("subject_classes")
        .select(
          `
          id,
          subject_id,
          teacher_id,
          class_id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          class_type,
          section,
          academic_year,
          semester,
          join_code,
          is_active,
          created_at,
          updated_at,
          subjects(id, subject_name, subject_code, description),
          teachers(id, user_id, teacher_code, status, subject_specialization, user_profiles(first_name, last_name)),
          classes(id, class_name, section, grade_level, room_number, capacity)
        `
        )
        .eq("teacher_id", teacher.id)
        .order("created_at", { ascending: false });
      subjectClassesData = result.data || [];
      error = result.error;
    }

    if (error) {
      console.error("Error fetching subject_classes:", error);
      return NextResponse.json({
        success: true,
        classes: [],
        count: 0,
      });
    }

    // Transform the data to match the expected format
    const transformedClasses = (subjectClassesData || []).map((sc: any) => {
      const teachers = sc.teachers;
      const userProfiles = teachers?.user_profiles;
      const subject = sc.subjects;
      const classInfo = sc.classes;

      const teacherName =
        userProfiles && userProfiles.first_name
          ? `${userProfiles.first_name} ${userProfiles.last_name || ""}`.trim()
          : null;

      const subjectName = subject?.subject_name || "Unknown Subject";
      const className = classInfo?.class_name || "Unknown Class";

      console.log(
        `📋 Processing class: ${subjectName} - ${className} ${
          sc.section
        }, teacher: ${teacherName || "Not assigned"}`
      );

      return {
        id: sc.id,
        subject_id: sc.subject_id,
        teacher_id: sc.teacher_id,
        class_id: sc.class_id,
        subject_name: subjectName,
        subject_code: subject?.subject_code || "",
        class_name: className,
        section: sc.section,
        academic_year: sc.academic_year,
        semester: sc.semester,
        room_number: sc.room_number,
        day_of_week: sc.day_of_week,
        start_time: sc.start_time,
        end_time: sc.end_time,
        class_type: sc.class_type,
        join_code: sc.join_code,
        is_active: sc.is_active,
        teacher_name: teacherName || "Not assigned",
        created_at: sc.created_at,
        updated_at: sc.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      classes: transformedClasses,
      count: transformedClasses.length,
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

    // Generate a unique 6-character join code
    const generateJoinCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const joinCode = generateJoinCode();

    console.log("Creating subject_class with:", {
      subject_id: body.subject_id,
      teacher_id: teacherId,
      class_id: body.class_id || null,
      section: body.section,
      room_number: body.room_number,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
    });

    // Check for room conflict (same room, same day, overlapping time)
    if (
      body.room_number &&
      body.day_of_week &&
      body.start_time &&
      body.end_time
    ) {
      const { data: existingClasses } = await supabase
        .from("subject_classes")
        .select(
          "id, subject_id, day_of_week, start_time, end_time, room_number, subjects(subject_name)"
        )
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
            const subjectName =
              (existing.subjects as any)?.subject_name || "Unknown";
            return NextResponse.json(
              {
                success: false,
                error: `Room ${body.room_number} is already booked on ${body.day_of_week} from ${existingStart} to ${existingEnd} for ${subjectName}`,
              },
              { status: 409 }
            );
          }
        }
      }
    }

    const { data: subjectClassData, error } = await supabase
      .from("subject_classes")
      .insert({
        subject_id: body.subject_id,
        teacher_id: teacherId,
        class_id: body.class_id || null,
        section: body.section || "",
        room_number: body.room_number || null,
        day_of_week: body.day_of_week || null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        class_type: body.class_type || "lecture",
        academic_year:
          body.academic_year || new Date().getFullYear().toString(),
        semester: body.semester || null,
        join_code: joinCode,
        is_active: body.is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subject_class:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Subject class created successfully:", subjectClassData);

    return NextResponse.json({
      success: true,
      class: subjectClassData,
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
        { success: false, error: "Subject class ID is required" },
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

      // Verify the subject_class belongs to this teacher
      const { data: existingClass } = await supabase
        .from("subject_classes")
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
        .from("subject_classes")
        .select(
          "id, subject_id, day_of_week, start_time, end_time, room_number, subjects(subject_name)"
        )
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
            const subjectName =
              (existing.subjects as any)?.subject_name || "Unknown";
            return NextResponse.json(
              {
                success: false,
                error: `Room ${updateData.room_number} is already booked on ${updateData.day_of_week} from ${existingStart} to ${existingEnd} for ${subjectName}`,
              },
              { status: 409 }
            );
          }
        }
      }
    }

    // Build update object only with provided fields
    const updateFields: Record<string, any> = {};
    if (updateData.subject_id !== undefined)
      updateFields.subject_id = updateData.subject_id;
    if (updateData.section !== undefined)
      updateFields.section = updateData.section;
    if (updateData.room_number !== undefined)
      updateFields.room_number = updateData.room_number || null;
    if (updateData.day_of_week !== undefined)
      updateFields.day_of_week = updateData.day_of_week || null;
    if (updateData.start_time !== undefined)
      updateFields.start_time = updateData.start_time || null;
    if (updateData.end_time !== undefined)
      updateFields.end_time = updateData.end_time || null;
    if (updateData.class_type !== undefined)
      updateFields.class_type = updateData.class_type;
    if (updateData.academic_year !== undefined)
      updateFields.academic_year = updateData.academic_year;
    if (updateData.semester !== undefined)
      updateFields.semester = updateData.semester || null;
    if (updateData.is_active !== undefined)
      updateFields.is_active = updateData.is_active;
    if (updateData.class_id !== undefined)
      updateFields.class_id = updateData.class_id || null;

    const { data: subjectClassData, error } = await supabase
      .from("subject_classes")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subject_class:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: subjectClassData,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
