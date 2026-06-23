// shareCard.js — render shareable PNG cards on an HTML canvas, on-brand with the
// AnimeRanker design system (ink bg, magenta accent, mint/coral, mono numbers).
//
// Two cards: a Tier Quiz result (S→F rows with cover thumbnails) and an Era War
// verdict (New% vs Old% split). Plus a static marketing card for the OG image.
//
// Cover images are loaded with crossOrigin so the canvas stays exportable; any
// cover that can't be fetched CORS-clean falls back to the same hashed-gradient
// tile the app's <Cover> uses, so export never fails on a tainted canvas.

import { hashHue, slug } from "./slug.js";
import { assignTiers } from "./tiers.js";

const C = {
  bg: "#0b0b10", panel: "#15151d", line: "#23232e",
  text: "#f3f1f5", muted: "#9b98a8", faint: "#5b5868",
  accent: "#ff2e74", up: "#43e6a0", oldBlue: "#5aa9ff",
};
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const sans = (w, s) => `${w} ${s}px ${SANS}`;
const mono = (w, s) => `${w} ${s}px ${MONO}`;

// --- canvas helpers ---------------------------------------------------------
function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function lines(ctx, text, maxW, max = 2) {
  const words = String(text).split(/\s+/);
  const out = []; let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; }
    else cur = t;
    if (out.length === max) break;
  }
  if (cur && out.length < max) out.push(cur);
  if (out.length === max && ctx.measureText(out[max - 1]).width > maxW) {
    let s = out[max - 1];
    while (s.length && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    out[max - 1] = s + "…";
  }
  return out;
}
function loadImage(src) {
  return new Promise((res) => {
    if (!src) return res(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}
function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height, tr = w / h;
  let sx, sy, sw, sh;
  if (ir > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
function drawTile(ctx, item, img, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8); ctx.clip();
  if (img) {
    drawCover(ctx, img, x, y, w, h);
  } else {
    const hue = hashHue(item.title || "");
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, `hsl(${hue} 55% 22%)`);
    g.addColorStop(1, `hsl(${(hue + 40) % 360} 60% 12%)`);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.font = sans(700, Math.max(9, Math.round(w * 0.13)));
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const ls = lines(ctx, item.title || "", w - 8, 3);
    const lh = Math.max(11, Math.round(w * 0.15));
    ls.forEach((ln, i) => ctx.fillText(ln, x + w / 2, y + h / 2 + (i - (ls.length - 1) / 2) * lh));
  }
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.stroke();
  ctx.restore();
}
function bgGlow(ctx, w, h) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.12, 0, w / 2, h * 0.12, w * 0.7);
  g.addColorStop(0, "rgba(255,46,116,.13)");
  g.addColorStop(1, "rgba(255,46,116,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
function wordmark(ctx, x, y, size = 30) {
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "3px";
  ctx.font = sans(800, size);
  let cx = x;
  ctx.fillStyle = C.accent; ctx.fillText("◆ ", cx, y); cx += ctx.measureText("◆ ").width;
  ctx.fillStyle = C.text; ctx.fillText("ANIME", cx, y); cx += ctx.measureText("ANIME").width;
  ctx.fillStyle = C.accent; ctx.fillText("RANKER", cx, y);
  ctx.letterSpacing = "0px";
}
function footer(ctx, w, h) {
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.font = mono(600, 24);
  const url = "animeranker.vercel.app";
  const dot = "◆ ";
  const tw = ctx.measureText(dot + url).width;
  const sx = (w - tw) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = C.accent; ctx.fillText(dot, sx, h - 52);
  ctx.fillStyle = C.faint; ctx.fillText(url, sx + ctx.measureText(dot).width, h - 52);
}

// --- TIER CARD --------------------------------------------------------------
export async function renderTierCard(tiers, meta = {}) {
  const W = 1080, H = 1350, P = 64;
  const c = makeCanvas(W, H), ctx = c.getContext("2d");
  bgGlow(ctx, W, H);

  // header
  wordmark(ctx, P, P + 28);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "5px";
  ctx.font = sans(700, 20); ctx.fillStyle = C.muted;
  ctx.fillText("MY TIER LIST", P, P + 92);
  ctx.letterSpacing = "0px";
  ctx.font = sans(800, 76); ctx.fillStyle = C.text;
  ctx.fillText("Ranked by me", P, P + 168);
  ctx.font = mono(500, 26); ctx.fillStyle = C.muted;
  const titles = meta.titles ?? tiers.reduce((n, t) => n + t.items.length, 0);
  ctx.fillText(`${titles} anime · ${meta.picks ?? 0} picks`, P, P + 210);

  // preload covers
  const all = tiers.flatMap((t) => t.items);
  const imgs = await Promise.all(all.map((it) => loadImage(it.image)));
  const imgBy = new Map(all.map((it, i) => [it.id, imgs[i]]));

  // tier rows fill the vertical space between the header and footer
  const rowsTop = P + 250;
  const rowsBottom = H - 110;
  const n = tiers.length;
  const rowGap = 12;
  const vpad = 8;
  let th = Math.floor((rowsBottom - rowsTop - (n - 1) * rowGap) / n) - vpad * 2;
  th = Math.max(70, Math.min(150, th));
  const tw = Math.round(th * 0.75);
  const RH = th + vpad * 2;
  const labelW = RH;
  const gap = 14, g = 10;
  const thumbAreaX = P + labelW + gap;
  const thumbAreaW = W - P - thumbAreaX;
  const perLine = Math.max(1, Math.floor((thumbAreaW + g) / (tw + g)));

  let y = rowsTop;
  for (const t of tiers) {
    // label cell
    ctx.fillStyle = t.color;
    roundRect(ctx, P, y, labelW, RH, 14); ctx.fill();
    ctx.fillStyle = "#0b0b10"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = sans(900, Math.round(RH * 0.42));
    ctx.fillText(t.key, P + labelW / 2, y + RH / 2 + 2);

    // thumbnails (one line, +N overflow chip)
    const items = t.items;
    const overflow = items.length > perLine;
    const showCount = overflow ? perLine - 1 : items.length;
    let tx = thumbAreaX; const ty = y + (RH - th) / 2;
    for (let i = 0; i < showCount; i++) {
      drawTile(ctx, items[i], imgBy.get(items[i].id), tx, ty, tw, th);
      tx += tw + g;
    }
    if (overflow) {
      const more = items.length - showCount;
      ctx.save();
      roundRect(ctx, tx, ty, tw, th, 8);
      ctx.fillStyle = C.panel; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.stroke();
      ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = mono(700, Math.round(tw * 0.28));
      ctx.fillText(`+${more}`, tx + tw / 2, ty + th / 2);
      ctx.restore();
    }
    y += RH + rowGap;
  }

  footer(ctx, W, H);
  return c;
}

// --- ERA WAR CARD -----------------------------------------------------------
export function renderEraCard(result) {
  const { verdict, pNew, gNew, gTotal } = result;
  const pOld = 100 - pNew, gOld = 100 - gNew;
  const W = 1080, H = 1350, P = 72;
  const c = makeCanvas(W, H), ctx = c.getContext("2d");
  bgGlow(ctx, W, H);

  wordmark(ctx, P, P + 28);

  const dominantNew = pNew >= 50;
  const heroColor = dominantNew ? C.accent : C.oldBlue;
  const vColor = pNew >= 60 ? C.accent : pNew <= 40 ? C.oldBlue : C.text;

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

  // eyebrow
  ctx.letterSpacing = "6px"; ctx.font = sans(700, 22); ctx.fillStyle = C.muted;
  ctx.fillText("ERA WAR · MY VERDICT", W / 2, 360);
  ctx.letterSpacing = "0px";

  // verdict
  ctx.fillStyle = vColor; ctx.font = sans(800, 88);
  const vl = lines(ctx, verdict, W - P * 2, 2);
  vl.forEach((ln, i) => ctx.fillText(ln, W / 2, 470 + i * 94));
  let y = 470 + (vl.length - 1) * 94;

  // hero percentage (dominant side) — the headline "X% New Gen" stat
  ctx.fillStyle = heroColor; ctx.font = mono(800, 250);
  ctx.fillText(`${dominantNew ? pNew : pOld}%`, W / 2, y + 260);
  ctx.letterSpacing = "8px"; ctx.font = sans(700, 36); ctx.fillStyle = C.muted;
  ctx.fillText(dominantNew ? "NEW GEN" : "OLD GEN", W / 2, y + 322);
  ctx.letterSpacing = "0px";
  y += 322;

  // your split sub-line
  ctx.font = mono(500, 28); ctx.fillStyle = C.muted;
  ctx.fillText(`You sided New ${pNew}%  ·  Old ${pOld}%`, W / 2, y + 78);
  y += 78;

  // split bar
  const barX = P, barW = W - P * 2, barY = y + 46, barH = 124;
  const newW = Math.round(barW * pNew / 100);
  ctx.save();
  roundRect(ctx, barX, barY, barW, barH, 20); ctx.clip();
  ctx.fillStyle = C.accent; ctx.fillRect(barX, barY, newW, barH);
  ctx.fillStyle = C.oldBlue; ctx.fillRect(barX + newW, barY, barW - newW, barH);
  ctx.restore();
  ctx.save();
  roundRect(ctx, barX, barY, barW, barH, 20);
  ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#fff"; ctx.textBaseline = "middle";
  ctx.font = sans(800, 30);
  if (pNew >= 16) { ctx.textAlign = "left"; ctx.fillText(`NEW ${pNew}%`, barX + 26, barY + barH / 2); }
  if (pOld >= 16) { ctx.textAlign = "right"; ctx.fillText(`OLD ${pOld}%`, barX + barW - 26, barY + barH / 2); }

  // global line
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.font = mono(500, 26); ctx.fillStyle = C.faint;
  ctx.fillText(`the internet so far:  New ${gNew}%  ·  Old ${gOld}%  ·  ${gTotal} votes`, W / 2, barY + barH + 80);

  footer(ctx, W, H);
  return c;
}

// --- TITLE CARD -------------------------------------------------------------
// A single title's standing, mirroring the detail hero: cover on the left;
// era eyebrow, title, and RANK / ELO / VOTES on the right. The wordmark + URL
// sit underneath the cover. meta = { rank, elo, votes }.
export async function renderTitleCard(item, meta = {}) {
  const W = 1080, H = 1080, P = 80;
  const c = makeCanvas(W, H), ctx = c.getContext("2d");
  bgGlow(ctx, W, H);

  const isNew = item.era === "new";
  const eraColor = isNew ? C.accent : C.oldBlue;

  // left column: cover + (wordmark + url) underneath it, vertically centered
  const coverW = 360, coverH = Math.round(coverW / 0.75); // 3/4 portrait → 480
  const capGap = 64, capH = 84;                            // logo + url block
  const blockH = coverH + capGap + capH;
  const coverX = P, coverY = Math.round((H - blockH) / 2);

  const img = await loadImage(item.image);
  ctx.save();
  roundRect(ctx, coverX, coverY, coverW, coverH, 20); ctx.clip();
  if (img) {
    drawCover(ctx, img, coverX, coverY, coverW, coverH);
  } else {
    const hue = hashHue(item.title || "");
    const g = ctx.createLinearGradient(coverX, coverY, coverX + coverW, coverY + coverH);
    g.addColorStop(0, `hsl(${hue} 55% 22%)`);
    g.addColorStop(1, `hsl(${(hue + 40) % 360} 60% 12%)`);
    ctx.fillStyle = g; ctx.fillRect(coverX, coverY, coverW, coverH);
    ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.font = sans(700, 40);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const ls = lines(ctx, item.title || "", coverW - 40, 3);
    ls.forEach((ln, i) => ctx.fillText(ln, coverX + coverW / 2, coverY + coverH / 2 + (i - (ls.length - 1) / 2) * 48));
  }
  ctx.restore();
  ctx.save();
  roundRect(ctx, coverX, coverY, coverW, coverH, 20);
  ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();

  // wordmark + url, underneath the cover, left-aligned to it
  const capY = coverY + coverH + capGap;
  wordmark(ctx, coverX, capY, 30);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.font = mono(600, 26); ctx.fillStyle = C.faint;
  ctx.fillText("animeranker.net", coverX, capY + 42);

  // right column: era eyebrow, title, stats
  const rightX = coverX + coverW + 72;
  const rightW = W - rightX - P;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

  let by = coverY + 40; // eyebrow baseline
  ctx.letterSpacing = "5px"; ctx.font = sans(700, 22); ctx.fillStyle = eraColor;
  ctx.fillText(`${isNew ? "NEW GEN" : "OLD GEN"}${item.year ? ` · ${item.year}` : ""}`, rightX, by);
  ctx.letterSpacing = "0px";

  by += 92; // first title baseline
  ctx.font = sans(800, 76); ctx.fillStyle = C.text;
  const tl = lines(ctx, item.title || "", rightW, 2);
  const lh = 84;
  tl.forEach((ln, i) => ctx.fillText(ln, rightX, by + i * lh));

  by += (tl.length - 1) * lh + 132; // stat value baseline
  const stats = [["RANK", `#${meta.rank}`, false], ["ELO", String(meta.elo), true], ["VOTES", String(meta.votes), false]];
  let sx = rightX;
  for (const [label, value, accent] of stats) {
    ctx.font = mono(800, 58); ctx.fillStyle = accent ? C.accent : C.text;
    ctx.fillText(value, sx, by);
    const vw = ctx.measureText(value).width;
    ctx.letterSpacing = "2px"; ctx.font = sans(700, 18); ctx.fillStyle = C.muted;
    ctx.fillText(label, sx, by + 34);
    const lw = ctx.measureText(label).width;
    ctx.letterSpacing = "0px";
    sx += Math.max(vw, lw) + 48;
  }

  return c;
}

// --- OG / marketing card (static, no external images) -----------------------
export function renderOgCanvas() {
  const W = 1200, H = 630;
  const c = makeCanvas(W, H), ctx = c.getContext("2d");
  bgGlow(ctx, W, H);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "8px"; ctx.font = sans(800, 78);
  let cx = W / 2;
  // measure to center the colored wordmark
  ctx.letterSpacing = "8px";
  const parts = [["◆ ", C.accent], ["ANIME", C.text], ["RANKER", C.accent]];
  const total = parts.reduce((s, [t]) => s + ctx.measureText(t).width, 0);
  let x = (W - total) / 2;
  ctx.textAlign = "left";
  for (const [t, col] of parts) { ctx.fillStyle = col; ctx.fillText(t, x, 250); x += ctx.measureText(t).width; }
  ctx.letterSpacing = "0px";

  ctx.textAlign = "center"; ctx.font = sans(600, 34); ctx.fillStyle = C.muted;
  ctx.fillText("Which anime is better?", W / 2, 330);
  ctx.font = sans(400, 27); ctx.fillStyle = C.faint;
  ctx.fillText("Vote head-to-head · build your tier list · settle Old Gen vs New Gen", W / 2, 374);

  // decorative tier strip
  const tcolors = ["#ff5e7e", "#ff9f43", "#ffd93d", "#5bd18a", "#5aa9ff", "#9aa3b2"];
  const keys = ["S", "A", "B", "C", "D", "F"];
  const sw = 70, sg = 14, sy = 430;
  const sx0 = (W - (sw * 6 + sg * 5)) / 2;
  for (let i = 0; i < 6; i++) {
    const sx = sx0 + i * (sw + sg);
    ctx.fillStyle = tcolors[i]; roundRect(ctx, sx, sy, sw, sw, 12); ctx.fill();
    ctx.fillStyle = "#0b0b10"; ctx.font = sans(900, 34); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(keys[i], sx + sw / 2, sy + sw / 2 + 1);
  }

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.font = mono(600, 26); ctx.fillStyle = C.faint;
  ctx.fillText("animeranker.vercel.app", W / 2, H - 48);
  return c;
}

// --- share / download -------------------------------------------------------
function canvasToBlob(canvas) {
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}
async function shareCanvas(canvas, filename, shareData) {
  const blob = await canvasToBlob(canvas);
  if (!blob) return "error";
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: shareData.title, text: shareData.text }); return "shared"; }
    catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}

