import { NextResponse } from "next/server";

import { claimStudentRegistration } from "@/lib/backend/services/studentService";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const student_code = body?.student_code || body?.code;
    const password = body?.password;
    const firstName = body?.firstName;
    const lastName = body?.lastName;

    if (!student_code || !password) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "student_code and password are required",
        }),
        { status: 400 }
      );
    }

    const result = await claimStudentRegistration(student_code, password, {
      firstName,
      lastName,
    });

    return new NextResponse(JSON.stringify(result), {
      status: result?.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ success: false, error: err?.message || String(err) }),
      { status: 500 }
    );
  }
}
