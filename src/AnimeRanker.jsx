import React, { useState, useEffect, useRef, useCallback } from "react";

/* =========================================================================
   AnimeRanker  (v3 — categories + Era War)
   Modes:
     Vote        endless head-to-head -> global ELO  (scoped by category)
     Leaderboard global ranking, list <-> tier view  (scoped by category)
     Tier Quiz   short bounded run -> personal tier list (scoped by category)
     Era War     Old Gen vs New Gen cross-era quiz with a global tally
   Categories scope the first three modes: All / Old Gen / New Gen / Shonen /
     Seinen / Isekai / Fantasy / Action / Romance / Slice of Life /
     Sci-Fi & Mecha / Sports / Dark & Psych.
   Data: AniList GraphQL (top ~100), falls back to a baked-in tagged list.
   ========================================================================= */

const ERA_CUT = 2013; // Attack on Titan line: <2013 old gen, >=2013 new gen

// fallback catalog with metadata so categories work offline ------------------
const FALLBACK_RAW = [
  ["Fullmetal Alchemist: Brotherhood", 2009, "shonen", ["action", "fantasy", "adventure", "drama"]],
  ["Steins;Gate", 2011, "seinen", ["scifi", "thriller", "drama"]],
  ["Attack on Titan", 2013, "shonen", ["action", "fantasy", "drama", "horror"]],
  ["Death Note", 2006, "shonen", ["psychological", "thriller", "supernatural", "mystery"]],
  ["Hunter x Hunter", 2011, "shonen", ["action", "adventure", "fantasy"]],
  ["Code Geass", 2006, "shonen", ["mecha", "scifi", "drama", "thriller"]],
  ["Cowboy Bebop", 1998, "seinen", ["scifi", "action", "drama"]],
  ["Neon Genesis Evangelion", 1995, "shonen", ["mecha", "scifi", "psychological", "drama"]],
  ["Demon Slayer", 2019, "shonen", ["action", "fantasy", "supernatural"]],
  ["Jujutsu Kaisen", 2020, "shonen", ["action", "supernatural", "horror"]],
  ["My Hero Academia", 2016, "shonen", ["action", "supernatural"]],
  ["Mob Psycho 100", 2016, "seinen", ["action", "supernatural", "comedy", "sliceoflife"]],
  ["One Punch Man", 2015, "seinen", ["action", "comedy", "supernatural"]],
  ["Vinland Saga", 2019, "seinen", ["action", "adventure", "drama"]],
  ["Chainsaw Man", 2022, "shonen", ["action", "horror", "supernatural"]],
  ["Spy x Family", 2022, "shonen", ["action", "comedy", "sliceoflife"]],
  ["Frieren: Beyond Journey's End", 2023, "shonen", ["fantasy", "adventure", "drama"]],
  ["Monster", 2004, "seinen", ["psychological", "thriller", "mystery", "drama"]],
  ["Gintama", 2006, "shonen", ["action", "comedy", "scifi"]],
  ["Clannad: After Story", 2008, "seinen", ["drama", "romance", "sliceoflife"]],
  ["Your Lie in April", 2014, "shonen", ["romance", "drama", "music"]],
  ["Violet Evergarden", 2018, "seinen", ["drama", "romance", "sliceoflife"]],
  ["A Silent Voice", 2016, "shonen", ["drama", "romance", "sliceoflife"]],
  ["Re:Zero", 2016, "seinen", ["isekai", "fantasy", "psychological", "drama"]],
  ["Made in Abyss", 2017, "seinen", ["adventure", "fantasy", "horror", "drama"]],
  ["JoJo's Bizarre Adventure", 2012, "shonen", ["action", "adventure", "supernatural"]],
  ["Tokyo Ghoul", 2014, "seinen", ["action", "horror", "supernatural", "psychological"]],
  ["Samurai Champloo", 2004, "seinen", ["action", "adventure"]],
  ["Fate/Zero", 2011, "seinen", ["action", "fantasy", "supernatural"]],
  ["Erased", 2016, "seinen", ["mystery", "thriller", "psychological", "supernatural"]],
  ["Haikyuu!!", 2014, "shonen", ["sports", "comedy", "drama"]],
  ["Dr. Stone", 2019, "shonen", ["scifi", "adventure", "comedy"]],
  ["The Promised Neverland", 2019, "shonen", ["thriller", "mystery", "horror", "scifi"]],
  ["KonoSuba", 2016, "shonen", ["isekai", "fantasy", "comedy"]],
  ["Bocchi the Rock!", 2022, "seinen", ["music", "comedy", "sliceoflife"]],
  ["Cyberpunk: Edgerunners", 2022, "seinen", ["scifi", "action", "drama"]],
  ["86 Eighty-Six", 2021, "shonen", ["scifi", "mecha", "action", "drama"]],
  ["Oshi no Ko", 2023, "seinen", ["drama", "psychological", "music", "mystery"]],
  ["Solo Leveling", 2024, "shonen", ["action", "fantasy", "adventure"]],
  ["One Piece", 1999, "shonen", ["action", "adventure", "fantasy", "comedy"]],
  ["Naruto", 2002, "shonen", ["action", "adventure"]],
  ["Bleach", 2004, "shonen", ["action", "supernatural"]],
  ["Dragon Ball Z", 1989, "shonen", ["action", "adventure"]],
  ["Black Lagoon", 2006, "seinen", ["action", "thriller"]],
  ["Parasyte", 2014, "seinen", ["horror", "scifi", "action", "psychological"]],
];
const FALLBACK = FALLBACK_RAW.map(([title, year, demo, genres], i) => ({
  id: `fb-${i}`, title, image: null, year, demo, genres, era: year < ERA_CUT ? "old" : "new",
}));

