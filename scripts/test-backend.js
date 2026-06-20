// scripts/test-backend.js — proves the backend is correct and secure.
//
// Acts as a real visitor (uses the PUBLIC/anon key, NOT the admin key) to verify:
//   1. public can read the catalog + scoreboard
//   2. a real vote moves ELO through cast_vote
//   3. a bogus/unknown title is rejected
//   4. a direct table write is blocked (can't fake scores)
//   5. the raw votes log (with tokens) is private
//   6. the Era War summary is readable
// Then it uses the admin key ONLY to clean up its own test data.
//
// Run:  node scripts/test-backend.js

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anon = createClient(url, anonKey, { auth: { persistSession: false } });   // a visitor
const admin = createClient(url, secretKey, { auth: { persistSession: false } }); // cleanup only

const TOKEN = "backend-selftest";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("  ✓", msg); } else { fail++; console.log("  ✗", msg); } };

// pick two real titles
const { data: picks, error: pickErr } = await anon.from("media").select("id, title").limit(2);
if (pickErr || !picks || picks.length < 2) { console.error("Could not read media as anon:", pickErr?.message); process.exit(1); }
const [A, B] = picks;
console.log(`\nUsing: "${A.title}" (winner) vs "${B.title}" (loser)\n`);

const { data: before } = await anon.from("ratings").select("media_id, elo, wins, losses").in("media_id", [A.id, B.id]);
const beforeMap = Object.fromEntries((before || []).map((r) => [r.media_id, r]));

console.log("TEST 1 — public can read catalog + scoreboard");
ok(picks.length === 2 && before && before.length === 2, "anon can read media & ratings");

console.log("TEST 2 — a real vote moves ELO via cast_vote");
const { data: voteRes, error: voteErr } = await anon.rpc("cast_vote", { p_winner: A.id, p_loser: B.id, p_mode: "vote", p_token: TOKEN });
ok(!voteErr, `cast_vote succeeded${voteErr ? " (" + voteErr.message + ")" : ""}`);
const res = Array.isArray(voteRes) ? voteRes[0] : voteRes;
ok(res && res.winner_elo > beforeMap[A.id].elo, `winner ELO up: ${beforeMap[A.id]?.elo} -> ${res?.winner_elo}`);
ok(res && res.loser_elo < beforeMap[B.id].elo, `loser ELO down: ${beforeMap[B.id]?.elo} -> ${res?.loser_elo}`);

console.log("TEST 3 — a bogus/unknown title is rejected");
const { error: bogusErr } = await anon.rpc("cast_vote", { p_winner: "not-a-real-anime-xyz", p_loser: B.id, p_mode: "vote", p_token: TOKEN });
ok(!!bogusErr, bogusErr ? `rejected unknown slug ("${bogusErr.message}")` : "NO ERROR — BAD");

console.log("TEST 4 — a direct table write is blocked (no faking scores)");
await anon.from("ratings").update({ elo: 99999 }).eq("media_id", A.id);
const { data: afterHack } = await anon.from("ratings").select("elo").eq("media_id", A.id).single();
ok(afterHack && afterHack.elo !== 99999, `direct UPDATE did NOT stick (elo is ${afterHack?.elo}, not 99999)`);

console.log("TEST 5 — the raw votes log (tokens) is private");
const { data: rawVotes } = await anon.from("votes").select("*").limit(5);
ok(!rawVotes || rawVotes.length === 0, `anon cannot read votes (got ${rawVotes ? rawVotes.length : 0} rows)`);

console.log("TEST 6 — Era War summary is readable");
const { data: tally, error: tallyErr } = await anon.from("era_tally").select("*").single();
ok(!tallyErr && !!tally, `era_tally readable: new=${tally?.new} old=${tally?.old}`);

// cleanup (admin) so the DB is pristine for launch
console.log("\nCleaning up test data…");
await admin.from("votes").delete().eq("voter_token", TOKEN);
for (const id of [A.id, B.id]) {
  const b = beforeMap[id];
  if (b) await admin.from("ratings").update({ elo: b.elo, wins: b.wins, losses: b.losses }).eq("media_id", id);
}
console.log("Cleanup done — ratings restored, test votes removed.");

console.log(`\nRESULT: ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
