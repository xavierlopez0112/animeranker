// scripts/seed.js — one-time, re-runnable catalog seed into Supabase.
//
// Loads .env locally and uses the SERVICE ROLE key (admin, bypasses RLS) to
// populate the `media` catalog and create starting `ratings` rows. Collapses
// per-season / per-arc AniList entries into one canonical franchise (see
// src/lib/canon.js) so e.g. all Attack on Titan seasons become one title.
//
// LOCAL USE ONLY. Never import this from the app, never deploy it.
//
//   node scripts/seed.js --dry-run   # preview the consolidated list, no writes
//   node scripts/seed.js             # apply: upsert catalog + prune removed
//
// Safe to re-run (handles catalog drift): refreshes media metadata, adds
// ratings rows for NEW titles WITHOUT resetting existing ELO, and prunes titles
// no longer in the catalog.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fetchAnime } from "../src/data/anilist.js";
import { FALLBACK } from "../src/data/fallback.js";
import { ERA_CUT } from "../src/data/categories.js";
import { slug } from "../src/lib/slug.js";
import { canonicalTitle, IMAGE_OVERRIDES } from "../src/lib/canon.js";

const DRY = process.argv.includes("--dry-run");

// --- load .env (no extra dependency) ----------------------------------------
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!DRY && (!url || !key || key.includes("PASTE_YOUR"))) {
  console.error("✗ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env (did you paste your keys?)");
  process.exit(1);
}

// --- build the catalog from live AniList data, falling back if unreachable ---
let live = [];
try {
  live = await fetchAnime();
  console.log(`Fetched ${live.length} titles from AniList.`);
} catch (e) {
  console.warn("AniList fetch failed, using the offline fallback list only:", e.message);
}

// group raw entries by canonical franchise. First entry seen (live is
// popularity-sorted) is the "flagship" we take cover art/genres from; year/era
// use the EARLIEST season so a franchise keeps its original era.
const groups = new Map();
for (const it of [...(live || []), ...FALLBACK]) {
  const canon = canonicalTitle(it.title);
  const id = slug(canon);
  if (!id) continue;
  let g = groups.get(id);
  if (!g) { g = { id, title: canon, flagship: it, members: [], minYear: it.year ?? null }; groups.set(id, g); }
  g.members.push(it.title);
  if (it.year != null && (g.minYear == null || it.year < g.minYear)) g.minYear = it.year;
}

const media = [...groups.values()].map((g) => ({
  id: g.id,
  anilist_id: /^\d+$/.test(g.flagship.id) ? Number(g.flagship.id) : null,
  title: g.title,
  image: IMAGE_OVERRIDES[g.id] || g.flagship.image || null,
  year: g.minYear,
  era: (g.minYear != null && g.minYear < ERA_CUT) ? "old" : "new",
  demo: g.flagship.demo ?? null,
  genres: g.flagship.genres ?? [],
}));

// --- report what consolidated ----------------------------------------------
const collapsed = [...groups.values()].filter((g) => g.members.length > 1);
console.log(`\nRaw entries: ${[...(live || []), ...FALLBACK].length}  ->  canonical titles: ${media.length}`);
console.log(`${collapsed.length} franchises had multiple entries merged:\n`);
for (const g of collapsed.sort((a, b) => b.members.length - a.members.length)) {
  console.log(`  ${g.title}  (${g.minYear ?? "?"})`);
  for (const m of g.members) if (m !== g.title) console.log(`      ← ${m}`);
}

if (DRY) {
  console.log("\n--- DRY RUN: nothing was written. ---");
  console.log("\nFull canonical list:");
  console.log(media.map((m) => m.title).sort().join("\n"));
} else {
  // --- apply to the database ------------------------------------------------
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log(`\nWriting ${media.length} canonical titles…`);
  const { error: mErr } = await supabase.from("media").upsert(media, { onConflict: "id" });
  if (mErr) { console.error("✗ media upsert failed:", mErr.message); process.exit(1); }

  const ratings = media.map((m) => ({ media_id: m.id }));
  const { error: rErr } = await supabase.from("ratings").upsert(ratings, { onConflict: "media_id", ignoreDuplicates: true });
  if (rErr) { console.error("✗ ratings upsert failed:", rErr.message); process.exit(1); }

  // prune titles that are no longer in the catalog (ratings cascade-delete)
  const keep = new Set(media.map((m) => m.id));
  const { data: existing } = await supabase.from("media").select("id");
  const toDelete = (existing || []).map((r) => r.id).filter((id) => !keep.has(id));
  if (toDelete.length) {
    const { error: dErr } = await supabase.from("media").delete().in("id", toDelete);
    if (dErr) console.warn(`! prune skipped ${toDelete.length} rows (likely have votes):`, dErr.message);
    else console.log(`Pruned ${toDelete.length} old entries.`);
  }

  const { count } = await supabase.from("media").select("*", { count: "exact", head: true });
  console.log(`✓ Done. media now has ${count} rows.`);
}
