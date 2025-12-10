import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // file handling requires node runtime

// Hard-lock bucket name now that your RLS policies are correct
const BUCKET = "prospra-uploads";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse incoming multipart form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return new NextResponse("No file provided", { status: 400 });
    }

    const blob = file as File;
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExt = blob.name.split(".").pop() || "dat";

    // Unique filename
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    // Store inside a subfolder for organization
    const filePath = `uploads/${fileName}`;

    // 🔥 Upload to the ONE correct bucket
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: blob.type || "application/octet-stream",
      });

    if (error || !data) {
      console.error("Upload error:", error);
      return new NextResponse(`Upload failed: ${error?.message}`, {
        status: 500,
      });
    }

    // 🔥 Generate a public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

    return NextResponse.json({
      path: data.path,
      url: publicUrl,
    });
  } catch (err) {
    console.error("Upload route error:", err);
    return new NextResponse(
      `Server error: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 }
    );
  }
}
