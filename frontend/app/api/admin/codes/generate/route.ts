import { NextRequest, NextResponse } from "next/server";
import { generateStudentCodes } from "@/lib/backend/services/studentCodeService";

export async function POST(request: NextRequest) {
  try {
    const { count, adminId } = await request.json();

    if (!count || !adminId) {
      return NextResponse.json(
        {
          success: false,
          error: "Count and adminId are required",
        },
        { status: 400 }
      );
    }

    const result = await generateStudentCodes(count, adminId);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
