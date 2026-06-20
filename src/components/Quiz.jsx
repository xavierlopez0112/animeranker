import React, { useState, useEffect, useRef, useCallback } from "react";
import Cover from "./Cover.jsx";
import TierList from "./TierList.jsx";
import { S } from "../styles.js";
import { slug } from "../lib/slug.js";
import { expected, K_LOCAL } from "../lib/elo.js";
import { assignTiers } from "../lib/tiers.js";
import { DEPTHS } from "../lib/quiz.js";

export default function Quiz({ data, ratingOf, onVote }) {
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
    onVote(winner, loser, "quiz"); s.count += 1; setCount(s.count);
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
