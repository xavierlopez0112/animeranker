// scripts/peek.js — read-only analytics snapshot from the CLI (admin key).
//
//   node scripts/peek.js

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: overview } = await supabase.from("analytics_overview").select("*").single();
console.log("analytics_overview:", overview);

const { data: events } = await supabase.from("events").select("type");
const byType = {};
for (const e of events || []) byType[e.type] = (byType[e.type] || 0) + 1;
console.log("events by type:", byType);

const { count: votes } = await supabase.from("votes").select("*", { count: "exact", head: true });
console.log("total votes:", votes);
