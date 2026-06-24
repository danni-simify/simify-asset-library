import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin, ASSETS_BUCKET } from "@/lib/supabase";
import { ICON_STYLE_SPEC } from "@/lib/style";

export const runtime = "nodejs";
export const maxDuration = 60;

// Pull a few published icons to use as visual references for the generator.
async function referenceIcons(sb: ReturnType<typeof supabaseAdmin>, origin: string, baseId?: string) {
  if (!sb) return [];
  const { data } = await sb
    .from("assets")
    .select("id, name, file_url, format")
    .eq("type", "icon")
    .eq("status", "published")
    .eq("format", "svg")
    .limit(4);

  const rows = (data ?? [])
    .sort((a, b) => (a.id === baseId ? -1 : b.id === baseId ? 1 : 0))
    .slice(0, 3);
  const refs: { name: string; svg: string }[] = [];
  for (const r of rows) {
    try {
      const url = (r.file_url as string).startsWith("http")
        ? (r.file_url as string)
        : new URL(r.file_url as string, origin).toString();
      const svg = await fetch(url).then((res) => (res.ok ? res.text() : ""));
      if (svg.includes("<svg")) refs.push({ name: r.name as string, svg });
    } catch {
      /* skip unreachable reference */
    }
  }
  return refs;
}

function extractSvg(text: string): string | null {
  const m = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (!m) return null;
  const svg = m[0];
  if (/<script|onload=|onerror=|<foreignObject/i.test(svg)) return null; // basic safety
  return svg;
}

function titleCase(s: string): string {
  return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 500 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "Generation isn't configured yet. Add ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  const { prompt, baseId } = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    baseId?: string;
  };
  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ ok: false, error: "Describe the icon you need." }, { status: 400 });
  }

  const refs = await referenceIcons(sb, req.nextUrl.origin, baseId);
  const referenceBlock = refs.length
    ? "\n\nReference icons — match their visual weight and construction:\n" +
      refs.map((r) => `<!-- ${r.name} -->\n${r.svg}`).join("\n\n")
    : "";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let svg: string | null = null;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      system:
        `You are an icon designer for Simify, an eSIM/travel-connectivity brand.\n${ICON_STYLE_SPEC}` +
        referenceBlock +
        `\n\nRespond with ONLY the raw SVG markup for one icon — start with <svg and end with </svg>. ` +
        `No code fences, no commentary, no <script>, no external images or fonts.`,
      messages: [{ role: "user", content: `Design a Simify icon: ${prompt.trim()}` }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    svg = extractSvg(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  if (!svg) {
    return NextResponse.json(
      { ok: false, error: "The model didn't return a valid icon. Try rephrasing." },
      { status: 502 }
    );
  }

  // Save the generated SVG to storage + a needs-review row.
  const id = crypto.randomUUID();
  const path = `${id}.svg`;
  const { error: upErr } = await sb.storage
    .from(ASSETS_BUCKET)
    .upload(path, Buffer.from(svg, "utf8"), { contentType: "image/svg+xml", upsert: false });
  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }
  const {
    data: { publicUrl },
  } = sb.storage.from(ASSETS_BUCKET).getPublicUrl(path);

  const name = titleCase(prompt.trim().slice(0, 48));
  const { data, error: insErr } = await sb
    .from("assets")
    .insert({
      id,
      name,
      type: "icon",
      tags: ["generated"],
      file_url: publicUrl,
      format: "svg",
      width: 48,
      height: 48,
      uploaded_by: "builder",
      source: "generated",
      status: "needs-review",
      parent_id: baseId ?? null,
    })
    .select()
    .single();
  if (insErr) {
    await sb.storage.from(ASSETS_BUCKET).remove([path]);
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, asset: data });
}
