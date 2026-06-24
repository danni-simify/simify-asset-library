# Simify Asset Library — project context for Claude Code

You are helping build the **Simify Asset Library**: a team-usable website to browse, download, and AI-generate every Simify icon, graphic and image. Read this file fully before starting, then read `docs/PLAN.md` for the detailed spec.

## What we're building

A web app where the Simify team finds and pulls brand assets, and generates new ones on demand. The team seeds it once by uploading existing SVGs; from then on, new assets are AI-generated through a "builder" and reviewed before going public. Figma stays the design source — this is the distribution + generation layer.

## Core decisions (do not re-litigate these)

- **Own website**, not a SaaS DAM.
- **No per-user logins.** Access is gated by a single shared site-level password (set in Vercel). No accounts, no user management.
- **Upload SVGs once to seed**; everything after is AI-generated via the builder. No manual icon drawing.
- **n8n is the generation engine, NOT the website host.** The site calls n8n via webhook.
- **Icons are generated as SVG code by an LLM** (clean, editable, on-brand vectors) — NOT raster→vectorise. **Graphics & images use an image model** (gpt-image-1 or Imagen), passing reference assets for style.
- Generated assets land in a **"needs review"** state before becoming public.

## Architecture

- **UI / gallery:** Next.js (App Router) deployed on Vercel. Browse, search, filter by type (icon/graphic/image), filter by tag, download, and the builder form.
- **Files:** Supabase Storage (or Cloudflare R2).
- **Data:** Supabase Postgres — see data model in `docs/PLAN.md`.
- **Generation engine:** n8n (self-hosted Docker or n8n Cloud). Webhook-triggered workflow that pulls the style spec + reference SVGs, calls the right model by type, saves results to Supabase, returns to the UI.

## Data model

```
asset
  id          uuid
  name        text
  type        enum: icon | graphic | image
  tags        text[]
  file_url    text
  format      text            # svg | png | jpg
  width,height int
  uploaded_by text
  created_at  timestamptz
  source      enum: uploaded | generated
  status      enum: published | needs-review
  parent_id   uuid nullable   # if a variant of another asset
```

## Repo layout

- `prototype/index.html` — working standalone UI demo. **This is the source of truth for look & behaviour.** Port its design into the Next.js app. Brand colours are CSS variables at the top.
- `docs/PLAN.md` — full build plan and phases.
- `docs/build-guide.md` — longer-form guidance and rationale.
- `reference-svgs/` — where the team drops existing SVG icons (the style reference set).
- `web/` — the Next.js app (build here).
- `n8n/` — exported n8n workflow JSON + notes for the builder.

## Build order

1. **Core library** (`web/`): scaffold Next.js, port the prototype UI, add shared-password gate, wire Supabase storage + DB, implement upload + browse/search/filter/download.
2. **Seed:** bulk-upload the SVGs from `reference-svgs/` with tags.
3. **Builder** (`n8n/`): build the generation workflow, wire the site's builder form to its webhook, add the review step.
4. **Launch:** deploy to Vercel behind the shared password.

## Conventions

- TypeScript everywhere. Keep secrets in `.env.local` (never commit — already gitignored).
- Keep the UI close to the prototype; don't redesign without reason.
- Icons must stay valid, optimised SVG. Graphics/images as PNG.
- Before building each phase, confirm the approach in `docs/PLAN.md`.

## Open items the user still needs to provide

- Exact brand tokens (hex colours, fonts).
- Supabase vs Cloudflare R2 for storage.
- Which image model for graphics (gpt-image-1 vs Imagen).
- Who owns the "needs review" approval step.