// live-data normalization ----------------------------------------------------
const GENRE_MAP = { "Action": "action", "Fantasy": "fantasy", "Romance": "romance", "Slice of Life": "sliceoflife", "Sci-Fi": "scifi", "Mecha": "mecha", "Sports": "sports", "Horror": "horror", "Psychological": "psychological", "Thriller": "thriller", "Supernatural": "supernatural", "Mystery": "mystery", "Drama": "drama", "Comedy": "comedy", "Adventure": "adventure", "Music": "music" };
const DEMO_TAGS = { "Shounen": "shonen", "Seinen": "seinen", "Shoujo": "shojo", "Josei": "josei", "Kids": "kids" };
function normLive(m) {
  const genres = (m.genres || []).map((g) => GENRE_MAP[g]).filter(Boolean);
  const tags = (m.tags || []).map((t) => t.name);
  if (tags.includes("Isekai") && !genres.includes("isekai")) genres.push("isekai");
  let demo = null; for (const t of tags) { if (DEMO_TAGS[t]) { demo = DEMO_TAGS[t]; break; } }
  const year = m.startDate && m.startDate.year ? m.startDate.year : null;
  return { id: String(m.id), title: m.title.english || m.title.romaji, image: m.coverImage.large, genres, demo, year, era: year && year < ERA_CUT ? "old" : "new" };
}

// categories -----------------------------------------------------------------
const CATEGORIES = [
  ["all", "All"], ["old", "Old Gen"], ["new", "New Gen"], ["shonen", "Shonen"], ["seinen", "Seinen"],
  ["isekai", "Isekai"], ["fantasy", "Fantasy"], ["action", "Action"], ["romance", "Romance"],
  ["sol", "Slice of Life"], ["scifi", "Sci-Fi & Mecha"], ["sports", "Sports"], ["dark", "Dark & Psych"],
];
function inCategory(it, key) {
  const g = it.genres || [];
  switch (key) {
    case "all": return true;
    case "old": return it.era === "old";
    case "new": return it.era === "new";
    case "shonen": return it.demo === "shonen";
    case "seinen": return it.demo === "seinen";
    case "isekai": return g.includes("isekai");
    case "fantasy": return g.includes("fantasy");
    case "action": return g.includes("action");
    case "romance": return g.includes("romance");
    case "sol": return g.includes("sliceoflife");
    case "scifi": return g.includes("scifi") || g.includes("mecha");
    case "sports": return g.includes("sports");
    case "dark": return g.includes("psychological") || g.includes("horror") || g.includes("thriller");
    default: return true;
  }
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function hashHue(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h) % 360; }

const START_ELO = 1000, K_GLOBAL = 32, K_LOCAL = 44;
const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));

const TIERS = [
  { key: "S", color: "#ff5e7e" }, { key: "A", color: "#ff9f43" }, { key: "B", color: "#ffd93d" },
  { key: "C", color: "#5bd18a" }, { key: "D", color: "#5aa9ff" }, { key: "F", color: "#9aa3b2" },
];
const TIER_CUTS = [0.10, 0.18, 0.22, 0.22, 0.18, 0.10];
function assignTiers(sortedDesc) {
  const n = sortedDesc.length; const cum = []; let s = 0;
  for (const c of TIER_CUTS) { s += c; cum.push(s); }
  const buckets = TIERS.map((t) => ({ ...t, items: [] }));
  sortedDesc.forEach((it, i) => { const frac = (i + 0.5) / n; let ti = cum.findIndex((c) => frac <= c); if (ti < 0) ti = TIERS.length - 1; buckets[ti].items.push(it); });
  return buckets.filter((b) => b.items.length > 0);
}

// storage --------------------------------------------------------------------
const mem = {};
async function loadKey(key, def) { try { if (typeof window !== "undefined" && window.storage) { const r = await window.storage.get(key, true); return r && r.value ? JSON.parse(r.value) : def; } } catch (_) {} return mem[key] || def; }
async function saveKey(key, val) { mem[key] = val; try { if (typeof window !== "undefined" && window.storage) await window.storage.set(key, JSON.stringify(val), true); } catch (_) {} }

