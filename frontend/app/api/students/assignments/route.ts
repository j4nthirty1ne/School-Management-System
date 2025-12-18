import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabaseAuth = await createServerClient();
    const maybe = await (supabaseAuth as any).auth.getUser();
    const currentUser = maybe?.data?.user || maybe?.user || null;
    if (!currentUser)
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );

    // Use admin client to bypass RLS for assignments table
    const supabase = createAdminClient();

    const { data: student } = await supabase
      .from("students")
      .select("id, class_id")
      .eq("user_id", currentUser.id)
      .single();

    if (!student) return NextResponse.json({ success: true, assignments: [] });

    // Get all enrolled classes for this student
    const { data: enrollments } = await supabase
      .from("student_class_enrollments")
      .select("class_id")
      .eq("student_id", student.id)
      .eq("status", "active");

    const classIds = enrollments?.map((e) => e.class_id) || [];

    // Include legacy class_id if present
    if (student.class_id && !classIds.includes(student.class_id)) {
      classIds.push(student.class_id);
    }

    console.log("Student enrolled class IDs:", classIds);

    if (classIds.length === 0) {
      return NextResponse.json({ success: true, assignments: [] });
    }

    // First, let's check if there are ANY assignments in the table
    const { data: allAssignments, error: allError } = await supabase
      .from("assignments")
      .select("id, class_id, title");

    console.log("Total assignments in database:", allAssignments?.length || 0);
    console.log("Query error for all assignments:", allError);
    if (allAssignments && allAssignments.length > 0) {
      console.log("Sample from all assignments:", allAssignments.slice(0, 2));
    }

    // Fetch assignments for all enrolled classes - removing status filter
    const { data: assignments, error } = await supabase
      .from("assignments")
      .select("*")
      .in("class_id", classIds)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Assignments query error:", error);
      throw error;
    }

    console.log(
      "Found assignments for enrolled classes:",
      assignments?.length || 0
    );
    if (assignments && assignments.length > 0) {
      console.log("Sample assignment:", assignments[0]);
    }

    // Fetch all class details for the assignments
    const uniqueClassIds = [
      ...new Set(assignments?.map((a) => a.class_id) || []),
    ];
    const { data: classes } = await supabase
      .from("classes")
      .select("id, subject_name, subject_code, room_number")
      .in("id", uniqueClassIds);

    console.log("Found classes:", classes?.length || 0);

    // Create a map of class details
    const classMap = new Map();
    classes?.forEach((cls) => {
      classMap.set(cls.id, cls);
    });

    // Transform to include class information
    const transformedAssignments = (assignments || []).map(
      (assignment: any) => {
        const classInfo = classMap.get(assignment.class_id);
        return {
          ...assignment,
          class_name: classInfo?.subject_name || "Unknown Class",
          class_code: classInfo?.subject_code || "",
        };
      }
    );

    return NextResponse.json({
      success: true,
      assignments: transformedAssignments,
    });
  } catch (err: any) {
    console.error("Assignments fetch error:", err);
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
