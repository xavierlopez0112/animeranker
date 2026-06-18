import React, { useState, useEffect, useCallback } from "react";
import Cover from "./Cover.jsx";
import { S } from "../styles.js";

export default function Vote({ data, ratingOf, onVote }) {
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