async function fetchAnime() {
  const q = `query{p1:Page(page:1,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){id title{english romaji} coverImage{large} genres startDate{year} tags{name}}} p2:Page(page:2,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){id title{english romaji} coverImage{large} genres startDate{year} tags{name}}}}`;
  const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query: q }) });
  const j = await res.json();
  return [...j.data.p1.media, ...j.data.p2.media].map(normLive);
}

function Cover({ item, className = "" }) {
  const [broken, setBroken] = useState(false);
  const hue = hashHue(item.title);
  const grad = `linear-gradient(150deg, hsl(${hue} 55% 22%), hsl(${(hue + 40) % 360} 60% 12%))`;
  if (!item.image || broken) return (<div className={className} style={{ background: grad, height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, textAlign: "center" }}><span style={{ fontWeight: 700, lineHeight: 1.15, color: "rgba(255,255,255,.9)", textWrap: "balance" }}>{item.title}</span></div>);
  return <img src={item.image} alt={item.title} onError={() => setBroken(true)} className={className} style={{ height: "100%", width: "100%", objectFit: "cover" }} draggable={false} />;
}

// =========================================================================
export default function AnimeRanker() {
  const [tab, setTab] = useState("vote");
  const [cat, setCat] = useState("all");
  const [data, setData] = useState(null);
  const [board, setBoard] = useState({});
  const [source, setSource] = useState("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      const b = await loadKey("anime-elo-v3", {}); if (alive) setBoard(b);
      try { const live = await fetchAnime(); if (alive && live && live.length) { setData(live); setSource("live"); return; } throw new Error("empty"); }
      catch (_) { if (alive) { setData(FALLBACK); setSource("fallback"); } }
    })();
    return () => { alive = false; };
  }, []);

  const ratingOf = useCallback((it) => board[slug(it.title)]?.elo ?? START_ELO, [board]);
  const recordVote = useCallback((winner, loser) => {
    setBoard((prev) => {
      const next = { ...prev }; const wk = slug(winner.title), lk = slug(loser.title);
      const w = next[wk] || { elo: START_ELO, w: 0, l: 0 }; const l = next[lk] || { elo: START_ELO, w: 0, l: 0 };
      const ew = expected(w.elo, l.elo);
      next[wk] = { elo: Math.round(w.elo + K_GLOBAL * (1 - ew)), w: w.w + 1, l: w.l };
      next[lk] = { elo: Math.round(l.elo + K_GLOBAL * (0 - (1 - ew))), w: l.w, l: l.l + 1 };
      saveKey("anime-elo-v3", next); return next;
    });
  }, []);

  const filtered = data ? (cat === "all" ? data : data.filter((d) => inCategory(d, cat))) : [];
  const scoped = tab !== "war"; // category bar shows for vote/board/quiz

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <header style={S.header}>
        <div style={S.brand}><span style={S.brandMark}>◆</span> ANIME<span style={{ color: "var(--accent)" }}>RANKER</span></div>
        <nav style={S.nav}>
          {[["vote", "Vote"], ["board", "Leaderboard"], ["quiz", "Tier Quiz"], ["war", "Era War"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...S.tab, ...(tab === k ? S.tabOn : {}) }}>{label}</button>
          ))}
        </nav>
        <div style={S.sourceTag}>{source === "live" ? "live · anilist" : source === "fallback" ? "offline list" : "loading…"}</div>
      </header>

      {data && scoped && (
        <div style={S.chipBar}>
          {CATEGORIES.map(([k, label]) => {
            const n = k === "all" ? data.length : data.filter((d) => inCategory(d, k)).length;
            const disabled = n < 2;
            return (
              <button key={k} onClick={() => !disabled && setCat(k)} disabled={disabled}
                style={{ ...S.chip, ...(cat === k ? S.chipOn : {}), ...(disabled ? S.chipOff : {}) }}>
                {label}<span style={S.chipCount}>{n}</span>
              </button>
            );
          })}
        </div>
      )}

      {!data && <div style={S.loading}>Loading the roster…</div>}
      {data && tab === "vote" && <Vote key={cat} data={filtered} ratingOf={ratingOf} onVote={recordVote} />}
      {data && tab === "board" && <Leaderboard data={filtered} board={board} />}
      {data && tab === "quiz" && <Quiz key={cat} data={filtered} ratingOf={ratingOf} onVote={recordVote} />}
      {data && tab === "war" && <EraWar data={data} onVote={recordVote} />}
    </div>
  );
}

