-- Task 2 — Statement timeouts
--
-- Caps how long any single query can run on the shared free-tier compute, so one
-- slow/abusive query can't hog it. Role-level covers every PostgREST connection
-- (the leaderboard read, cast_vote, log_event); per-function is defense in depth.
--
-- Does NOT touch RLS or the write contract.
--
-- !! CONFIRM THE ARG TYPES FIRST — the ALTER FUNCTION lines below use the
--    signatures inferred from the client code. Run this and adjust if it differs:
--      select proname, pg_get_function_identity_arguments(oid) as args
--      from pg_proc where proname in ('cast_vote','log_event');
--
-- Values: both RPCs are single-row ops (ELO update / one insert), so real p99 is
-- tens of ms — 2s is hugely generous and won't trip legit traffic. There are no
-- logged-in users today (everything is anon), so the authenticated line is
-- future-proofing.

alter role anon          set statement_timeout = '3s';
alter role authenticated set statement_timeout = '5s';

-- per-function, tighter (inferred signatures — verify with the query above)
alter function public.cast_vote(text, text, text, text)        set statement_timeout = '2s';
alter function public.log_event(text, jsonb, text, text, text) set statement_timeout = '2s';

-- Role-GUC changes apply to NEW connections only, and PostgREST pools them.
-- Reload so the limits take effect without a full restart:
notify pgrst, 'reload config';

-- Verify after applying (on a fresh session):
--   select rolname, rolconfig from pg_roles where rolname in ('anon','authenticated');
--   -- as anon, a deliberate slow query should be cancelled:
--   --   select pg_sleep(10);   -> "canceling statement due to statement timeout"
--   -- normal cast_vote / log_event calls still succeed well under the limit.
