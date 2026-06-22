import React, { useState, useEffect, useCallback } from "react";
import Cover from "./Cover.jsx";
import { S } from "../styles.js";
import { shareMatchup } from "../lib/shareCard.js";
import { logEvent } from "../lib/supabase.js";

const K = 4; // smoothing prior so thin data shows ~50%, not 100/0
function winRate(s) { const w = (s && s.w) || 0, l = (s && s.l) || 0; return Math.round(100 * (w + K) / (w + l + 2 * K)); }

export default function Vote({ data, boardOf, onVote, totalVotes }) {
  const enough = data.length >= 2;
  const [pair, setPair] = useState(() => randomPair(data));
  const [reveal, setReveal] = useState(null);
  const [sharing, setSharing] = useState(false);

  const next = useCallback(() => { setReveal(null); setPair(randomPair(data)); }, [data]);
  const vote = useCallback((idx) => { if (reveal || !pair[idx]) return; onVote(pair[idx], pair[1 - idx]); setReveal({ winner: idx }); }, [pair, reveal, onVote]);

  // No auto-advance: a tap or key press moves on, so people can read/screenshot.
  useEffect(() => {
    const h = (e) => {
      if (reveal) { if ([" ", "Enter", "ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); next(); } return; }
      if (e.key === "ArrowLeft") vote(0); else if (e.key === "ArrowRight") vote(1); else if (e.key === " ") { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [vote, next, reveal]);

  const shareThis = useCallback(async (e) => {
    e.stopPropagation();
    if (sharing || !pair[0] || !pair[1]) return;
    setSharing(true);
    try {
      await shareMatchup({ a: pair[0], b: pair[1], aPct: winRate(boardOf(pair[0])), bPct: winRate(boardOf(pair[1])) });
      logEvent("share", { type: "matchup" });
    } finally { setSharing(false); }
  }, [pair, boardOf, sharing]);

  if (!enough) return <main style={S.stage}><h1 style={S.h1}>Not enough titles</h1><p style={S.sub}>This category needs at least two titles to match up. Pick another.</p></main>;

  return (
    <main style={S.stage} onClick={() => { if (reveal) next(); }}>
      <h1 style={S.h1}>Which one’s better?</h1>
      <p style={S.sub}>{reveal ? "Tap anywhere to continue" : "Click to vote · arrow keys to choose · space to skip"}</p>
      <div style={S.arena}>
        {pair.map((it, idx) => {
          const wr = winRate(boardOf(it)); const won = reveal && reveal.winner === idx; const lost = reveal && reveal.winner !== idx;
          return (<React.Fragment key={it.id}>
            <button onClick={(e) => { if (reveal) { e.stopPropagation(); next(); } else vote(idx); }} style={{ ...S.card, ...(lost ? S.cardDim : {}), ...(won ? S.cardWin : {}) }} className="ar-card">
              <Cover item={it} className="ar-cover" /><div style={S.cardShade} /><div style={S.cardName}>{it.title}</div>
              {reveal && (<div style={S.revealWrap}>{won && <div style={S.check}>✓</div>}<div style={{ ...S.elo, color: won ? "var(--up)" : "var(--down)" }}>{wr}%</div><div style={S.eloLabel}>WIN RATE</div></div>)}
            </button>
            {idx === 0 && <div style={S.vs}>VS</div>}
          </React.Fragment>);
        })}
      </div>
      <div style={S.controls}>
        {reveal ? (
          <>
            <button style={S.ghostBtn} onClick={shareThis} disabled={sharing}>{sharing ? "Generating…" : "Share this matchup"}</button>
            <button style={{ ...S.ghostBtn, marginLeft: 10 }} onClick={(e) => { e.stopPropagation(); next(); }}>Next matchup →</button>
          </>
        ) : (
          <button style={S.ghostBtn} onClick={(e) => { e.stopPropagation(); next(); }}>Skip this matchup</button>
        )}
      </div>
      <div style={S.tally}>{(totalVotes || 0).toLocaleString()} votes cast</div>
    </main>
  );
}

function randomPair(data) {
  if (data.length < 2) return [data[0], data[0]].filter(Boolean);
  const a = Math.floor(Math.random() * data.length); let b = Math.floor(Math.random() * data.length);
  while (b === a) b = Math.floor(Math.random() * data.length);
  return [data[a], data[b]];
}
