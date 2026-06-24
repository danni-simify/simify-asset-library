#!/usr/bin/env node
// Registers asset files into web/data/assets.json.
//
// Usage:  npm run ingest
//
// Scans web/public/assets/ for files, and for any not already in the manifest,
// adds an entry with a guessed name/type/tags. Existing entries are preserved
// exactly (so hand-edited names/tags survive re-runs). Files removed from the
// folder are dropped from the manifest. Zero dependencies — plain Node.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, basename } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSETS_DIR = join(ROOT, "public", "assets");
const MANIFEST = join(ROOT, "data", "assets.json");

const EXT_FORMAT = { ".svg": "svg", ".png": "png", ".jpg": "jpg", ".jpeg": "jpg" };

function titleCase(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// SVG → icon. PNG/JPG default to "graphic" (edit to "image" in the manifest
// for photographic/lifestyle assets).
function guessType(format) {
  return format === "svg" ? "icon" : "graphic";
}

function guessTags(slug) {
  return slug
    .split(/[-_]+/)
    .map((s) => s.toLowerCase())
    .filter((s) => s.length > 2);
}

// Pull width/height from an SVG's viewBox or width/height attrs. Best-effort.
function svgDimensions(filePath) {
  try {
    const svg = readFileSync(filePath, "utf8");
    const vb = svg.match(/viewBox\s*=\s*["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i);
    if (vb) return { width: Math.round(+vb[1]), height: Math.round(+vb[2]) };
    const w = svg.match(/\bwidth\s*=\s*["']([\d.]+)/i);
    const h = svg.match(/\bheight\s*=\s*["']([\d.]+)/i);
    if (w && h) return { width: Math.round(+w[1]), height: Math.round(+h[1]) };
  } catch {}
  return { width: null, height: null };
}

function nowStamp() {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

if (!existsSync(ASSETS_DIR)) {
  console.error(`No assets folder at ${ASSETS_DIR}. Create it and drop files in.`);
  process.exit(1);
}

const existing = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : [];
const byId = new Map(existing.map((a) => [a.id, a]));

const files = readdirSync(ASSETS_DIR).filter((f) => EXT_FORMAT[extname(f).toLowerCase()]);
const seenIds = new Set();

let added = 0;
for (const file of files) {
  const ext = extname(file).toLowerCase();
  const format = EXT_FORMAT[ext];
  const id = basename(file, extname(file));
  seenIds.add(id);

  if (byId.has(id)) continue; // preserve existing metadata untouched

  const dims = format === "svg" ? svgDimensions(join(ASSETS_DIR, file)) : { width: null, height: null };
  byId.set(id, {
    id,
    name: titleCase(id),
    type: guessType(format),
    tags: guessTags(id),
    file_url: `/assets/${file}`,
    format,
    width: dims.width,
    height: dims.height,
    uploaded_by: "ingest",
    created_at: nowStamp(),
    source: "uploaded",
    status: "published",
    parent_id: null,
  });
  added++;
  console.log(`+ added  ${id} (${format}, type=${guessType(format)})`);
}

// Drop manifest entries whose file no longer exists.
let removed = 0;
for (const id of [...byId.keys()]) {
  if (!seenIds.has(id)) {
    byId.delete(id);
    removed++;
    console.log(`- removed ${id} (file gone)`);
  }
}

// Newest first, like the gallery.
const out = [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
writeFileSync(MANIFEST, JSON.stringify(out, null, 2) + "\n");

console.log(`\nDone. ${added} added, ${removed} removed, ${out.length} total.`);
if (added) console.log("Tip: tidy names/tags in web/data/assets.json, then commit.");
