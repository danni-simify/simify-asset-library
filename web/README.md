# Simify Asset Library — web app

Browse, search, filter, and download every Simify icon, graphic and image, behind one
shared team password. Built with Next.js (App Router) + TypeScript.

This is **Phase 1** of [docs/PLAN.md](../docs/PLAN.md): the core hosted library.
Assets live in this repo (no Supabase yet); the AI "Generate variant" builder is Phase 3.

## Run it locally

```bash
cd web
npm install
cp .env.local.example .env.local   # then set SITE_PASSWORD
npm run dev                          # http://localhost:3000
```

You'll hit the password gate first — type whatever you set as `SITE_PASSWORD`.

## Add / update assets

Assets are files in `public/assets/` plus a metadata manifest at `data/assets.json`.

### No terminal needed (recommended)

1. On GitHub, open `web/public/assets/` → **Add file → Upload files** and drag in your
   assets (**SVG** for icons, **PNG/JPG** for graphics & images). Commit.
2. Vercel rebuilds automatically. The build runs `ingest` for you, so every new file is
   registered (name/type/tags guessed from the filename) and appears in the library.

That's it — no Node, no commands. To rename or re-tag an asset, edit `data/assets.json`
on GitHub directly.

### With a terminal (optional, for local preview)

```bash
npm run ingest   # registers new files in public/assets/ into the manifest
```

> Ingest runs automatically on every Vercel build (it's wired into `npm run build`).
> It preserves any metadata you've edited, and drops entries whose file you've deleted.
> SVGs are guessed as `icon`; PNG/JPG default to `graphic` — change `type` to `image`
> for photographic/lifestyle assets.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel, set **Root Directory** to `web/`.
3. Add the `SITE_PASSWORD` environment variable (and later `N8N_GENERATE_WEBHOOK_URL`).
4. Deploy. Share the URL + password with the team.

## How it's structured

| Path | What |
|---|---|
| `app/page.tsx` | Home — loads the manifest, renders the gallery |
| `components/Gallery.tsx` | Browse / search / filter / tabs / tag chips |
| `components/AssetModal.tsx` | Detail view + download |
| `components/GenerateModal.tsx` | The Phase-3 "Generate variant" form (not yet wired) |
| `app/login/` + `middleware.ts` | The single shared-password gate |
| `lib/assets.ts` | Loads assets. Swap this for a Supabase query later — UI unchanged |
| `data/assets.json` | The asset metadata (the data model from PLAN.md) |
| `public/assets/` | The actual files |
| `scripts/ingest.mjs` | Registers files into the manifest |

## What changes when we add Supabase (optional, later)

Only `lib/assets.ts` (read from DB instead of JSON) and `AddModal.tsx` (real upload form).
The data model, gallery, and password gate stay exactly as they are.
