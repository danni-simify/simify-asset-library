# Simify Asset Library — Build & Rollout Guide

A team-usable website to **browse, add, download** every icon, graphic and image — plus **AI-generate new variants** matched to Simify's existing style. Figma stays the design source; this library is where the whole team actually finds and pulls assets.

---

## 1. Recommended stack

You want your own site (not a SaaS DAM), multi-user, with upload + AI generation. The leanest stack that ships fast and needs almost no maintenance:

| Layer | Pick | Why |
|---|---|---|
| Frontend | **Next.js** (React) | Fast, the prototype's UI ports straight in |
| Storage | **Supabase Storage** (or Cloudflare R2) | Holds the actual files; cheap, generous free tier |
| Database | **Supabase Postgres** | Stores metadata: name, type, tags, dimensions, uploader |
| Auth | **Supabase Auth** (Google login restricted to @simify.com) | Team-only access, zero password management |
| AI generation | **Image model API** (OpenAI `gpt-image-1` or Google Imagen) + **vectorizer** for icons | Generates style-matched variants on demand |
| Hosting | **Vercel** | Push to deploy, free tier covers a team this size |

Everything above has a free tier; realistic running cost at your scale is roughly **$0–25/month** plus per-image AI usage (cents per generation).

Why not buy a DAM (Brandfolder, Air, etc.)? Faster to launch and zero code — but you wanted your own site, and a custom build gives you the AI-variant feature off-the-shelf tools don't have, with no per-seat fees as the team grows.

---

## 2. Data model (keep it this simple)

```
asset
  id            uuid
  name          text
  type          enum: icon | graphic | image
  tags          text[]            -- powers search + filtering
  file_url      text              -- Supabase Storage path
  format        text              -- svg | png | jpg
  width,height  int
  uploaded_by   text
  created_at    timestamptz
  source        enum: uploaded | generated   -- track AI vs human
  parent_id     uuid (nullable)   -- if it's a variant of another asset
```

That `parent_id` + `source` pairing lets you see which assets were AI-generated and from what — useful for keeping the library on-brand.

---

## 3. The AI "style-matched variant" pipeline (the important part)

The trick is that the model must **match Simify's style automatically**, not produce generic clip-art. Three inputs every time:

1. **A written style spec** — extracted once from your Figma icons. e.g. *"2px stroke, rounded caps and joins, 48px grid, single brand-teal colour, no fills, generous padding."* Store this as a constant and prepend it to every prompt.
2. **A reference image** — pass an existing asset (or 2–3) as image input so the model has a visual anchor. Both OpenAI and Imagen accept reference images.
3. **The user's request** — "a data-roaming icon," "a coverage-map graphic for Japan," etc.

Then split by type:

- **Icons → must end up as clean SVG.** Generate a PNG, then auto-vectorise (e.g. `vtracer` or `potrace`) and snap to your stroke/colour spec. Raster icons look wrong on a crisp product site, so this step matters.
- **Graphics / images → PNG/JPG is fine.** Generate, show the user 3–4 options, they pick and it saves straight into the library tagged `source: generated`.

Practical guardrail: route generated assets into a **"Needs review" state** so a designer approves before they're public. Keeps the AI fast *and* the library on-brand — exactly the operator→manager shift.

---

## 4. Seeding it from Figma

One-time migration so the library launches full, not empty:

1. In Figma, select your icon/graphic frames → **Export** (SVG for icons, PNG/JPG for the rest).
2. Use the library's **bulk upload**, or run Figma's REST API to pull every component image automatically and POST into Supabase.
3. Tag as you go (travel, connectivity, product, country, etc.) — tags are what make it browsable.

Going forward, keep Figma as the design/edit source and treat the library as the **distribution layer** the whole team pulls from.

---

## 5. Rollout to the team

1. **Validate UX first** — open the prototype (next section), click around, get 2–3 teammates to react. Cheap to change now.
2. **Build the real app** — stand up Supabase + Vercel, port the prototype UI, wire auth to @simify.com.
3. **Seed from Figma** (section 4).
4. **Add AI generation** (section 3) with the review step.
5. **Launch internally** — share the URL, 10-min Loom, pin in Slack. Track what people search for that returns nothing → that's your generation backlog.

A capable dev can stand up sections 1–4 in a few days; AI generation adds 1–2 more.

---

## 6. The prototype (open it now)

`simify-asset-library.html` is a **fully working, self-contained demo** — open it in any browser, no install:

- Browse a seeded set of style-matched Simify icons
- Search, filter by type (Icons / Graphics / Images), filter by tag
- **Add** assets via the button or drag-and-drop (saved in your browser for the demo)
- **Download** any asset
- See the **Generate variant** flow exactly as it'll work in production

Brand colours live in CSS variables at the top of the file (`--brand`, `--accent`, etc.) — drop in Simify's exact hex values and the whole UI updates. Use it to align the team on look and behaviour before anyone writes backend code.

> Note: the prototype stores added assets in the browser (localStorage) and the Generate button is a UI mock — both become real in the production build above.
