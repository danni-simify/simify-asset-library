import { Asset } from "./types";
import { supabaseAdmin } from "./supabase";

// Reads published assets from Supabase. "needs-review" assets (e.g. freshly
// generated variants in Phase 3) stay hidden until approved.
export async function getAssets(): Promise<Asset[]> {
  const sb = supabaseAdmin();
  if (!sb) {
    // Supabase env not configured yet — render an empty (but working) library.
    return [];
  }
  const { data, error } = await sb
    .from("assets")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load assets:", error.message);
    return [];
  }
  return (data ?? []) as Asset[];
}
