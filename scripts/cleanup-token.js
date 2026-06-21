// scripts/cleanup-token.js — delete all events + votes for one visitor token.
// Useful for removing local test-session noise from the shared analytics
// without touching real users' data.
//
//   node scripts/cleanup-token.js <token>

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const token = process.argv[2];
if (!token) { console.error("Usage: node scripts/cleanup-token.js <token>"); process.exit(1); }

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { count: ev } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("session_token", token);
const { count: vt } = await supabase.from("votes").select("*", { count: "exact", head: true }).eq("voter_token", token);
await supabase.from("events").delete().eq("session_token", token);
await supabase.from("votes").delete().eq("voter_token", token);
console.log(`Removed ${ev || 0} events and ${vt || 0} votes for token ${token}.`);
