import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/backend/config/supabase";

export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      dateOfBirth,
      gender,
      studentCode,
      address,
      emergencyContactName,
      emergencyContactPhone,
      teacherCode,
      subjectSpecialization,
      qualification,
      hireDate,
      department,
    } = await request.json();

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: email, password, firstName, lastName, role",
        },
        { status: 400 }
      );
    }

    // Restrict public registration
    // Public endpoint must NOT allow creation of admin/teacher/parent accounts.
    // Admins should use the admin-only endpoints. Students should use the
    // secure claim flow (POST /api/auth/claim-student) which requires a
    // pre-issued studentCode. We'll validate the studentCode here and
    // instruct the client to call the claim endpoint.

    if (role !== "student") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Public registration is restricted. Only students may self-register via the claim flow. For admin/teacher/parent accounts, use the admin-only endpoints.",
        },
        { status: 403 }
      );
    }

    // For students we require a studentCode and basic fields. Do not create
    // role records here — guide the client to the secure claim route which
    // will perform account claiming against a pre-created student record.
    if (!studentCode || !dateOfBirth || !gender) {
      return NextResponse.json(
        {
          success: false,
          error: "Students require: studentCode, dateOfBirth, gender",
        },
        { status: 400 }
      );
    }

    // Verify the student code exists and hasn't been used yet
    const supabase = createAdminClient();
    try {
      const { data: codeRow, error: codeErr } = await supabase
        .from("student_codes")
        .select("*")
        .eq("code", studentCode)
        .limit(1)
        .single();

      if (codeErr || !codeRow) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid studentCode or not found. Please contact your administrator.",
          },
          { status: 400 }
        );
      }

      if (codeRow.used) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This studentCode has already been used. If you believe this is an error, contact your administrator.",
          },
          { status: 400 }
        );
      }

      // At this point, instruct the client to complete the secure claim flow.
      return NextResponse.json(
        {
          success: true,
          message:
            "Student code validated. To complete registration provide your desired password and any profile updates to POST /api/auth/claim-student with { studentCode, password, firstName, lastName, ... }",
        },
        { status: 200 }
      );
    } catch (err: any) {
      console.error("Student code validation error:", err);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }

    // NOTE: The old creation flow is intentionally disabled for public
    // registration to enforce admin-driven onboarding. Admins should use
    // the protected admin endpoints which handle role-specific creation and
    // invitation behavior.
    return NextResponse.json(
      {
        success: false,
        error:
          "Public registration flow is disabled for creating accounts. If you are a student, validate your studentCode first (this endpoint returns validation) and then POST to /api/auth/claim-student to set your password and complete onboarding. For other roles ask an administrator to create your account.",
      },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
