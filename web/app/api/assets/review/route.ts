import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lists assets awaiting review (e.g. freshly generated variants).
export async function GET() {
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, assets: [] });

  const { data, error } = await sb
    .from("assets")
    .select("*")
    .eq("status", "needs-review")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, assets: data ?? [] });
}
