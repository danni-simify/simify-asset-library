import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

// Given the user's note + a list of filenames, Claude decides which files to
// keep and which to skip (e.g. "only one flag per country"), and suggests a
// clean display name + tags for each kept file. Returns decisions; the client
// then uploads only the kept files.
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "AI filtering isn't configured (ANTHROPIC_API_KEY missing)." },
      { status: 500 }
    );
  }

  const { note, files } = (await req.json().catch(() => ({}))) as {
    note?: string;
    files?: string[];
  };
  if (!note || !note.trim()) {
    return NextResponse.json({ ok: false, error: "No note provided." }, { status: 400 });
  }
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ ok: false, error: "No files provided." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system =
    `You curate a batch of files before they are uploaded to a brand asset library. ` +
    `Given the user's instruction and a list of filenames, decide which files to KEEP and ` +
    `which to SKIP, and give each KEPT file a clean human display name and helpful lowercase tags. ` +
    `Follow the instruction exactly — e.g. "only one per country" means keep a single file per ` +
    `country and skip the duplicates. Base your reasoning on the filenames.\n` +
    `Filenames may use a CITY or place name instead of the country (e.g. "paris" → France, ` +
    `"tokyo" → Japan, "sydney" → Australia). When the instruction is about countries, resolve ` +
    `each filename to its country, group by that country, keep one file per country, and set the ` +
    `display name to the country (not the city).\n\n` +
    `Respond with ONLY a JSON object of this exact shape — no prose, no code fences:\n` +
    `{"decisions":[{"filename":"<exact original filename>","keep":true,"name":"<display name>","tags":["tag1","tag2"]}]}\n` +
    `Include every input filename exactly once. For skipped files, set "keep":false (name/tags can be empty).`;

  const user = `Instruction: ${note.trim()}\n\nFiles:\n${files.map((f) => `- ${f}`).join("\n")}`;

  let decisions: { filename: string; keep: boolean; name: string; tags: string[] }[];
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as { decisions?: typeof decisions };
    if (!parsed.decisions || !Array.isArray(parsed.decisions)) throw new Error("bad shape");
    decisions = parsed.decisions;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI filtering failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  return NextResponse.json({ ok: true, decisions });
}
