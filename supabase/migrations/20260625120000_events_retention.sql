-- Task 1 — Retention cron for public.events
--
-- Keeps the analytics `events` table from filling the 500MB free-tier database
-- (which would trip Supabase into read-only mode). A daily cron deletes rows
-- older than 90 days; the index keeps that delete cheap as the table grows.
--
-- Does NOT touch RLS or the SECURITY DEFINER write contract — this only prunes
-- old analytics rows. Apply in the Supabase SQL editor (project isn't wired to
-- the Supabase CLI; schema lives in the dashboard).
--
-- Inspected 2026-06-25: table = public.events, timestamp col = created_at
-- (timestamptz). ~30 events/day today, so at 90 days this is a growth guardrail,
-- not a space fix yet.

create extension if not exists pg_cron;

-- make the daily delete index-supported so it stays cheap
create index if not exists idx_events_created_at
  on public.events (created_at);

-- idempotent: clear any prior schedule of the same name before (re)creating
do $$
begin
  perform cron.unschedule('cleanup-old-events');
exception when others then
  null;  -- job didn't exist yet
end $$;

-- daily cleanup at 04:00 UTC, keep 90 days
select cron.schedule(
  'cleanup-old-events',
  '0 4 * * *',
  $$delete from public.events where created_at < now() - interval '90 days'$$
);

-- Verify after applying:
--   select jobname, schedule, command from cron.job where jobname = 'cleanup-old-events';
--   select count(*) from public.events where created_at < now() - interval '90 days';
--   select indexname from pg_indexes where tablename = 'events';
