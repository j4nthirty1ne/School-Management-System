import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../../lib/supabase/server";
import { supabaseAdmin } from "@/lib/backend/config/supabase";
import { registerUser } from "@/lib/backend/services/authService";
import type { Database } from "../../../lib/supabase/types";
import { requireAuth } from "../../../lib/supabase/auth";
import type { User } from "@supabase/supabase-js";
import { createInvite } from "@/lib/backend/temp/tempInviteStore";

export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerClient();

    // ensure requester is logged in
    let currentUser: any = null;
    try {
      const maybe = await (serverSupabase as any).auth.getUser();
      currentUser = maybe?.data?.user || maybe?.user || null;
    } catch {
      try {
        const maybe2 = await (serverSupabase as any).auth.getSession();
        currentUser = maybe2?.data?.session?.user || null;
      } catch {
        currentUser = null;
      }
    }

    if (!currentUser)
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );

    // verify role
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
    if (!role || !body?.email)
      return new NextResponse(
        JSON.stringify({ success: false, error: "role and email required" }),
        { status: 400 }
      );

    // create auth user with a generated password (not returned)
    const tempPassword = generateTemporaryPassword();

    const reg = await registerUser({
      email: body.email,
      password: tempPassword,
      firstName: body.firstName || "",
      lastName: body.lastName || "",
      phone: body.phone,
      role,
    } as any);

    if (!reg.success || !reg.user) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: reg.error || "Failed to create user",
        }),
        { status: 400 }
      );
    }

    const inviteToken = createInvite(reg.user.id, { role });

    // Placeholder: print the invite link to server console for admin to copy/send.
    const inviteUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/onboard?token=${inviteToken}`;
    console.log("Invite URL (placeholder):", inviteUrl);

    // create role-specific records where appropriate
    if (role === "admin") {
      await supabaseAdmin
        .from("admins")
        .insert({ user_id: reg.user.id, department: body.department || null });
    }

    if (role === "parent") {
      await supabaseAdmin
        .from("parents")
        .insert({
          user_id: reg.user.id,
          occupation: body.occupation || null,
          address: body.address || null,
        });
    }

    if (role === "student") {
      // For students created by admin, the caller should provide student details.
      await supabaseAdmin
        .from("students")
        .insert({
          user_id: reg.user.id,
          student_code: body.studentCode || null,
          enrollment_status: "pending",
        });
    }

    if (role === "teacher") {
      await supabaseAdmin
        .from("teachers")
        .insert({
          user_id: reg.user.id,
          teacher_code: body.teacherCode || null,
          status: "active",
        });
    }

    return new NextResponse(
      JSON.stringify({ success: true, userId: reg.user.id, inviteUrl }),
      { status: 200 }
    );
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ success: false, error: err?.message || String(err) }),
      { status: 500 }
    );
  }
}

function generateTemporaryPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
