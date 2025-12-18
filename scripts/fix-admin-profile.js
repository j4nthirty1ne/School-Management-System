const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Read .env.local file
const envPath = path.join(__dirname, "../frontend/.env.local");
const envContent = fs.readFileSync(envPath, "utf8");

const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminProfile() {
  const userId = "860e3d56-1ae5-4346-a3d6-9b4182949be9";

  console.log("Checking user profile for:", userId);

  // Check if profile exists
  const { data: existing, error: checkError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking profile:", checkError);
    return;
  }

  if (existing) {
    console.log("Existing profile found:", existing);

    // Update to admin if not already
    if (existing.role !== "admin") {
      console.log("Updating role to admin...");
      const { data, error } = await supabase
        .from("user_profiles")
        .update({ role: "admin" })
        .eq("user_id", userId)
        .select();

      if (error) {
        console.error("Error updating profile:", error);
      } else {
        console.log("✅ Profile updated to admin:", data);
      }
    } else {
      console.log("✅ User is already admin");
    }
  } else {
    console.log("No profile found. Creating admin profile...");

    // Get user email from auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.getUserById(userId);

    if (authError) {
      console.error("Error getting user:", authError);
      return;
    }

    console.log("User email:", authData.user.email);

    // Create profile
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: userId,
        email: authData.user.email,
        role: "admin",
        first_name: "Admin",
        last_name: "User",
        phone: "000-000-0000",
      })
      .select();

    if (error) {
      console.error("Error creating profile:", error);
    } else {
      console.log("✅ Admin profile created:", data);
    }
  }
}

fixAdminProfile().catch(console.error);
