import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, ASSETS_BUCKET, storagePathFromUrl } from "@/lib/supabase";

export const runtime = "nodejs";

// Deletes one or many assets: removes the storage files (for Supabase-hosted
// ones) and the table rows. Repo-served seed icons have no storage object, so
// only their row is removed.
export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, error: "Storage is not configured." },
      { status: 500 }
    );
  }

  const { ids } = (await req.json().catch(() => ({}))) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ ok: false, error: "No asset ids provided." }, { status: 400 });
  }

  const { data: rows, error: selErr } = await sb
    .from("assets")
    .select("id, file_url")
    .in("id", ids);
  if (selErr) {
    return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });
  }

  const paths = (rows ?? [])
    .map((r) => storagePathFromUrl(r.file_url as string))
    .filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    await sb.storage.from(ASSETS_BUCKET).remove(paths);
  }

  const { error: delErr } = await sb.from("assets").delete().in("id", ids);
  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: ids.length });
}
