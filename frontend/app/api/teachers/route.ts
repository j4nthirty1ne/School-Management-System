import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user to verify they're an admin or teacher
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Only allow admin or teacher to view teachers
    if (profile?.role !== "admin" && profile?.role !== "teacher") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Admin or Teacher access required",
        },
        { status: 403 }
      );
    }

    // Fetch all teachers with their user information
    const { data: teachers, error: teachersError } = await supabase
      .from("teachers")
      .select("*")
      .order("created_at", { ascending: false });

    if (teachersError) {
      console.error("Error fetching teachers:", teachersError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch teachers",
          details: teachersError.message,
        },
        { status: 500 }
      );
    }

    // Fetch user profiles for all teachers
    const teacherUserIds =
      teachers?.map((t: any) => t.user_id).filter(Boolean) || [];

    const userProfilesMap: Record<string, any> = {};

    if (teacherUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, phone, email")
        .in("id", teacherUserIds);

      if (!profilesError && profiles) {
        profiles.forEach((profile: any) => {
          userProfilesMap[profile.id] = profile;
        });
      }
    }

    // Transform the data to include user profiles
    const transformedTeachers =
      teachers?.map((teacher: any) => {
        const profile = userProfilesMap[teacher.user_id] || {};
        return {
          id: teacher.id,
          teacher_code: teacher.teacher_code,
          user_id: teacher.user_id,
          subject_specialization: teacher.subject_specialization,
          hire_date: teacher.hire_date,
          status: teacher.status,
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          phone: profile.phone || "",
          email: profile.email || "",
        };
      }) || [];

    return NextResponse.json({
      success: true,
      teachers: transformedTeachers,
    });
  } catch (error) {
    console.error("Error in teachers API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
