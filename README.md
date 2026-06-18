# AnimeRanker

A head-to-head anime ranking toy. Vote "which is better?", climb a global ELO
leaderboard, build a personal tier list, or settle Old Gen vs New Gen in Era War.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. To make a production build:

```bash
npm run build && npm run preview
```

## Using with Claude Code

This repo ships with project context and a design skill so Claude Code picks up
where the prototype left off:

- `CLAUDE.md` — architecture, data flow, and prioritized next tasks.
- `.claude/skills/animeranker-ui/SKILL.md` — the visual design system, loaded
  automatically when you work on UI.

Open the folder in Claude Code and start with task #1 in `CLAUDE.md` (splitting the
monolith into modules), then the share-card and backend tasks.

## Notes

- Data comes from the AniList GraphQL API, with a baked-in fallback list if the
  request is blocked. No API key required.
- Persistence currently uses a lightweight key-value wrapper; see `CLAUDE.md` for the
  planned Supabase backend.
- Cover art is displayed from AniList for ranking only. Do not put copyrighted art on
  any commercial product.
