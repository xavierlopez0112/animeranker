# AnimeRanker — Project Status

_A head-to-head anime ranking web toy. This doc is a self-contained snapshot of the
current state for collaborators/consultants._

## What it is
Fans answer "which is better?" between two anime; those votes feed a **shared global
ELO leaderboard**. Three additional modes build on that. The product goal is
*shareability and contestability* — fast, opinionated choices people want to argue
about and share.

## Live links
- **Production app:** https://animeranker.vercel.app
- **Code:** https://github.com/xavierlopez0112/animeranker (branch `main`)
- **Database:** Supabase (Postgres) — project `jnvfqsusnqueziccnwcq` (keys are not in the repo)

## Stack
- **Frontend:** React 18 + Vite. Styling is inline style objects + one CSS token string
  (no Tailwind). Modular structure: `data/`, `lib/`, `components/`.
- **Data source:** AniList GraphQL API (top ~100 by popularity) + a baked-in offline fallback list.
- **Backend:** Supabase (Postgres) — shared scores, server-side scoring, analytics.
- **Hosting:** Vercel, auto-deploys on every `git push` to `main`.

## Features built

### The four modes
1. **Vote** — endless head-to-head; each pick updates the global ELO. Scoped by category
   (All / Old Gen / New Gen / Shonen / Seinen / Isekai / Fantasy / Action / Romance /
   Slice of Life / Sci-Fi & Mecha / Sports / Dark & Psych).
2. **Leaderboard** — global ranking; toggle between list view and tier view (S→F).
3. **Tier Quiz** — a short, bounded run that builds a *personal* tier list (seeded from
   the global ranking, then sharpened). Personal math is client-side; every pick still
   feeds the global board.
4. **Era War** — Old Gen (pre-2013) vs New Gen matchups with a live global
   "the internet so far" tally.

### Real backend (shared, secure)
- **Tables:** `media` (catalog), `ratings` (current ELO), `votes` (append-only log).
- **Server-side scoring:** all ELO math runs in a Postgres function (`cast_vote`) — the
  browser only sends "who won," never a score, so results can't be faked or spammed.
- **Row Level Security:** the public can read the scoreboard and call the vote function,
  but cannot directly write/delete anything or read the raw vote log.
- **Catalog curation:** AniList's per-season entries (e.g. 6 separate "Attack on Titan"
  seasons) are collapsed into **87 canonical franchises** via a shared `canon.js` module
  used by both the seeder and the frontend (so their slugs always agree).

### Analytics (queryable in SQL)
- An `events` table + `log_event` function track: **unique visitors**, sessions,
  tab/mode usage, quiz starts & completions (→ completion rate), Era War completions,
  and **referrers** (traffic sources). Vote analytics come from the `votes` table.
- Ready-made analysis views: `analytics_overview`, `votes_by_day`, `top_titles`,
  `referrers` — plus a flexible JSON `props` column for custom queries.

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

## Known limitations / decisions made
- **"Unique visitors" = unique browsers**, not unique humans (incognito / cleared
  cookies / a 2nd device count separately). True per-person identity would require login,
  deliberately avoided to keep the no-signup feel.
- **`shares` metric reads 0** until a share feature exists (see roadmap).
- **Rate limiting is per-visitor (cookie/token)** — stops casual spam. IP-level / bot
  protection (Cloudflare Turnstile, Edge Function) is not built; "add if abused."
- **Catalog drift accepted:** the server is the allow-list; brand-new AniList titles
  won't count until re-seeded (a quick periodic chore).

## Roadmap (priority order)
1. **Share card** — render a finished tier list / Era War verdict to a downloadable,
   branded PNG, with OG/Twitter preview meta. **The growth feature**, and what makes the
   `shares` metric come alive. _Biggest remaining item._
2. **Rate-limit hardening** — optional IP/Turnstile layer if abuse appears.
3. **Analytics dashboards** — optional PostHog/Plausible layer for visual charts (raw
   data already exists in Supabase).
4. **True unique users** — only if needed; would require accounts/login.
5. **Catalog/UX polish** — more curation, mobile arena stacking, etc.

## Open questions for a consultant
- Is the **share card** the right next bet for growth, or something else (e.g. a
  "trending this week" view, embeddable results)?
- Worth adding **bot protection** now or waiting for traffic?
- **Visual dashboards** (PostHog) or is SQL analysis enough?
- Any appetite for **accounts** later (enables true unique users, saved tier lists, profiles)?
