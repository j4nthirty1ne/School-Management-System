import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/backend/config/supabase";
import { createClient } from "../../../../lib/supabase/server";
import { getInvite, deleteInvite } from "@/lib/backend/temp/tempInviteStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token;
    const newPassword = body?.password;
    const firstName = body?.firstName;
    const lastName = body?.lastName;

    if (!token || !newPassword)
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "token and password required",
        }),
        { status: 400 }
      );

    const invite = getInvite(token);
    if (!invite)
      return new NextResponse(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 400 }
      );

    const userId = invite.userId;

    // Update supabase user password using admin API (guarded shape)
    try {
      const authAny: any = supabaseAdmin.auth;

      if (
        authAny &&
        authAny.admin &&
        typeof authAny.admin.updateUserById === "function"
      ) {
        await authAny.admin.updateUserById(userId, { password: newPassword });
      } else if (
        authAny &&
        authAny.admin &&
        typeof authAny.admin.updateUser === "function"
      ) {
        await authAny.admin.updateUser(userId, { password: newPassword });
      } else if (typeof authAny.updateUser === "function") {
        await authAny.updateUser({ id: userId, password: newPassword });
      } else {
        throw new Error("Supabase admin updateUser API not available");
      }
    } catch (e: any) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: `Failed to set password: ${e?.message || e}`,
        }),
        { status: 500 }
      );
    }

    // Optionally update profile
    if (firstName || lastName) {
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({
          first_name: firstName || undefined,
          last_name: lastName || undefined,
        })
        .eq("id", userId);

      if (error)
        return new NextResponse(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500 }
        );
    }

    // consume invite
    deleteInvite(token);

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ success: false, error: err?.message || String(err) }),
      { status: 500 }
    );
  }
}
