# AnimeRanker — Project Status

_A head-to-head anime ranking web toy. This doc is a self-contained snapshot of the
current state for collaborators/consultants._

## What it is
Fans answer "which is better?" between two anime; those votes feed a **shared global
ELO leaderboard**. Around that core loop sit a tier-list builder, an Old-vs-New "Era
War," per-title detail pages, and a landing page. The product goal is *shareability and
contestability* — fast, opinionated choices people want to argue about and share.

## Live links
- **Production app:** https://animeranker.vercel.app
- **Code:** https://github.com/xavierlopez0112/animeranker (branch `main`)
- **Database:** Supabase (Postgres) — project `jnvfqsusnqueziccnwcq` (keys are not in the repo)

## Stack
- **Frontend:** React 18 + Vite, **React Router** for pages. Styling is inline style
  objects + one CSS token string (no Tailwind). Modular structure: `data/`, `lib/`, `components/`.
- **Data source:** AniList GraphQL API (top ~200 by popularity + targeted genre top-ups for thin categories) + a baked-in offline fallback list.
- **Backend:** Supabase (Postgres) — shared scores, server-side scoring, analytics.
- **Hosting:** Vercel, auto-deploys on every `git push` to `main`. A `vercel.json` SPA
  rewrite makes deep links (e.g. `/anime/attack-on-titan`) survive a refresh.

## Pages & routing
Real, shareable URLs via React Router:
- `/` — **Landing/home:** hero headline + description, "Start Voting" / "View Rankings"
  CTAs, a `live · N titles` status line, and a **Current Top 5** card (covers + ELO,
  "View All", and X / Reddit / Copy-link share buttons).
- `/vote`, `/leaderboard`, `/quiz`, `/war` — the four modes (below).
- `/anime/:slug` — **per-title detail page** (below).

## Features built

### The four modes
1. **Vote** — endless head-to-head; each pick updates the global ELO. Scoped by category
   (All / Old Gen / New Gen / Shonen / Seinen / Isekai / Fantasy / Action / Romance /
   Slice of Life / Sci-Fi & Mecha / Sports / Dark & Psych).
2. **Leaderboard** — global ranking; toggle between list view and tier view (S→F). Rows
   link to the title's detail page.
3. **Tier Quiz** — a **single "Build my tier list"** button. It seeds *every* title from
   the global ELO and places all of them into an S–F list, while capping the input at
   **~34 head-to-head picks** (bounded — you never compare all ~80 shows). Personal math
   is client-side; every pick still feeds the global board.
4. **Era War** — Old Gen (pre-2013) vs New Gen matchups with a live global
   "the internet so far" tally. Sides are randomized to avoid position bias.

### Anime detail pages (`/anime/:slug`)
- Large cover, **big mono** Rank / ELO / Votes stats, and a "Vote on matchups" CTA.
- **Description + info panel** (right sidebar on desktop, stacks below the stats on
  mobile): a synopsis lazy-fetched from AniList per page (HTML-stripped, clamped, cached,
  graceful fallback) plus Year / Era / Demographic / Genres.
- **Similar Shows:** other titles ranked by most shared genres, then global ELO;
  backfilled by demographic then era so it's never empty. Clickable cards.

### Share cards (growth feature)
- "Share my tier list" (Quiz) and "Share my verdict" (Era War) render branded **portrait
  PNGs** on a canvas (cover thumbnails with CORS-safe loading + gradient fallback).
- Mobile uses the native **Web Share** sheet (→ Discord/iMessage/X); desktop downloads.
  Each generation logs a `share` event.
- **OG / Twitter Card** meta + a static `public/og-image.jpg` so the link unfurls with a
  branded preview when pasted.

### Real backend (shared, secure)
- **Tables:** `media` (catalog), `ratings` (current ELO), `votes` (append-only log),
  `events` (analytics). `era_tally` is a view.
- **Server-side scoring:** all ELO math runs in a Postgres function (`cast_vote`) — the
  browser only sends "who won," never a score, so results can't be faked or spammed.
- **Row Level Security:** the public can read the scoreboard and call the vote/log
  functions, but cannot directly write/delete anything or read the raw vote log.
- **Catalog curation:** AniList's per-season entries (e.g. 6 separate "Attack on Titan"
  seasons) are collapsed into **~159 canonical franchises** via a shared `canon.js` module
  used by both the seeder and the frontend (so their slugs always agree). Targeted genre
  queries fill thin categories (e.g. Sports went from 1 to ~8 titles).

### Analytics (queryable in SQL)
- `events` + `log_event` track: **unique visitors**, sessions, tab/mode usage, quiz
  starts & completions (→ completion rate), Era War completions, **shares**, and
  **referrers**. Vote analytics come from the `votes` table.
- Ready-made views: `analytics_overview`, `votes_by_day`, `top_titles`, `referrers` —
  plus a flexible JSON `props` column for custom queries.

### Unique-visitor tracking
- Persistent first-party cookie (`ar_vid`, ~1yr) gives each browser a stable ID →
  genuine unique-browser counts. Also strengthens rate-limiting (persists across reloads).

### Abuse protection (rate limiting)
- Votes: max **30 / 10 seconds** and **600 / hour** per visitor.
- Analytics: 60 events / 10s, with payload size caps. All enforced server-side.

### Ops / dev tooling (`scripts/`)
- `seed.js` — catalog seed + dedup, re-runnable, `--dry-run` mode.
- `test-backend.js` — security/correctness self-test (8 checks).
- `reset.js` — restore a pristine state (`--yes` guard).
- `peek.js` — CLI analytics snapshot.
- `cleanup-token.js` — remove a single test session's analytics noise.
- `seed-diff.js` — preview a re-seed's added/kept/pruned titles before writing.

## Known limitations / decisions made
- **"Unique visitors" = unique browsers**, not unique humans (incognito / cleared
  cookies / a 2nd device count separately). True per-person identity would require login,
  deliberately avoided to keep the no-signup feel.
- **Per-page OG previews are generic:** because the app is a client-rendered SPA, a pasted
  `/anime/<slug>` link unfurls with the site-wide preview image, not that title's cover.
  Per-title unfurls would need prerendering or a serverless OG function.
- **Rate limiting is per-visitor (cookie/token)** — stops casual spam. IP-level / bot
  protection (Cloudflare Turnstile, Edge Function) is not built; "add if abused."
- **Catalog drift accepted:** the server is the allow-list; brand-new AniList titles
  won't count until re-seeded (a quick periodic chore).

## Roadmap (priority order)
1. **Per-title OG / prerendering** — so shared detail-page links unfurl with that anime's
   cover (closes the gap above; biggest sharing upgrade left).
2. **Rate-limit hardening** — optional IP/Turnstile layer if abuse appears.
3. **Analytics dashboards** — optional PostHog/Plausible layer for visual charts (raw
   data already exists in Supabase).
4. **True unique users** — only if needed; would require accounts/login (also unlocks
   saved tier lists & profiles).
5. **Catalog/UX polish** — more curation, "trending this week" / time-windowed rankings, etc.

## Open questions for a consultant
- What's the next growth bet — **per-title OG previews**, a **"trending this week"** view,
  embeddable results, or something else?
- Worth adding **bot protection** now or waiting for traffic?
- **Visual dashboards** (PostHog) or is SQL analysis enough?
- Any appetite for **accounts** later (enables true unique users, saved tier lists, profiles)?
