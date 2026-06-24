import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin, ASSETS_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

type Shape = "rectangle" | "circular";

function extractSvg(text: string): string | null {
  const m = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (!m) return null;
  const svg = m[0];
  if (/<script|onload=|onerror=|<foreignObject/i.test(svg)) return null;
  return svg;
}

// Pull up to 2 existing flags of the same shape to anchor the visual style.
async function references(sb: ReturnType<typeof supabaseAdmin>, origin: string, shape: Shape) {
  if (!sb) return [];
  const { data } = await sb
    .from("assets")
    .select("name, file_url, format")
    .eq("type", "flag")
    .eq("format", "svg")
    .contains("tags", [shape])
    .limit(2);
  const refs: string[] = [];
  for (const r of data ?? []) {
    try {
      const url = (r.file_url as string).startsWith("http")
        ? (r.file_url as string)
        : new URL(r.file_url as string, origin).toString();
      const svg = await fetch(url).then((res) => (res.ok ? res.text() : ""));
      if (svg.includes("<svg")) refs.push(`<!-- ${r.name} -->\n${svg}`);
    } catch {
      /* skip */
    }
  }
  return refs;
}

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 500 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY is missing." }, { status: 500 });
  }

  const { country, shape } = (await req.json().catch(() => ({}))) as {
    country?: string;
    shape?: Shape;
  };
  if (!country || !country.trim()) {
    return NextResponse.json({ ok: false, error: "No country provided." }, { status: 400 });
  }
  const flagShape: Shape = shape === "circular" ? "circular" : "rectangle";

  const refs = await references(sb, req.nextUrl.origin, flagShape);
  const refBlock = refs.length
    ? `\n\nMatch the construction and visual style of these existing flags:\n${refs.join("\n\n")}`
    : "";

  const geometry =
    flagShape === "circular"
      ? `Output a CIRCULAR flag: viewBox="0 0 48 48", the flag artwork clipped to a centered circle of radius 24 via a <clipPath> with a <circle cx="24" cy="24" r="24"/>.`
      : `Output a RECTANGULAR flag: viewBox="0 0 60 40" (a 3:2 ratio).`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let svg: string | null = null;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 3000,
      system:
        `You draw accurate national flags as clean, valid SVG. Use the correct official colours, ` +
        `proportions, and layout for the requested country. ${geometry} ` +
        `No text labels, no <script>, no external images or fonts.` +
        refBlock +
        `\n\nRespond with ONLY the raw SVG — start with <svg and end with </svg>. No commentary, no code fences.`,
      messages: [{ role: "user", content: `Draw the national flag of ${country.trim()}.` }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    svg = extractSvg(text);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Generation failed." },
      { status: 502 }
    );
  }
  if (!svg) {
    return NextResponse.json({ ok: false, error: `Couldn't generate ${country}.` }, { status: 502 });
  }

  const id = crypto.randomUUID();
  const path = `${id}.svg`;
  const { error: upErr } = await sb.storage
    .from(ASSETS_BUCKET)
    .upload(path, Buffer.from(svg, "utf8"), { contentType: "image/svg+xml", upsert: false });
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  const {
    data: { publicUrl },
  } = sb.storage.from(ASSETS_BUCKET).getPublicUrl(path);

  const { data, error: insErr } = await sb
    .from("assets")
    .insert({
      id,
      name: country.trim(),
      type: "flag",
      tags: ["flag", flagShape, "generated"],
      file_url: publicUrl,
      format: "svg",
      width: flagShape === "circular" ? 48 : 60,
      height: flagShape === "circular" ? 48 : 40,
      uploaded_by: "builder",
      source: "generated",
      status: "needs-review",
      parent_id: null,
    })
    .select()
    .single();
  if (insErr) {
    await sb.storage.from(ASSETS_BUCKET).remove([path]);
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, asset: data });
}
