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

// A throwaway, per-session anonymous tag used only for server-side rate limiting.
// Not a login and not persisted (no localStorage per project rules).
export const voterToken = (typeof crypto !== "undefined" && crypto.randomUUID)
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2);

// Fire-and-forget analytics event via the log_event RPC. No-op without a
// backend; failures are swallowed so analytics never disrupt the UI.
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