// ---- VOTE -----------------------------------------------------------------
function Vote({ data, ratingOf, onVote }) {
  const enough = data.length >= 2;
  const [pair, setPair] = useState(() => randomPair(data));
  const [reveal, setReveal] = useState(null);
  const [count, setCount] = useState(0);
  const next = useCallback(() => { setReveal(null); setPair(randomPair(data)); }, [data]);
  const vote = useCallback((idx) => { if (reveal || !pair[idx]) return; onVote(pair[idx], pair[1 - idx]); setReveal({ winner: idx }); setCount((c) => c + 1); setTimeout(next, 1250); }, [pair, reveal, onVote, next]);
  useEffect(() => { const h = (e) => { if (e.key === "ArrowLeft") vote(0); else if (e.key === "ArrowRight") vote(1); else if (e.key === " ") { e.preventDefault(); if (!reveal) next(); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [vote, next, reveal]);

  if (!enough) return <main style={S.stage}><h1 style={S.h1}>Not enough titles</h1><p style={S.sub}>This category needs at least two titles to match up. Pick another.</p></main>;

  return (
    <main style={S.stage}>
      <h1 style={S.h1}>Which one’s better?</h1>
      <p style={S.sub}>Click to vote · arrow keys to choose · space to skip</p>
      <div style={S.arena}>
        {pair.map((it, idx) => {
          const r = ratingOf(it); const won = reveal && reveal.winner === idx; const lost = reveal && reveal.winner !== idx;
          return (<React.Fragment key={it.id}>
            <button onClick={() => vote(idx)} disabled={!!reveal} style={{ ...S.card, ...(lost ? S.cardDim : {}), ...(won ? S.cardWin : {}) }} className="ar-card">
              <Cover item={it} className="ar-cover" /><div style={S.cardShade} /><div style={S.cardName}>{it.title}</div>
              {reveal && (<div style={S.revealWrap}>{won && <div style={S.check}>✓</div>}<div style={{ ...S.elo, color: won ? "var(--up)" : "var(--down)" }}>{r}</div><div style={S.eloLabel}>ELO</div></div>)}
            </button>
            {idx === 0 && <div style={S.vs}>VS</div>}
          </React.Fragment>);
        })}
      </div>
      <div style={S.controls}><button style={S.ghostBtn} disabled={!!reveal} onClick={next}>Skip this matchup</button></div>
      <div style={S.tally}>{count} {count === 1 ? "vote" : "votes"} this session</div>
    </main>
  );
}
function randomPair(data) {
  if (data.length < 2) return [data[0], data[0]].filter(Boolean);
  const a = Math.floor(Math.random() * data.length); let b = Math.floor(Math.random() * data.length);
  while (b === a) b = Math.floor(Math.random() * data.length);
  return [data[a], data[b]];
}

// ---- LEADERBOARD -----------------------------------------------------------
function Leaderboard({ data, board }) {
  const [view, setView] = useState("list");
  const rows = data.map((it) => { const rec = board[slug(it.title)] || { elo: START_ELO, w: 0, l: 0 }; const games = rec.w + rec.l; return { it, elo: rec.elo, w: rec.w, l: rec.l, games, wr: games ? rec.w / games : null }; }).sort((a, b) => b.elo - a.elo);
  if (data.length < 1) return <main style={S.stage}><h1 style={S.h1}>Nothing here yet</h1><p style={S.sub}>No titles in this category. Pick another.</p></main>;
  return (
    <main style={S.stage}>
      <h1 style={S.h1}>Leaderboard</h1>
      <p style={S.sub}>Global ELO · updates as everyone votes</p>
      <div style={S.segWrap}>
        <button style={{ ...S.seg, ...(view === "list" ? S.segOn : {}) }} onClick={() => setView("list")}>List</button>
        <button style={{ ...S.seg, ...(view === "tier" ? S.segOn : {}) }} onClick={() => setView("tier")}>Tiers</button>
      </div>
      {view === "list" && (
        <div style={S.boardWrap}>
          {rows.map((row, i) => (
            <div key={row.it.id} style={{ ...S.boardRow, ...(i < 3 ? S.boardRowTop : {}) }}>
              <div style={{ ...S.rank, color: i === 0 ? "var(--accent)" : i < 3 ? "#fff" : "var(--muted)" }}>{i + 1}</div>
              <div style={S.thumb}><Cover item={row.it} /></div>
              <div style={S.boardName}>{row.it.title}</div>
              <div style={S.boardStat}>{row.games > 0 ? <span style={{ color: "var(--muted)" }}>{row.w}W · {row.l}L · {Math.round(row.wr * 100)}%</span> : <span style={{ color: "var(--faint)" }}>no votes yet</span>}</div>
              <div style={S.boardElo}>{row.elo}</div>
            </div>
          ))}
        </div>
      )}
      {view === "tier" && <TierList tiers={assignTiers(rows.map((r) => r.it))} />}
    </main>
  );
}

function TierList({ tiers }) {
  return (
    <div style={S.tierWrap}>
      {tiers.map((t) => (
        <div key={t.key} style={S.tierRow}>
          <div style={{ ...S.tierLabel, background: t.color }}>{t.key}</div>
          <div style={S.tierItems}>
            {t.items.map((it) => (<div key={it.id} style={S.tierCard} title={it.title}><Cover item={it} /><div style={S.tierCardName}>{it.title}</div></div>))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- TIER QUIZ -------------------------------------------------------------
const DEPTHS = [{ key: "Quick", pool: 20, budget: 14 }, { key: "Standard", pool: 30, budget: 26 }, { key: "Deep", pool: 45, budget: 44 }];
function Quiz({ data, ratingOf, onVote }) {
  const q = useRef(null);
  const [started, setStarted] = useState(false);
  const [pair, setPair] = useState(null);
  const [count, setCount] = useState(0);
  const [budget, setBudget] = useState(0);
  const [tiers, setTiers] = useState(null);
  const pe = (it) => q.current.personal[slug(it.title)];

  const nextPair = useCallback(() => {
    const s = q.current; if (s.count >= s.budget) return finish();
    if (s.coverage.length >= 2) { const a = s.coverage.shift(), b = s.coverage.shift(); s.last = [a.id, b.id]; setPair([a, b]); return; }
    const ranked = [...s.pool].sort((x, y) => pe(y) - pe(x));
    let i = Math.floor(Math.random() * (ranked.length - 1)); let a = ranked[i], b = ranked[i + 1];
    if (s.last && s.last[0] === a.id && s.last[1] === b.id) { i = (i + 1) % (ranked.length - 1); a = ranked[i]; b = ranked[i + 1]; }
    s.last = [a.id, b.id]; setPair([a, b]);
  }, []);
  const finish = useCallback(() => { const s = q.current; const sorted = [...s.pool].sort((x, y) => pe(y) - pe(x)); setTiers(assignTiers(sorted)); setPair(null); }, []);
  const start = useCallback((depth) => {
    const pool = data.slice(0, Math.min(depth.pool, data.length)); const personal = {};
    pool.forEach((it) => { personal[slug(it.title)] = ratingOf(it); });
    const idx = pool.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const budget = Math.min(depth.budget, Math.max(1, pool.length * 2));
    q.current = { pool, personal, coverage: idx.map((i) => pool[i]), count: 0, budget, last: null };
    setBudget(budget); setCount(0); setTiers(null); setStarted(true); setTimeout(nextPair, 0);
  }, [data, ratingOf, nextPair]);
  const choose = useCallback((winIdx) => {
    const s = q.current; if (!s || !pair) return;
    const winner = pair[winIdx], loser = pair[1 - winIdx]; const wk = slug(winner.title), lk = slug(loser.title);
    const ew = expected(s.personal[wk], s.personal[lk]);
    s.personal[wk] += K_LOCAL * (1 - ew); s.personal[lk] += K_LOCAL * (0 - (1 - ew));
    onVote(winner, loser); s.count += 1; setCount(s.count);
    if (s.count >= s.budget) finish(); else nextPair();
  }, [pair, onVote, finish, nextPair]);
  useEffect(() => { if (!pair) return; const h = (e) => { if (e.key === "ArrowLeft") choose(0); else if (e.key === "ArrowRight") choose(1); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [pair, choose]);

  if (data.length < 6) return <main style={S.stage}><h1 style={S.h1}>Need more titles</h1><p style={S.sub}>A tier list needs at least six titles in the category. Pick a broader one.</p></main>;

  if (!started) return (
    <main style={S.stage}>
      <h1 style={S.h1}>Build your tier list</h1>
      <p style={S.sub}>Starts from the global ranking — you just sharpen what you care about. Every pick also feeds the leaderboard.</p>
      <div style={S.poolRow}>{DEPTHS.map((d) => (<button key={d.key} style={S.poolBtn} onClick={() => start(d)}><div style={S.poolNum}>{d.key}</div><div style={S.poolMeta}>{Math.min(d.pool, data.length)} titles · {Math.min(d.budget, data.length * 2)} picks</div></button>))}</div>
    </main>
  );
  if (tiers) return (
    <main style={S.stage}>
      <h1 style={S.h1}>Your tier list</h1>
      <p style={S.sub}>{count} picks · seeded by the community, sharpened by you</p>
      <div style={S.controls}>
        <button style={S.ghostBtn} onClick={() => { q.current.budget += 10; setBudget(q.current.budget); setTiers(null); setTimeout(nextPair, 0); }}>Refine more (+10)</button>
        <button style={{ ...S.ghostBtn, marginLeft: 10 }} onClick={() => setStarted(false)}>Start over</button>
      </div>
      <TierList tiers={tiers} />
    </main>
  );
  const pct = Math.min(100, Math.round((count / budget) * 100));
  return (
    <main style={S.stage}>
      <h1 style={S.h1}>Which one’s better?</h1>
      <p style={S.sub}>Pick one · arrow keys work too</p>
      <div style={S.progressOuter}><div style={{ ...S.progressInner, width: `${pct}%` }} /><span style={S.progressLabel}>{count}/{budget}</span></div>
      <div style={S.arena}>{pair && [pair[0], pair[1]].map((it, idx) => (<React.Fragment key={it.id}><button onClick={() => choose(idx)} style={S.card} className="ar-card"><Cover item={it} className="ar-cover" /><div style={S.cardShade} /><div style={S.cardName}>{it.title}</div></button>{idx === 0 && <div style={S.vs}>VS</div>}</React.Fragment>))}</div>
      <div style={S.controls}><button style={S.ghostBtn} onClick={finish}>Done — show my tiers</button></div>
    </main>
  );
}

// ---- ERA WAR (Old Gen vs New Gen) -----------------------------------------
const WAR_BUDGET = 12;
function EraWar({ data, onVote }) {
  const oldPool = data.filter((d) => d.era === "old");
  const newPool = data.filter((d) => d.era === "new");
  const eraRef = useRef({ old: 0, new: 0 });
  const [started, setStarted] = useState(false);
  const [pair, setPair] = useState(null);
  const [count, setCount] = useState(0);
  const [tally, setTally] = useState({ old: 0, new: 0 });
  const [global, setGlobal] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => { (async () => { eraRef.current = await loadKey("anime-era-v1", { old: 0, new: 0 }); })(); }, []);
  const draw = useCallback(() => {
    const o = oldPool[Math.floor(Math.random() * oldPool.length)];
    const n = newPool[Math.floor(Math.random() * newPool.length)];
    return Math.random() < 0.5 ? [o, n] : [n, o];
  }, [oldPool, newPool]);
  const start = () => { setStarted(true); setCount(0); setTally({ old: 0, new: 0 }); setDone(false); setPair(draw()); };
  const choose = useCallback(async (idx) => {
    if (!pair) return; const chosen = pair[idx], other = pair[1 - idx]; const isNew = chosen.era === "new";
    onVote(chosen, other);
    setTally((t) => (isNew ? { ...t, new: t.new + 1 } : { ...t, old: t.old + 1 }));
    eraRef.current = { ...eraRef.current, [isNew ? "new" : "old"]: eraRef.current[isNew ? "new" : "old"] + 1 };
    saveKey("anime-era-v1", eraRef.current);
    const c = count + 1; setCount(c);
    if (c >= WAR_BUDGET) { setGlobal({ ...eraRef.current }); setDone(true); setPair(null); } else setPair(draw());
  }, [pair, count, onVote, draw]);
  useEffect(() => { if (!pair) return; const h = (e) => { if (e.key === "ArrowLeft") choose(0); else if (e.key === "ArrowRight") choose(1); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [pair, choose]);

  if (oldPool.length < 1 || newPool.length < 1) return <main style={S.stage}><h1 style={S.h1}>Era War needs both eras</h1><p style={S.sub}>Couldn’t find enough old- and new-gen titles in the roster.</p></main>;

  if (!started) return (
    <main style={S.stage}>
      <h1 style={S.h1}>Old Gen <span style={{ color: "var(--muted)" }}>vs</span> New Gen</h1>
      <p style={S.sub}>Each round pits a pre-2013 classic against a 2013-or-later title. {WAR_BUDGET} picks decide where your loyalty really lies — and your votes move the global tally.</p>
      <div style={S.warLegend}>
        <div style={S.warSide}><div style={{ ...S.warDot, background: "#5aa9ff" }} /><b>Old Gen</b><span style={S.warEx}>Naruto · Bleach · One Piece · DBZ · Death Note · the Big 3 era</span></div>
        <div style={S.warSide}><div style={{ ...S.warDot, background: "var(--accent)" }} /><b>New Gen</b><span style={S.warEx}>AoT · Demon Slayer · JJK · Chainsaw Man · Frieren · the modern boom</span></div>
      </div>
      <div style={S.controls}><button style={{ ...S.ghostBtn, fontSize: 16, padding: "14px 30px" }} onClick={start}>Start the war</button></div>
    </main>
  );

  if (done) {
    const pTotal = tally.old + tally.new || 1; const pNew = Math.round((tally.new / pTotal) * 100);
    const g = global || { old: 0, new: 0 }; const gTotal = g.old + g.new || 1; const gNew = Math.round((g.new / gTotal) * 100);
    const verdict = pNew >= 60 ? "New Gen loyalist" : pNew <= 40 ? "Old Gen at heart" : "Split down the middle";
    return (
      <main style={S.stage}>
        <h1 style={S.h1}>{verdict}</h1>
        <p style={S.sub}>You sided with New Gen {pNew}% of the time · Old Gen {100 - pNew}%</p>
        <div style={S.warBar}><div style={{ ...S.warFill, width: `${pNew}%`, background: "var(--accent)" }}>{pNew >= 18 ? `New ${pNew}%` : ""}</div><div style={{ ...S.warFillR, width: `${100 - pNew}%`, background: "#5aa9ff" }}>{100 - pNew >= 18 ? `Old ${100 - pNew}%` : ""}</div></div>
        <div style={S.warGlobal}>The internet so far: <b style={{ color: "var(--accent)" }}>New Gen {gNew}%</b> · <b style={{ color: "#5aa9ff" }}>Old Gen {100 - gNew}%</b> <span style={{ color: "var(--faint)" }}>({gTotal} votes)</span></div>
        <div style={S.controls}><button style={S.ghostBtn} onClick={start}>Go again</button></div>
      </main>
    );
  }

  return (
    <main style={S.stage}>
      <h1 style={S.h1}>Old Gen vs New Gen</h1>
      <p style={S.sub}>Pick the one you’d keep · arrow keys work too</p>
      <div style={S.progressOuter}><div style={{ ...S.progressInner, width: `${Math.round((count / WAR_BUDGET) * 100)}%` }} /><span style={S.progressLabel}>{count}/{WAR_BUDGET}</span></div>
      <div style={S.arena}>{pair && [pair[0], pair[1]].map((it, idx) => (
        <React.Fragment key={it.id}>
          <button onClick={() => choose(idx)} style={S.card} className="ar-card">
            <Cover item={it} className="ar-cover" /><div style={S.cardShade} />
            <div style={{ ...S.eraBadge, background: it.era === "new" ? "var(--accent)" : "#5aa9ff" }}>{it.era === "new" ? "NEW GEN" : "OLD GEN"}{it.year ? ` · ${it.year}` : ""}</div>
            <div style={S.cardName}>{it.title}</div>
          </button>
          {idx === 0 && <div style={S.vs}>VS</div>}
        </React.Fragment>))}
      </div>
    </main>
  );
}

// ---- styles ---------------------------------------------------------------
const CSS = `
:root{ --bg:#0b0b10; --panel:#15151d; --line:#23232e; --text:#f3f1f5; --muted:#9b98a8; --faint:#5b5868; --accent:#ff2e74; --up:#43e6a0; --down:#ff6b6b; }
*{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}
.ar-card{transition:transform .18s ease, box-shadow .18s ease, opacity .35s ease, filter .35s ease; user-select:none; -webkit-user-select:none; -moz-user-select:none;}
.ar-card:focus{outline:none;}
.ar-card:focus-visible{outline:2px solid var(--accent); outline-offset:2px;}
.ar-card:not(:disabled):hover{transform:translateY(-6px) scale(1.012); box-shadow:0 24px 60px -20px rgba(255,46,116,.45);}
.ar-card:not(:disabled):active{transform:scale(.99);}
.ar-cover{transition:transform .4s ease;}
.ar-card:not(:disabled):hover .ar-cover{transform:scale(1.04);}
.ar-chipbar::-webkit-scrollbar{height:0}
@media (max-width:760px){ .ar-arena{flex-direction:column;} }
@media (prefers-reduced-motion: reduce){ .ar-card,.ar-cover{transition:none!important} }
`;
const S = {
  root: { minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", paddingBottom: 70 },
  header: { display: "flex", alignItems: "center", gap: 16, padding: "18px 28px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "rgba(11,11,16,.85)", backdropFilter: "blur(10px)", zIndex: 5 },
  brand: { fontWeight: 800, letterSpacing: ".12em", fontSize: 18 }, brandMark: { color: "var(--accent)", marginRight: 6 },
  nav: { display: "flex", gap: 6, margin: "0 auto", background: "var(--panel)", padding: 5, borderRadius: 999, border: "1px solid var(--line)" },
  tab: { border: "none", background: "transparent", color: "var(--muted)", fontSize: 14, fontWeight: 600, padding: "8px 16px", borderRadius: 999, cursor: "pointer" },
  tabOn: { background: "var(--text)", color: "#0b0b10" },
  sourceTag: { fontSize: 11, color: "var(--faint)", fontFamily: "ui-monospace, monospace", letterSpacing: ".05em" },
  loading: { textAlign: "center", padding: 120, color: "var(--muted)" },

  chipBar: { display: "flex", gap: 8, overflowX: "auto", padding: "14px 28px", borderBottom: "1px solid var(--line)", scrollbarWidth: "none" },
  chip: { flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--muted)", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap" },
  chipOn: { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" },
  chipOff: { opacity: .35, cursor: "not-allowed" },
  chipCount: { fontSize: 11, fontFamily: "ui-monospace, monospace", opacity: .7 },

  stage: { maxWidth: 1040, margin: "0 auto", padding: "40px 24px 0", textAlign: "center" },
  h1: { fontSize: 46, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 8px" },
  sub: { color: "var(--muted)", fontSize: 14, margin: "0 auto 28px", maxWidth: 640 },
  arena: { display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  card: { position: "relative", width: 360, maxWidth: "42vw", aspectRatio: "3/4", borderRadius: 18, overflow: "hidden", border: "1px solid var(--line)", padding: 0, cursor: "pointer", background: "var(--panel)", color: "var(--text)" },
  cardDim: { opacity: .4, filter: "grayscale(.5)" }, cardWin: { boxShadow: "0 0 0 2px var(--up), 0 24px 60px -18px rgba(67,230,160,.5)" },
  cardShade: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,0) 45%)" },
  cardName: { position: "absolute", left: 18, right: 18, bottom: 16, textAlign: "left", fontSize: 22, fontWeight: 800, lineHeight: 1.1, textShadow: "0 2px 12px rgba(0,0,0,.6)" },
  eraBadge: { position: "absolute", top: 12, left: 12, fontSize: 10, fontWeight: 800, letterSpacing: ".06em", padding: "4px 9px", borderRadius: 999, color: "#fff" },
  revealWrap: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(8,8,12,.35)" },
  check: { width: 56, height: 56, borderRadius: "50%", background: "#fff", color: "#0b0b10", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, marginBottom: 14 },
  elo: { fontSize: 40, fontWeight: 800, fontFamily: "ui-monospace, monospace" }, eloLabel: { fontSize: 11, letterSpacing: ".25em", color: "var(--muted)", marginTop: 2 },
  vs: { width: 48, height: 48, flex: "0 0 auto", margin: "0 -10px", zIndex: 2, borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--line)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, letterSpacing: ".08em", color: "var(--muted)" },
  controls: { marginTop: 28 },
  ghostBtn: { background: "transparent", color: "var(--text)", border: "1px solid var(--line)", padding: "11px 22px", borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  tally: { marginTop: 18, fontSize: 12, color: "var(--faint)", fontFamily: "ui-monospace, monospace" },

  segWrap: { display: "inline-flex", gap: 4, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 999, padding: 4, marginBottom: 22 },
  seg: { border: "none", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, padding: "7px 20px", borderRadius: 999, cursor: "pointer" }, segOn: { background: "var(--text)", color: "#0b0b10" },

  boardWrap: { textAlign: "left", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" },
  boardRow: { display: "grid", gridTemplateColumns: "46px 52px 1fr auto 76px", alignItems: "center", gap: 14, padding: "10px 16px", borderBottom: "1px solid var(--line)" },
  boardRowTop: { background: "linear-gradient(90deg, rgba(255,46,116,.06), transparent)" },
  rank: { fontSize: 20, fontWeight: 800, textAlign: "center", fontFamily: "ui-monospace, monospace" },
  thumb: { width: 52, height: 52, borderRadius: 10, overflow: "hidden", flex: "0 0 auto" },
  boardName: { fontWeight: 700, fontSize: 15 }, boardStat: { fontSize: 12, fontFamily: "ui-monospace, monospace", textAlign: "right" },
  boardElo: { fontSize: 18, fontWeight: 800, textAlign: "right", fontFamily: "ui-monospace, monospace" },

  tierWrap: { display: "flex", flexDirection: "column", gap: 8, textAlign: "left" },
  tierRow: { display: "flex", alignItems: "stretch", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--panel)" },
  tierLabel: { width: 64, flex: "0 0 64px", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, color: "#0b0b10" },
  tierItems: { display: "flex", flexWrap: "wrap", gap: 8, padding: 10, flex: 1 },
  tierCard: { width: 64, height: 84, borderRadius: 8, overflow: "hidden", position: "relative", flex: "0 0 auto", border: "1px solid var(--line)" },
  tierCardName: { position: "absolute", left: 0, right: 0, bottom: 0, fontSize: 8, lineHeight: 1.05, padding: "8px 3px 3px", background: "linear-gradient(to top, rgba(0,0,0,.9), transparent)", fontWeight: 700 },

  poolRow: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" },
  poolBtn: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px 34px", cursor: "pointer", color: "var(--text)", minWidth: 150 },
  poolNum: { fontSize: 24, fontWeight: 800 }, poolMeta: { fontSize: 12, color: "var(--muted)", marginTop: 6, fontFamily: "ui-monospace, monospace" },

  progressOuter: { position: "relative", height: 14, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 999, overflow: "hidden", maxWidth: 520, margin: "0 auto 28px" },
  progressInner: { position: "absolute", top: 0, bottom: 0, left: 0, background: "linear-gradient(90deg, var(--accent), #ff7aa8)", transition: "width .3s ease" },
  progressLabel: { position: "absolute", right: 10, top: -1, fontSize: 10, fontWeight: 800, color: "var(--text)", lineHeight: "16px", fontFamily: "ui-monospace, monospace" },

  warLegend: { display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", marginBottom: 6 },
  warSide: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 22px", maxWidth: 280 },
  warDot: { width: 12, height: 12, borderRadius: "50%" },
  warEx: { fontSize: 11, color: "var(--muted)", textAlign: "center" },
  warBar: { display: "flex", height: 44, borderRadius: 12, overflow: "hidden", maxWidth: 560, margin: "0 auto 16px", border: "1px solid var(--line)" },
  warFill: { display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: 12, color: "#fff", fontWeight: 800, fontSize: 13, transition: "width .5s ease" },
  warFillR: { display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 12, color: "#fff", fontWeight: 800, fontSize: 13, transition: "width .5s ease" },
  warGlobal: { fontSize: 13, color: "var(--muted)", marginTop: 4 },
};
