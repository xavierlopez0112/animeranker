import { useParams, Link } from "react-router-dom";
import Cover from "./Cover.jsx";
import { S } from "../styles.js";
import { START_ELO } from "../lib/elo.js";

function Stat({ label, value, accent }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statValue, ...(accent ? { color: "var(--accent)" } : {}) }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

export default function AnimeDetail({ data, board, ratingOf }) {
  const { slug: slugParam } = useParams();
  const sorted = [...data].sort((a, b) => ratingOf(b) - ratingOf(a));
  const idx = sorted.findIndex((d) => d.id === slugParam);

  if (idx < 0) return (
    <main style={S.stage}>
      <h1 style={S.h1}>Title not found</h1>
      <p style={S.sub}>No anime matches this link — it may have left the catalog.</p>
      <div style={S.controls}><Link to="/leaderboard" style={S.ctaGhost} className="ar-ghost">Browse the leaderboard</Link></div>
    </main>
  );

  const it = sorted[idx];
  const rec = board[it.id] || { elo: START_ELO, w: 0, l: 0 };
  const games = rec.w + rec.l;
  const nearby = [];
  for (let d = -2; d <= 2; d++) { if (d === 0) continue; const n = sorted[idx + d]; if (n) nearby.push({ pos: idx + d + 1, it: n }); }

  return (
    <main style={S.detailWrap}>
      <div className="ar-detail-top">
        <div style={S.detailCover}><Cover item={it} /></div>
        <div>
          <div style={{ ...S.detailEra, color: it.era === "new" ? "var(--accent)" : "#5aa9ff" }}>
            {it.era === "new" ? "NEW GEN" : "OLD GEN"}{it.year ? ` · ${it.year}` : ""}
          </div>
          <h1 style={S.detailTitle}>{it.title}</h1>
          <div style={S.statRow}>
            <Stat label="RANK" value={`#${idx + 1}`} />
            <Stat label="ELO" value={rec.elo} accent />
            <Stat label="VOTES" value={games} />
          </div>
          <div style={S.controls}><Link to="/vote" style={S.ctaPrimary} className="ar-cta">Vote on matchups</Link></div>
          {games === 0 && <p style={{ ...S.sub, marginTop: 16, textAlign: "left" }}>No votes yet — seeded at {START_ELO}. Be the first to rank it.</p>}
        </div>
      </div>

      {nearby.length > 0 && (
        <>
          <h2 style={S.nearbyHead}>NEARBY RANKINGS</h2>
          <div style={S.nearbyRow}>
            {nearby.map(({ pos, it: n }) => (
              <Link key={n.id} to={`/anime/${n.id}`} style={S.nearbyCard} className="ar-card-link" onClick={() => window.scrollTo(0, 0)}>
                <div style={S.nearbyRank}>#{pos}</div>
                <div style={S.nearbyThumb}><Cover item={n} /></div>
                <div style={S.nearbyName}>{n.title}</div>
                <div style={S.nearbyElo}>{ratingOf(n)}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
