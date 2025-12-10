import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@ai-sdk/openai";

// Simple scraper
async function fetchCleanText(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  const html = await res.text();

  // Strip script + style tags
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<\/?[^>]+(>|$)/g, " ") // strip HTML
    .replace(/\s+/g, " ")
    .trim();

  return clean;
}

// Chunk text into ~1500-char chunks for embedding
function chunkText(text: string, size = 1500): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { url } = await req.json();

    // Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch + clean website text
    const text = await fetchCleanText(url);

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "Website returned too little content" },
        { status: 400 }
      );
    }

    // Delete old embeddings for this user
    await supabase
      .from("website_brain_embeddings")
      .delete()
      .eq("user_id", user.id);

    // Chunk text
    const chunks = chunkText(text);

    // Embed each chunk
    for (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });

      const vector = embedding.data[0].embedding;

      await supabase.from("website_brain_embeddings").insert({
        user_id: user.id,
        url,
        chunk,
        embedding: vector,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WEBSITE BRAIN ERROR:", error);
    return NextResponse.json({ error: "Failed to sync website" }, { status: 500 });
  }
}
