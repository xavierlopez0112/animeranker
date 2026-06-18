// storage --------------------------------------------------------------------
// Uses window.storage (the Claude artifact KV store) when present, falls back
// to an in-memory map. Placeholder until the real backend lands.
const mem = {};

export async function loadKey(key, def) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(key, true);
      return r && r.value ? JSON.parse(r.value) : def;
    }
  } catch (_) {}
  return mem[key] || def;
}

export async function saveKey(key, val) {
  mem[key] = val;
  try {
    if (typeof window !== "undefined" && window.storage) await window.storage.set(key, JSON.stringify(val), true);
  } catch (_) {}
}
