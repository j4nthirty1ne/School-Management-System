import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 10MB limit",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name || "file").split(".").pop() || "pdf";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const path = `assignments/${timestamp}-${randomStr}.${ext}`;

    const admin = createAdminClient();

    // Try upload, if bucket missing create it and retry
    let uploadResult = await admin.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (
      uploadResult.error &&
      /bucket not found/i.test(uploadResult.error.message)
    ) {
      // Bucket 'avatars' should exist, but if not, create it
      const { error: bucketError } = await admin.storage.createBucket(
        "avatars",
        { public: true }
      );
      if (bucketError && !bucketError.message.includes("already exists")) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create bucket: ${bucketError.message}`,
          },
          { status: 500 }
        );
      }

      // Retry upload
      uploadResult = await admin.storage.from("avatars").upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
    }

    if (uploadResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error.message,
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("avatars").getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: path,
      fileName: file.name,
    });
  } catch (err: any) {
    console.error("Assignment file upload error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
