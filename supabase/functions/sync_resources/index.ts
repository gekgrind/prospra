// supabase/functions/sync_resources/index.ts

// --- DENO + Supabase imports ---
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OpenAI } from "https://esm.sh/openai@4.57.0";

// --- Settings ---
const MAX_LENGTH = 24000; // protect against row size limit
const SOURCES = [
  "https://www.sba.gov/business-guide",
  "https://www.score.org/resource-library",
  "https://www.ycombinator.com/library",
  "https://www.irs.gov/businesses/small-businesses-self-employed",
];

// --- Tiny helper to hash content ---
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Super simple HTML → text extractor ---
function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Main function ---
serve(async () => {
  console.log("Sync function started!");

  const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

  const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY")!,
  });

  for (const url of SOURCES) {
    try {
      console.log(`Fetching: ${url}`);

      const res = await fetch(url);
      const html = await res.text();
      const text = extractText(html);

      if (!text || text.length < 300) {
        console.log(`Skipping (too short): ${url}`);
        continue;
      }

      // Hash for change detection
      const contentHash = await sha256(text);

      // Check if existing
      const { data: existing } = await supabase
        .from("resource_documents")
        .select("id, content_hash")
        .eq("url", url)
        .maybeSingle();

      if (existing && existing.content_hash === contentHash) {
        console.log(`No changes detected: ${url}`);
        continue;
      }

      console.log(`Content changed — summarizing: ${url}`);

      // Summarize for quick retrieval
      const summary = await openai.chat.completions
        .create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "Summarize this webpage for entrepreneurs. Focus on actionable steps, key rules, and important updates.",
            },
            { role: "user", content: text.substring(0, 15000) },
          ],
          max_tokens: 350,
        })
        .then((r) => r.choices[0].message.content || "No summary.");

      console.log(`Summarizing complete — embedding: ${url}`);

      // Embed summary
      const embedding = await openai.embeddings
        .create({
          model: "text-embedding-3-small",
          input: summary,
        })
        .then((e) => e.data[0].embedding);

      console.log(`Upserting into Supabase: ${url}`);

      // Store it
      const { error: upsertError } = await supabase
        .from("resource_documents")
        .upsert({
          url,
          title: url.replace("https://", "").replace("www.", ""),
          content: text.substring(0, MAX_LENGTH),
          summary,
          embedding,
          content_hash: contentHash,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error("Error upserting:", upsertError);
      } else {
        console.log(`Updated: ${url}`);
      }
    } catch (err) {
      console.error(`Failed to sync ${url}`, err);
    }
  }

  return new Response("OK");
});
