// Task 3b — Cached leaderboard proxy (Vercel Edge Function).
//
// The browser used to read the `ratings` table straight from supabase.co on every
// load. This thin proxy fetches it server-side and stamps a CDN cache header, so a
// burst of visitors (or a bot flood) collapses to one DB read per `s-maxage`
// window instead of one per request — and the read endpoint no longer hits
// supabase.co directly from the client.
//
// READ-ONLY. Writes still go through cast_vote/log_event from the client; the
// write contract and RLS are untouched. `ratings` is public-readable under RLS,
// so the anon key is sufficient here.
//
// Requires SERVER-side env vars in Vercel (NOT prefixed VITE_, so they stay off
// the client): SUPABASE_URL, SUPABASE_ANON_KEY (same values as the VITE_ ones).

export const config = { runtime: "edge" };

export default async function handler() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "backend not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const upstream = await fetch(
    `${url}/rest/v1/ratings?select=media_id,elo,wins,losses`,
    { headers: { apikey: key, authorization: `Bearer ${key}` } }
  );

  const body = await upstream.text(); // pass PostgREST's JSON array through verbatim
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
