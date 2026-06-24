import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";
import { detectSvgShape } from "@/lib/shape";

export const runtime = "nodejs";
export const maxDuration = 60;

// Scans graphics/images, asks Claude (by filename) which are country flags,
// then re-files each as a "flag" — naming it by country and auto-detecting
// rectangle vs circular from the SVG.
export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 500 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY is missing." }, { status: 500 });
  }

  const { data: rows } = await sb
    .from("assets")
    .select("id, name, file_url, format, tags")
    .in("type", ["graphic", "image"]);

  const candidates = rows ?? [];
  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, moved: 0, message: "No graphics to sort." });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const list = candidates.map((r) => `${r.id} :: ${r.name}`).join("\n");

  let flags: { id: string; country: string }[];
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      system:
        `You identify which assets are national/country flags, based on each asset's name. ` +
        `A name may be a country OR a city/place — resolve cities to their country (e.g. "paris" → France). ` +
        `Only include items that are clearly country flags; ignore logos, icons, photos, and generic graphics.\n\n` +
        `Input is lines of "<id> :: <name>". Respond with ONLY JSON, no prose, no code fences:\n` +
        `{"flags":[{"id":"<id>","country":"<country name>"}]}`,
      messages: [{ role: "user", content: list }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    flags = Array.isArray(parsed.flags) ? parsed.flags : [];
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "AI sort failed." },
      { status: 502 }
    );
  }

  const byId = new Map(candidates.map((r) => [r.id, r]));
  let moved = 0;
  for (const f of flags) {
    const row = byId.get(f.id);
    if (!row) continue;

    // Detect shape from the SVG content (best-effort).
    let shape: "rectangle" | "circular" = "rectangle";
    if ((row.format as string) === "svg") {
      try {
        const url = (row.file_url as string).startsWith("http")
          ? (row.file_url as string)
          : new URL(row.file_url as string, req.nextUrl.origin).toString();
        const svg = await fetch(url).then((r) => (r.ok ? r.text() : ""));
        if (svg.includes("<svg")) shape = detectSvgShape(svg);
      } catch {
        /* keep default */
      }
    }

    const tags = Array.from(new Set([...((row.tags as string[]) ?? []), "flag", shape]));
    const { error } = await sb
      .from("assets")
      .update({ type: "flag", name: f.country || (row.name as string), tags })
      .eq("id", f.id);
    if (!error) moved++;
  }

  return NextResponse.json({ ok: true, moved });
}
