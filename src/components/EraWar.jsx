import React, { useState, useEffect, useRef, useCallback } from "react";
import Cover from "./Cover.jsx";
import { S } from "../styles.js";
import { loadKey, saveKey } from "../lib/storage.js";
import { supabase, hasBackend, logEvent } from "../lib/supabase.js";
import { shareEraVerdict } from "../lib/shareCard.js";

const WAR_BUDGET = 12;

export default function EraWar({ data, onVote }) {
  const oldPool = data.filter((d) => d.era === "old");
  const newPool = data.filter((d) => d.era === "new");
  const eraRef = useRef({ old: 0, new: 0 }); // local fallback tally (no backend)
  const [started, setStarted] = useState(false);
  const [pair, setPair] = useState(null);
  const [count, setCount] = useState(0);
  const [tally, setTally] = useState({ old: 0, new: 0 });
  const [global, setGlobal] = useState(null);
  const [done, setDone] = useState(false);
  const [sharing, setSharing] = useState(false);

  const shareVerdict = async () => {
    if (sharing) return;
    const pT = tally.old + tally.new || 1; const pNew = Math.round((tally.new / pT) * 100);
    const g = global || { old: 0, new: 0 }; const gT = g.old + g.new || 1; const gNew = Math.round((g.new / gT) * 100);
    const verdict = pNew >= 60 ? "New Gen loyalist" : pNew <= 40 ? "Old Gen at heart" : "Split down the middle";
    setSharing(true);
    try {
      await shareEraVerdict({ verdict, pNew, gNew, gTotal: gT });
      logEvent("share", { type: "era", verdict });
    } finally { setSharing(false); }
  };

  useEffect(() => { if (!hasBackend) (async () => { eraRef.current = await loadKey("anime-era-v1", { old: 0, new: 0 }); })(); }, []);

  const draw = useCallback(() => {
    const o = oldPool[Math.floor(Math.random() * oldPool.length)];
    const n = newPool[Math.floor(Math.random() * newPool.length)];
    return Math.random() < 0.5 ? [o, n] : [n, o];
  }, [oldPool, newPool]);
  const start = () => { setStarted(true); setCount(0); setTally({ old: 0, new: 0 }); setDone(false); setPair(draw()); };

  // fetch the shared global tally (Supabase era_tally view), else the local one
  const fetchGlobal = useCallback(async () => {
    if (hasBackend) {
      const { data: t, error } = await supabase.from("era_tally").select("*").single();
      if (!error && t) return { old: t.old, new: t.new };
    }
    return { ...eraRef.current };
  }, []);

  const choose = useCallback(async (idx) => {
    if (!pair) return; const chosen = pair[idx], other = pair[1 - idx]; const isNew = chosen.era === "new";
    onVote(chosen, other, "era"); // logs an era-mode vote (server-side or local)
    setTally((t) => (isNew ? { ...t, new: t.new + 1 } : { ...t, old: t.old + 1 }));
    if (!hasBackend) {
      eraRef.current = { ...eraRef.current, [isNew ? "new" : "old"]: eraRef.current[isNew ? "new" : "old"] + 1 };
      saveKey("anime-era-v1", eraRef.current);
    }
    const c = count + 1; setCount(c);
    if (c >= WAR_BUDGET) { logEvent("era_complete", { picks: c }); setGlobal(await fetchGlobal()); setDone(true); setPair(null); } else setPair(draw());
  }, [pair, count, onVote, draw, fetchGlobal]);
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
        <div style={S.controls}>
          <button style={S.ghostBtn} onClick={shareVerdict} disabled={sharing}>{sharing ? "Generating…" : "Share my verdict"}</button>
          <button style={{ ...S.ghostBtn, marginLeft: 10 }} onClick={start}>Go again</button>
        </div>
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
