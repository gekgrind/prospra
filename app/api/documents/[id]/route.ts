import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "prospra-uploads";

function storagePathFromPublicUrl(fileUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = fileUrl.indexOf(marker);
  if (index === -1) return null;
  const path = fileUrl.slice(index + marker.length);
  return path ? decodeURIComponent(path) : null;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing document id" }, { status: 400 });
    }

    const { data: document, error: readError } = await supabase
      .from("documents")
      .select("id, file_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    // Best-effort storage cleanup; the row is the source of truth for the UI.
    const storagePath = storagePathFromPublicUrl(document.file_url ?? "");
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);
      if (storageError) {
        console.error("[DOCUMENT_STORAGE_DELETE_ERROR]", storageError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DOCUMENT_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
