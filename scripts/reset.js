// scripts/reset.js — return the database to a pristine launch state:
// delete ALL votes and reset EVERY rating to ELO 1000 / 0W / 0L.
//
// LOCAL ONLY, uses the admin key. Destructive, so it refuses to run without
// an explicit --yes flag.
//
//   node scripts/reset.js --yes

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

if (!process.argv.includes("--yes")) {
  console.error("Refusing to wipe votes + reset ELO without --yes. Run: node scripts/reset.js --yes");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { count: votesBefore } = await supabase.from("votes").select("*", { count: "exact", head: true });
console.log(`votes before: ${votesBefore}`);

const { error: dErr } = await supabase.from("votes").delete().not("id", "is", null);
if (dErr) { console.error("✗ delete votes failed:", dErr.message); process.exit(1); }

const { error: eErr } = await supabase.from("events").delete().not("id", "is", null);
if (eErr) { console.error("✗ delete events failed:", eErr.message); process.exit(1); }

const { error: uErr } = await supabase.from("ratings").update({ elo: 1000, wins: 0, losses: 0 }).not("media_id", "is", null);
if (uErr) { console.error("✗ reset ratings failed:", uErr.message); process.exit(1); }

const { count: votesAfter } = await supabase.from("votes").select("*", { count: "exact", head: true });
const { count: eventsAfter } = await supabase.from("events").select("*", { count: "exact", head: true });
const { data: sample } = await supabase.from("ratings").select("media_id, elo, wins, losses").neq("elo", 1000).limit(5);
console.log(`✓ Reset done. votes: ${votesAfter}, events: ${eventsAfter}, ratings not at 1000: ${sample ? sample.length : 0}.`);
