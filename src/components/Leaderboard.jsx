import { useState } from "react";
import { Link } from "react-router-dom";
import Cover from "./Cover.jsx";
import TierList from "./TierList.jsx";
import { S } from "../styles.js";
import { slug } from "../lib/slug.js";
import { START_ELO } from "../lib/elo.js";
import { assignTiers } from "../lib/tiers.js";

export default function Leaderboard({ data, board }) {
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
            <Link key={row.it.id} to={`/anime/${row.it.id}`} className="ar-row-link" style={{ ...S.boardRow, ...(i < 3 ? S.boardRowTop : {}), textDecoration: "none", color: "inherit" }}>
              <div style={{ ...S.rank, color: i === 0 ? "var(--accent)" : i < 3 ? "#fff" : "var(--muted)" }}>{i + 1}</div>
              <div style={S.thumb}><Cover item={row.it} /></div>
              <div style={S.boardName}>{row.it.title}</div>
              <div style={S.boardStat}>{row.games > 0 ? <span style={{ color: "var(--muted)" }}>{row.w}W · {row.l}L · {Math.round(row.wr * 100)}%</span> : <span style={{ color: "var(--faint)" }}>no votes yet</span>}</div>
              <div style={S.boardElo}>{row.elo}</div>
            </Link>
          ))}
        </div>
      )}
      {view === "tier" && <TierList tiers={assignTiers(rows.map((r) => r.it))} />}
    </main>
  );
}
