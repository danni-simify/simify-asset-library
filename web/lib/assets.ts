import { Asset } from "./types";
import manifest from "@/data/assets.json";

// Single source of truth for what the gallery shows. Today this reads the
// committed manifest (assets-in-repo). To move to Supabase later, swap this
// function for a DB query — callers don't change.
export function getAssets(): Asset[] {
  const all = manifest as Asset[];
  // Only published assets are public. "needs-review" assets (e.g. freshly
  // generated variants) are hidden until approved.
  return all
    .filter((a) => a.status === "published")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
