-- Task — Traffic-source split on public.analytics_overview
--
-- `unique_visitors` counts distinct ar_vid tokens but can't tell *your* test
-- sessions from real outside traffic. This redefines the view to add a
-- referrer-based breakdown so you can see how much traffic is genuinely
-- external vs. you (dev/localhost) vs. direct.
--
-- DATA SAFETY: a view is a saved query, not a table. This reads from `events`
-- and `votes` and changes ZERO rows. Nothing is reset or deleted.
--
-- The first 7 columns are kept byte-for-byte in the same order/type so
-- CREATE OR REPLACE is allowed to just append the new columns. If your editor
-- still errors with "cannot change ... of view column", run the DROP form at
-- the bottom instead (dropping a VIEW deletes no data).
--
-- Apply in the Supabase SQL editor (project isn't wired to the CLI), then run
-- the NOTIFY at the end so PostgREST exposes the new columns to the API.
--
-- Referrer caveat: TikTok / Instagram in-app browsers strip the referrer, so
-- those real visitors land in `direct_visitors`, not `external_visitors`.
-- Treat external_visitors as a LOWER BOUND on real traffic, and watch
-- `voters` + `visitors_7d` trend up after launch as the truest signals.

create or replace view public.analytics_overview as
select
  count(distinct e.session_token)                                  as unique_visitors,
  (select count(*) from public.votes)                             as total_votes,
  count(*) filter (where e.type = 'quiz_start')                    as quiz_starts,
  count(*) filter (where e.type = 'quiz_complete')                 as quiz_completes,
  round(100.0 * count(*) filter (where e.type = 'quiz_complete')
        / nullif(count(*) filter (where e.type = 'quiz_start'), 0), 1)
                                                                    as quiz_completion_pct,
  count(*) filter (where e.type = 'era_complete')                  as era_completions,
  count(*) filter (where e.type = 'share')                         as shares,

  -- ── appended: traffic-source split (per distinct token) ─────────────────
  -- arrived from an outside site (real traffic; undercounts referrer-stripped mobile)
  (select count(*) from (
     select session_token from public.events
     group by session_token
     having bool_or(referrer is not null
            and referrer !~* 'localhost|127\.0\.0\.1|animeranker\.(net|vercel\.app)')
   ) s)                                                            as external_visitors,

  -- no external and no localhost referrer — you OR referrer-stripped real visitors
  (select count(*) from (
     select session_token from public.events
     group by session_token
     having not bool_or(referrer is not null
                 and referrer !~* 'localhost|127\.0\.0\.1|animeranker\.(net|vercel\.app)')
        and not bool_or(referrer ~* 'localhost|127\.0\.0\.1')
   ) s)                                                            as direct_visitors,

  -- came from a localhost referrer — provably your dev machine
  (select count(*) from (
     select session_token from public.events
     group by session_token
     having bool_or(referrer ~* 'localhost|127\.0\.0\.1')
   ) s)                                                            as dev_visitors,

  -- distinct browsers that actually voted (real-engagement signal)
  (select count(distinct voter_token) from public.votes)          as voters,

  -- recency windows — the real "how much traffic am I getting" trend
  count(distinct e.session_token)
    filter (where e.created_at > now() - interval '24 hours')      as visitors_24h,
  count(distinct e.session_token)
    filter (where e.created_at > now() - interval '7 days')        as visitors_7d
from public.events e;

-- Make PostgREST (the REST API peek.js / the app use) expose the new columns:
notify pgrst, 'reload schema';

-- Verify after applying:
--   select * from public.analytics_overview;

-- ── Fallback ONLY if CREATE OR REPLACE errors on column changes ────────────
-- Dropping a view removes the saved query, NOT any data in events/votes.
--   drop view public.analytics_overview;
--   -- then re-run the `create ... view` statement above (without "or replace")