export async function shareTierList(tiers, meta) {
  const canvas = await renderTierCard(tiers, meta);
  return shareCanvas(canvas, "animeranker-tier-list.png", {
    title: "My AnimeRanker tier list",
    text: "My anime tier list — make yours at animeranker.vercel.app",
  });
}
export async function shareEraVerdict(result) {
  const canvas = renderEraCard(result);
  return shareCanvas(canvas, "animeranker-era-war.png", {
    title: "My Era War verdict",
    text: `I'm ${result.verdict} — settle Old Gen vs New Gen at animeranker.vercel.app`,
  });
}
// Render the title card and hand back a blob URL for it. The caller is expected
// to open a blank tab *synchronously* on the user's click (so the popup blocker
// allows it) and pass it in; we then point that tab at the image, which the user
// can right-click to save. If no tab is available (blocked), we fall back to a
// direct download so the action never silently fails.
export async function openTitleCard(item, meta, win) {
  const canvas = await renderTitleCard(item, meta);
  const blob = await canvasToBlob(canvas);
  if (!blob) { if (win && !win.closed) win.close(); return "error"; }
  // Don't revoke: the new tab needs the URL to stay alive to keep showing the image.
  const url = URL.createObjectURL(blob);
  if (win && !win.closed) { win.location.href = url; return "opened"; }
  const a = document.createElement("a");
  a.href = url; a.download = `animeranker-${slug(item.title) || "title"}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  return "downloaded";
}

// --- dev-only hooks for previewing/generating cards (stripped from prod) -----
if (typeof window !== "undefined" && import.meta.env && import.meta.env.DEV) {
  const sampleTiers = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const r = await fetch(`${url}/rest/v1/media?select=title,image&limit=40`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const rows = await r.json();
    const items = rows.map((m, i) => ({ id: "s" + i, title: m.title, image: m.image }));
    return assignTiers(items);
  };
  const show = (canvas) => { canvas.style.width = "420px"; canvas.style.height = "auto"; document.body.innerHTML = ""; document.body.style.background = "#000"; document.body.appendChild(canvas); };
  window.__previewTier = async () => { show(await renderTierCard(await sampleTiers(), { picks: 26, titles: 40 })); return "tier"; };
  window.__previewEra = () => { show(renderEraCard({ verdict: "New Gen loyalist", pNew: 67, gNew: 54, gTotal: 1284 })); return "era"; };
  window.__previewOg = () => { show(renderOgCanvas()); return "og"; };
  window.__previewTitle = async () => { show(await renderTitleCard({ title: "Solo Leveling", image: null, era: "new", year: 2024 }, { rank: 2, elo: 1105, votes: 7 })); return "title"; };
  window.__ogDataURL = () => renderOgCanvas().toDataURL("image/png");
}
