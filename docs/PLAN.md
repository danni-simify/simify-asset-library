# Simify Asset Library — Build Plan

A team-usable website to **browse, download, and AI-generate** every Simify icon, graphic and image. No per-user logins. You seed it by uploading your existing SVGs; from then on, new assets are generated through the builder. Figma stays the design source — this is the distribution + generation layer the whole team uses.

---

## How it works (the model)

1. **You upload your existing SVGs once** — these become the *style reference set* that anchors every future generation.
2. **From then on, no manual drawing.** Anyone on the team opens the site, describes what they need in the builder, and the AI generates it matched to Simify's style.
3. **New assets are reviewed, then land in the library** alongside the originals, fully searchable and downloadable.

---

## Architecture

| Layer | Tool | Role |
|---|---|---|
| **UI / gallery** | Next.js on **Vercel** | Browse, search, filter, download, and the builder form. No login — one shared site password. |
| **Files** | **Supabase Storage** (or Cloudflare R2) | Holds every SVG/PNG. |
| **Data** | **Supabase Postgres** | Asset metadata: name, type, tags, source (uploaded/generated), parent reference. |
| **Generation engine** | **n8n** (self-hosted Docker or n8n Cloud) | The builder. Receives requests from the site, calls the models, saves results back. Editable visually — no frontend changes needed to tweak generation. |
| **Models** | **LLM** (Claude/GPT) for icon SVGs · **image model** (gpt-image-1 / Imagen) for graphics & images | Called *by n8n*, not the frontend. |

**Access:** no logins. One shared site-level password (set in Vercel) keeps the generation pipeline off the open web with zero friction for the team. Public-with-URL is an option if you'd rather, but the shared password is the recommended start.

Rough running cost: **~$0–25/mo** infrastructure + cents per AI generation.

---

## The builder (n8n workflow)

Triggered by the site, routed by asset type:

```
Site request (describe + type)  →  n8n webhook
        │
        ├─ pull style spec + 2–3 reference SVGs from Supabase
        │
        ├─ IF type = ICON
        │     → LLM generates SVG code directly (clean, editable, on-brand vectors)
        │
        └─ IF type = GRAPHIC / IMAGE
              → image model generates PNG using reference assets for style
        │
        →  save file to Supabase + metadata row (source: generated, status: needs-review)
        →  return result to the site
```

**Why icons are generated as SVG code, not images:** image models output PNGs that need vectorising and look slightly off for crisp line icons. Having an LLM write the SVG directly — given your stroke/grid spec and example paths — produces clean, editable, on-brand vectors. Graphics and lifestyle images use the image model as normal.

**Style spec:** extracted once from your uploaded SVGs (e.g. *"2px stroke, rounded caps/joins, 48px grid, single brand-teal, no fills"*) and prepended to every generation so output stays consistent.

**Guardrail:** generated assets land in a **"needs review"** state — a designer approves before they go public. Keeps generation fast *and* the library on-brand.

---

## Build phases

**Phase 0 — Validate (done)**
Open the prototype, confirm the look and flow with the team. Cheap to change now.

**Phase 1 — Core library (a few days for a dev)**
Stand up Supabase + Vercel. Port the prototype UI. Add the shared password. Build upload + browse/search/filter/download.

**Phase 2 — Seed from Figma**
Export your icons (SVG) and graphics (PNG/JPG) from Figma, bulk-upload, tag them. Library launches full, not empty.

**Phase 3 — The builder (1–2 days)**
Stand up n8n. Build the generation workflow above. Wire the site's builder form to the n8n webhook. Add the review step.

**Phase 4 — Launch internally**
Share URL + shared password, post a short Loom in Slack. Track searches that return nothing → that's your generation backlog.

---

## Decisions locked in

- ✅ Own website, not a SaaS DAM
- ✅ No per-user logins (shared site password)
- ✅ Upload SVGs once; everything after is AI-generated via the builder
- ✅ n8n is the generation engine, **not** the website host
- ✅ Icons = LLM-generated SVG · Graphics/images = image model
- ✅ Figma stays the design source; library is the distribution layer

## Still to decide

- Exact brand tokens (hex/fonts) to drop into the UI
- Supabase vs Cloudflare R2 for storage (either is fine)
- Which image model for graphics (gpt-image-1 vs Imagen)
- Who owns the "needs review" approval step
