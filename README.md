# Simify Asset Library

A team website to browse, download, and AI-generate Simify's icons, graphics and images.

## Quick start

1. **See the concept:** open `prototype/index.html` in any browser — working demo of the UI and the generation flow.
2. **Read the plan:** `docs/PLAN.md`.
3. **Build with Claude Code:** open this folder in Claude Code. It reads `CLAUDE.md` automatically for full context, then start with Phase 1 (the core library in `web/`).

## Structure

| Path | What |
|---|---|
| `CLAUDE.md` | Project context for Claude Code — read first |
| `docs/PLAN.md` | Full build plan and phases |
| `docs/build-guide.md` | Longer rationale and guidance |
| `prototype/index.html` | Working UI demo (source of truth for design) |
| `reference-svgs/` | Drop existing Simify SVGs here (style reference set) |
| `web/` | The Next.js app (built here) |
| `n8n/` | The AI generation workflow |

## The shape

UI on Vercel · files & data in Supabase · n8n as the generation engine · models called by n8n. No logins — one shared site password. Icons generated as SVG by an LLM; graphics/images by an image model. Everything reviewed before going public.
