// tier bands ------------------------------------------------------------------
export const TIERS = [
  { key: "S", color: "#ff5e7e" }, { key: "A", color: "#ff9f43" }, { key: "B", color: "#ffd93d" },
  { key: "C", color: "#5bd18a" }, { key: "D", color: "#5aa9ff" }, { key: "F", color: "#9aa3b2" },
];
export const TIER_CUTS = [0.10, 0.18, 0.22, 0.22, 0.18, 0.10];

export function assignTiers(sortedDesc) {
  const n = sortedDesc.length; const cum = []; let s = 0;
  for (const c of TIER_CUTS) { s += c; cum.push(s); }
  const buckets = TIERS.map((t) => ({ ...t, items: [] }));
  sortedDesc.forEach((it, i) => { const frac = (i + 0.5) / n; let ti = cum.findIndex((c) => frac <= c); if (ti < 0) ti = TIERS.length - 1; buckets[ti].items.push(it); });
  return buckets.filter((b) => b.items.length > 0);
}
