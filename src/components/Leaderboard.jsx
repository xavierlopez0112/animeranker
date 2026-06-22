import { useState } from "react";
import { Link } from "react-router-dom";
import Cover from "./Cover.jsx";
import TierList from "./TierList.jsx";
import { S } from "../styles.js";
import { slug } from "../lib/slug.js";
import { START_ELO } from "../lib/elo.js";
import { assignTiers } from "../lib/tiers.js";

const PER_PAGE = 100;

export default function Leaderboard({ data, board }) {
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const rows = data.map((it) => { const rec = board[slug(it.title)] || { elo: START_ELO, w: 0, l: 0 }; const games = rec.w + rec.l; return { it, elo: rec.elo, w: rec.w, l: rec.l, games, wr: games ? rec.w / games : null }; }).sort((a, b) => b.elo - a.elo);
  if (data.length < 1) return <main style={S.stage}><h1 style={S.h1}>Nothing here yet</h1><p style={S.sub}>No titles in this category. Pick another.</p></main>;

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const curPage = Math.min(page, totalPages);
  const startIdx = (curPage - 1) * PER_PAGE;
  const pageRows = rows.slice(startIdx, startIdx + PER_PAGE);
  const goTo = (p) => { setPage(p); window.scrollTo(0, 0); };

  return (
    <main style={S.stage}>
      <h1 style={S.h1}>Leaderboard</h1>
      <p style={S.sub}>Global ELO · updates as everyone votes</p>
      <div style={S.segWrap}>
        <button style={{ ...S.seg, ...(view === "list" ? S.segOn : {}) }} onClick={() => setView("list")}>List</button>
        <button style={{ ...S.seg, ...(view === "tier" ? S.segOn : {}) }} onClick={() => setView("tier")}>Tiers</button>
      </div>
      {view === "list" && (
        <>
          <div style={S.boardWrap}>
            {pageRows.map((row, i) => {
              const rank = startIdx + i; // 0-based absolute rank
              return (
                <Link key={row.it.id} to={`/anime/${row.it.id}`} className="ar-row-link" style={{ ...S.boardRow, ...(rank < 3 ? S.boardRowTop : {}), textDecoration: "none", color: "inherit" }}>
                  <div style={{ ...S.rank, color: rank === 0 ? "var(--accent)" : rank < 3 ? "#fff" : "var(--muted)" }}>{rank + 1}</div>
                  <div style={S.thumb}><Cover item={row.it} /></div>
                  <div style={S.boardName}>{row.it.title}</div>
                  <div style={S.boardStat}>{row.games > 0 ? <span style={{ color: "var(--muted)" }}>{row.w}W · {row.l}L · {Math.round(row.wr * 100)}%</span> : <span style={{ color: "var(--faint)" }}>no votes yet</span>}</div>
                  <div style={S.boardElo}>{row.elo}</div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div style={S.pagerWrap}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => goTo(p)} style={{ ...S.pagerBtn, ...(p === curPage ? S.pagerBtnOn : {}) }}>{p}</button>
              ))}
              <button onClick={() => curPage < totalPages && goTo(curPage + 1)} disabled={curPage >= totalPages} style={{ ...S.pagerNext, ...(curPage >= totalPages ? S.pagerDisabled : {}) }}>Next →</button>
            </div>
          )}
        </>
      )}
      {view === "tier" && <TierList tiers={assignTiers(rows.map((r) => r.it))} />}
    </main>
  );
}
