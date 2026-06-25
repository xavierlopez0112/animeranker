// supabase.js — the browser client for the shared backend.
//
// Reads the PUBLIC url + anon key from Vite env (VITE_ vars are bundled into the
// client on purpose; the data is protected by Row Level Security, not by hiding
// the key). If the env vars are missing, `supabase` is null and the app falls
// back to local storage so it still runs.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon
  ? createClient(url, anon, { auth: { persistSession: false } })
  : null;

export const hasBackend = !!supabase;

// A persistent, anonymous per-browser visitor id stored in a first-party cookie
// (~1 year). Survives reloads so analytics counts unique browsers and the vote
// rate limits persist across visits. Not a login; identifies a browser, not a
// person (incognito / cleared cookies / a second device count separately).
function getVisitorId() {
  const rnd = () => (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  if (typeof document === "undefined") return rnd();
  const m = document.cookie.match(/(?:^|;\s*)ar_vid=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  const id = rnd();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `ar_vid=${encodeURIComponent(id)}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
  return id;
}
export const voterToken = getVisitorId();

// Fire-and-forget analytics event via the log_event RPC. No-op without a
// backend; failures are swallowed so analytics never disrupt the UI.
//
// DEFERRED (flagged, not active): if event volume grows, add a client-side
// per-type sample gate HERE (drop 1-in-N before the network call, cheaper than
// server-side retention). `session_start` is PERMANENTLY EXEMPT — it's the
// unique-visitor metric and must always be logged in full.
export function logEvent(type, props = {}) {
  if (!hasBackend) return;
  supabase.rpc("log_event", {
    p_type: type,
    p_props: props,
    p_referrer: typeof document !== "undefined" ? (document.referrer || null) : null,
    p_path: typeof location !== "undefined" ? location.pathname : null,
    p_token: voterToken,
  }).then(({ error }) => { if (error) console.debug("log_event:", error.message); })
    .catch(() => {});
}
