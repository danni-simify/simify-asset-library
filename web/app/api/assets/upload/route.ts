import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, ASSETS_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

const CONTENT_TYPE: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function svgDimensions(text: string): { width: number | null; height: number | null } {
  const vb = text.match(/viewBox\s*=\s*["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i);
  if (vb) return { width: Math.round(+vb[1]), height: Math.round(+vb[2]) };
  return { width: null, height: null };
}

// Handles single OR batch upload. Field "files" may contain many files; the
// chosen type/tags apply to all of them.
export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, error: "Storage is not configured. Set the Supabase env vars." },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const chosenType = (form.get("type") as string) || ""; // "" = auto by extension
  const tags = ((form.get("tags") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "No files selected." }, { status: 400 });
  }

  const created = [];
  for (const file of files) {
    const ext = extOf(file.name) || "png";
    const format = ext === "jpeg" ? "jpg" : ext;
    const id = crypto.randomUUID();
    const path = `${id}.${format}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await sb.storage
      .from(ASSETS_BUCKET)
      .upload(path, buffer, {
        contentType: CONTENT_TYPE[ext] || file.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) {
      return NextResponse.json(
        { ok: false, error: `Upload failed for ${file.name}: ${upErr.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = sb.storage.from(ASSETS_BUCKET).getPublicUrl(path);

    let width: number | null = null;
    let height: number | null = null;
    if (format === "svg") {
      const dims = svgDimensions(buffer.toString("utf8"));
      width = dims.width;
      height = dims.height;
    }

    const type = chosenType || (format === "svg" ? "icon" : "graphic");
    const name = file.name.replace(/\.[^.]+$/, "");

    const { data, error: insErr } = await sb
      .from("assets")
      .insert({
        id,
        name,
        type,
        tags,
        file_url: publicUrl,
        format,
        width,
        height,
        uploaded_by: "team",
        source: "uploaded",
        status: "published",
        parent_id: null,
      })
      .select()
      .single();

    if (insErr) {
      // Roll back the orphaned file so storage doesn't drift from the table.
      await sb.storage.from(ASSETS_BUCKET).remove([path]);
      return NextResponse.json(
        { ok: false, error: `Saving ${file.name} failed: ${insErr.message}` },
        { status: 500 }
      );
    }
    created.push(data);
  }

  return NextResponse.json({ ok: true, created });
}
