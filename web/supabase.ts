import { createClient, SupabaseClient } from "@supabase/supabase-js";

// The Storage bucket that holds uploaded asset files.
export const ASSETS_BUCKET = "assets";

// Server-only admin client. Uses the service-role key, so it must never be
// imported into client components. The whole site is gated by the shared
// password (see middleware.ts), so server-side full access is fine.
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // not configured yet (e.g. local dev w/o env)
  return createClient(url, key, { auth: { persistSession: false } });
}

// Given a Supabase public URL, return the in-bucket path (or null if the URL
// isn't a Supabase storage object — e.g. the repo-served seed icons).
export function storagePathFromUrl(fileUrl: string): string | null {
  const marker = `/storage/v1/object/public/${ASSETS_BUCKET}/`;
  const i = fileUrl.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(fileUrl.slice(i + marker.length));
}
