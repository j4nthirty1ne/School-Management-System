import { NextResponse } from "next/server";

import { createClient as createServerClient } from "../../../../lib/supabase/server";
import { supabaseAdmin } from "@/lib/backend/config/supabase";

import { registerUser } from "@/lib/backend/services/authService";
import { registerStudent } from "@/lib/backend/services/studentService";
import { createTeacher } from "@/lib/backend/services/teacherService";

export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerClient();

    // get current user from cookies/session
    let currentUser: any = null;
    try {
      const maybe = await (serverSupabase as any).auth.getUser();
      currentUser = maybe?.data?.user || maybe?.user || null;
    } catch {
      // fallback for older API shape
      try {
        const maybe2 = await (serverSupabase as any).auth.getSession();
        currentUser = maybe2?.data?.session?.user || null;
      } catch {
        currentUser = null;
      }
    }

    if (!currentUser) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // verify admin role using admin client (service role)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profileErr || !profile || profile.role !== "admin") {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403 }
      );
    }

    const body = await req.json();
    const role = body?.role;

    if (!role) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "role is required" }),
        { status: 400 }
      );
    }

    // Delegate to existing backend services
    if (role === "student") {
      const studentPayload = body;
      const result = await registerStudent(studentPayload);
      return new NextResponse(JSON.stringify(result), {
        status: result?.success ? 200 : 400,
      });
    }

    if (role === "teacher") {
      // Register teacher user
      const userPayload = {
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        role: "teacher" as const,
      };

      const reg = await registerUser(userPayload);
      if (!reg.success) {
        return new NextResponse(JSON.stringify(reg), { status: 400 });
      }

      const createdUserId = reg.user?.id;
      if (!createdUserId) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: "User created but id missing",
          }),
          { status: 500 }
        );
      }

      // Generate teacher code automatically
      const year = new Date().getFullYear();
      const { count } = await supabaseAdmin
        .from("teachers")
        .select("*", { count: "exact", head: true })
        .like("teacher_code", `TCH-${year}-%`);

      const teacherNumber = (count || 0) + 1;
      const generatedTeacherCode = `TCH-${year}-${String(
        teacherNumber
      ).padStart(3, "0")}`;

      // Create teacher record with specialization and qualification
      const { data: teacher, error: teacherError } = await supabaseAdmin
        .from("teachers")
        .insert({
          user_id: createdUserId,
          teacher_code: generatedTeacherCode,
          subject_specialization: body.subjectSpecialization || null,
          qualification: body.qualification || null,
          hire_date: body.hireDate || new Date().toISOString().split("T")[0],
          status: "active",
        })
        .select()
        .single();

      if (teacherError) {
        return new NextResponse(
          JSON.stringify({ success: false, error: teacherError.message }),
          { status: 400 }
        );
      }

      return new NextResponse(JSON.stringify({ success: true, teacher }), {
        status: 200,
      });
    }

    if (role === "admin" || role === "parent") {
      const userPayload = {
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        role,
      };

      const reg = await registerUser(userPayload);
      if (!reg.success) {
        return new NextResponse(JSON.stringify(reg), { status: 400 });
      }

      const createdUserId = reg.user?.id;
      if (!createdUserId) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: "User created but id missing",
          }),
          { status: 500 }
        );
      }

      // create role-specific record
      if (role === "admin") {
        const { data, error } = await supabaseAdmin
          .from("admins")
          .insert({
            user_id: createdUserId,
            department: body.department || null,
          })
          .select()
          .single();

        if (error)
          return new NextResponse(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400 }
          );

        return new NextResponse(
          JSON.stringify({ success: true, admin: data }),
          { status: 200 }
        );
      }

      if (role === "parent") {
        const { data, error } = await supabaseAdmin
          .from("parents")
          .insert({
            user_id: createdUserId,
            occupation: body.occupation || null,
            address: body.address || null,
          })
          .select()
          .single();

        if (error)
          return new NextResponse(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400 }
          );

        return new NextResponse(
          JSON.stringify({ success: true, parent: data }),
          { status: 200 }
        );
      }
    }

    return new NextResponse(
      JSON.stringify({ success: false, error: "Unsupported role" }),
      { status: 400 }
    );
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ success: false, error: err?.message || String(err) }),
      { status: 500 }
    );
  }
}
