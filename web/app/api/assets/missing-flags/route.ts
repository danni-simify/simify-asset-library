import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the countries that don't yet have a flag in the library (matched by
// flag asset name). Includes needs-review flags so we don't re-generate ones
// already queued.
export async function GET() {
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, missing: COUNTRIES });

  const { data } = await sb.from("assets").select("name").eq("type", "flag");
  const have = new Set((data ?? []).map((r) => (r.name as string).trim().toLowerCase()));
  const missing = COUNTRIES.filter((c) => !have.has(c.toLowerCase()));
  return NextResponse.json({ ok: true, missing });
}
