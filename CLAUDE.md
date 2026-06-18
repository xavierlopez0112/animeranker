# AnimeRanker — project context for Claude Code

A head-to-head anime ranking web toy. Fans vote "which is better?", which feeds a
global ELO leaderboard; they can also build a personal tier list or play "Era War"
(Old Gen vs New Gen). Built as a single React component for now; the first job is to
split it into modules (see Next steps).

## Stack
- React 18 + Vite. No Tailwind (all styling is inline `style` objects + one `CSS`
  string of class rules inside `src/AnimeRanker.jsx`).
- Data: AniList GraphQL (`https://graphql.anilist.co`), top ~100 anime by popularity,
  with a baked-in tagged fallback list if the fetch is blocked.
- Persistence (current): a `storage` wrapper that uses `window.storage` when present
  (the Claude artifact KV store) and falls back to in-memory. This is a placeholder —
  see Next steps for the real backend.

## How it works (data flow)
1. `fetchAnime()` pulls AniList media -> `normLive()` maps each to a unified shape:
   `{ id, title, image, genres[], demo, year, era }`. The fallback list is pre-tagged
   with the same shape.
2. Categories (`CATEGORIES` + `inCategory`) filter that list. Era split is `year < 2013`
   = old gen, else new gen (the Attack on Titan line).
3. **ELO** (`lib`: `expected`, K=32 global / K=44 local). The global board is a
   `slug(title) -> {elo,w,l}` map persisted under `anime-elo-v3`.
4. **Vote** updates the global board. **Tier Quiz** seeds each title's personal score
   from the global ELO, runs a bounded number of comparisons (coverage pass, then
   Swiss-style neighbor matchups), and slices the result into tiers via `assignTiers`
   (fixed proportion bands). Every quiz pick ALSO updates the global board.
5. **Era War** pits one old-gen vs one new-gen title per round, tracks a personal
   new/old split, and updates a shared global tally under `anime-era-v1`.

## File map
- `src/AnimeRanker.jsx` — the whole app (monolith, ~530 lines). Sections are commented.
- `src/main.jsx`, `src/index.css` — entry + minimal global CSS.
- `.claude/skills/animeranker-ui/SKILL.md` — the design system. Follow it for ALL UI work.

## Next steps (good first tasks, roughly in order)
1. **Split the monolith.** Break `AnimeRanker.jsx` into:
   `data/anilist.js`, `data/fallback.js`, `data/categories.js`;
   `lib/elo.js`, `lib/tiers.js`, `lib/storage.js`, `lib/slug.js`, `lib/quiz.js`;
   `components/Cover|Vote|Leaderboard|TierList|Quiz|EraWar|ChipBar.jsx`.
   Keep behavior identical; verify `npm run build` passes after.
2. **Share card.** Render the finished tier list and the Era War verdict to a canvas ->
   downloadable PNG, branded with the site URL. This is the growth feature — make it
   genuinely good-looking. Add OG/Twitter meta + a preview image in `index.html`.
3. **Real backend.** Replace the `storage` wrapper with Supabase (Postgres): `media`,
   `votes`, and a server-side ELO update so the global board can't be spammed. Add
   rate limiting on votes. Keep the quiz logic client-side.
4. **Analytics.** Log unique users, votes, quiz completion rate, shares, referrer from
   day one (PostHog or Plausible) — these are the metrics worth citing later.

## Conventions
- Read `.claude/skills/animeranker-ui/SKILL.md` before touching any UI.
- No `localStorage`/`sessionStorage`. Use the storage wrapper / the eventual backend.
- Display AniList cover art freely; never put copyrighted art on commercial merch.
- Run `npm run build` to typecheck/compile before considering a change done.
