import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// Approves a needs-review asset → publishes it into the library.
export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 500 });
  }
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) {
    return NextResponse.json({ ok: false, error: "No asset id provided." }, { status: 400 });
  }
  const { error } = await sb.from("assets").update({ status: "published" }).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
