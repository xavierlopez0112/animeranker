// scripts/seed-diff.js — preview what a re-seed would change, WITHOUT writing.
// Compares the current DB `media` ids against the new canonical id set and shows
// added titles (get a fresh ELO 1000 row), titles that would be pruned, and
// whether any prune target has accumulated votes (which is FK-protected).
//
//   node scripts/seed-diff.js

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fetchAnime } from "../src/data/anilist.js";
import { FALLBACK } from "../src/data/fallback.js";
import { canonicalizeList } from "../src/lib/canon.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let live = [];
try { live = await fetchAnime(); } catch (e) { console.warn("AniList fetch failed:", e.message); }
const next = canonicalizeList([...(live || []), ...FALLBACK]);
const nextIds = new Set(next.map((x) => x.id));

const { data: cur } = await supabase.from("media").select("id");
const curIds = new Set((cur || []).map((r) => r.id));

const added = [...nextIds].filter((id) => !curIds.has(id));
const removed = [...curIds].filter((id) => !nextIds.has(id));

console.log(`current DB titles: ${curIds.size}`);
console.log(`new catalog titles: ${nextIds.size}`);
console.log(`\nNEW (get a fresh ELO 1000 row): ${added.length}`);
console.log(`KEPT (ratings untouched by ignoreDuplicates): ${[...nextIds].filter((id) => curIds.has(id)).length}`);
console.log(`\nWOULD-PRUNE (in DB, not in new catalog): ${removed.length}`);
if (removed.length) {
  const { data: r } = await supabase.from("ratings").select("media_id, elo, wins, losses").in("media_id", removed);
  for (const id of removed) {
    const rec = (r || []).find((x) => x.media_id === id);
    const games = rec ? rec.wins + rec.losses : 0;
    console.log(`  ${id}  — ${games} votes${games > 0 ? "  ⚠ has rating activity (FK-protected from delete)" : ""}`);
  }
}
