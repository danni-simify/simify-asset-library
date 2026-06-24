# Simify Asset Library — web app

Browse, search, filter, **upload** (single or batch), download, **batch-delete**, and
**AI-generate** style-matched icons — behind one shared team password. Built with Next.js
(App Router) + TypeScript, with Supabase for file storage and metadata, and Claude for
icon generation.

## What you need

- A **Supabase** project (free tier) — stores the files and metadata.
- A **Vercel** project (free tier) — hosts the website.
- An **Anthropic API key** (pay-per-use, cents per icon) — powers "Generate variant".

No accounts for end users; the whole site is gated by one shared `SITE_PASSWORD`.

## One-time Supabase setup

1. Create a project at **supabase.com**.
2. **Database:** SQL Editor → New query → paste [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   (Creates the `assets` table and seeds the 6 starter icons.)
3. **Storage:** Storage → New bucket → name it exactly **`assets`** → tick **Public bucket** → Create.
4. **Keys:** Settings → API. Copy the **Project URL** and the **service_role** key — you'll
   paste these into Vercel (and `.env.local` for local dev).

## Deploy on Vercel

1. Import the GitHub repo in Vercel, set **Root Directory** to `web`.
2. Add **Environment Variables**:
   | Name | Value |
   |---|---|
   | `SITE_PASSWORD` | the shared team password |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key (secret) |
   | `ANTHROPIC_API_KEY` | your Anthropic API key (for icon generation) |
3. Deploy. Share the URL + password with the team.

## Using it

- **Add assets:** click **＋ Add assets** → choose one or many files → set type/tags → Upload.
- **Batch delete:** click **☑ Select** → tick assets (or Select all) → **🗑 Delete selected**.
- **Download / single delete / generate variant:** click any asset to open it.
- **Generate an icon:** click **✨ Generate variant** → describe it → Claude writes an on-brand
  SVG. It lands in the **review queue** (it is not public yet).
- **Review queue:** click **✓ Review queue** → **Approve** to publish a generated icon, or
  **Discard** it. Generated assets are hidden from the library until approved.

## Run locally (optional)

```bash
cd web
npm install
cp .env.local.example .env.local   # fill in the 3 values above
npm run dev                          # http://localhost:3000
```

## How it's structured

| Path | What |
|---|---|
| `app/page.tsx` | Home — loads assets from Supabase, renders the gallery |
| `components/Gallery.tsx` | Browse / search / filter / batch-select |
| `components/AddModal.tsx` | In-site upload (single + batch) |
| `components/AssetModal.tsx` | Detail view + download + delete |
| `app/api/assets/upload/` | Upload endpoint (writes file + metadata row) |
| `app/api/assets/delete/` | Delete endpoint (removes files + rows) |
| `app/login/` + `middleware.ts` | The single shared-password gate |
| `lib/supabase.ts` | Server-only Supabase admin client |
| `lib/assets.ts` | Reads published assets |
| `supabase/schema.sql` | Table + seed data |
| `public/assets/` | The 6 seed icon files (uploads go to Supabase Storage) |
