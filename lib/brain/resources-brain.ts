// lib/brain/resource-brain.ts

import { createClient } from "@supabase/supabase-js";
import { embed } from "../embeddings";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This uses a plain Supabase client, not the SSR helper.
// It's safe on the server because we're only using the anon key.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getRelevantResources(query: string) {
  try {
    // 1. Turn the user query into an embedding
    const queryEmbedding = await embed(query);

    // 2. Call the Postgres RPC function to search resource_documents
    const { data, error } = await supabase.rpc("match_resource_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.55,
      match_count: 8,
    });

    if (error) {
      console.error("Resource search error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("getRelevantResources failed:", err);
    return [];
  }
}
