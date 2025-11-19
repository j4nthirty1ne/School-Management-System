import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabaseAuth = await createServerClient();
    const maybe = await (supabaseAuth as any).auth.getUser();
    const currentUser = maybe?.data?.user || maybe?.user || null;

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get user email
    const userEmail = currentUser.email;

    // Check if profile exists (user_profiles.id matches auth.users.id)
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (existingProfile) {
      // Update to admin
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ role: "admin" })
        .eq("id", currentUser.id);

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: "Failed to update profile: " + updateError.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Profile updated to admin",
        profile: existingProfile,
      });
    } else {
      // Create new admin profile
      const { data: newProfile, error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          id: currentUser.id,
          email: userEmail,
          role: "admin",
          first_name: "Admin",
          last_name: "User",
          phone: "000-000-0000",
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: "Failed to create profile: " + insertError.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Admin profile created",
        profile: newProfile,
      });
    }
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
