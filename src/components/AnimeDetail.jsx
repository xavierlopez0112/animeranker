import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Cover from "./Cover.jsx";
import { S } from "../styles.js";
import { START_ELO } from "../lib/elo.js";
import { fetchDescription } from "../data/anilist.js";

const GENRE_LABEL = { sliceoflife: "Slice of Life", scifi: "Sci-Fi", action: "Action", fantasy: "Fantasy", romance: "Romance", mecha: "Mecha", sports: "Sports", horror: "Horror", psychological: "Psychological", thriller: "Thriller", supernatural: "Supernatural", mystery: "Mystery", drama: "Drama", comedy: "Comedy", adventure: "Adventure", music: "Music", isekai: "Isekai" };
const DEMO_LABEL = { shonen: "Shonen", seinen: "Seinen", shojo: "Shoujo", josei: "Josei", kids: "Kids" };
const prettyGenre = (g) => GENRE_LABEL[g] || (g.charAt(0).toUpperCase() + g.slice(1));

function Stat({ label, value, accent }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statValue, ...(accent ? { color: "var(--accent)" } : {}) }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

// Similar = most shared genres first, then global ELO; backfill by demo then era.
function similarShows(it, data, ratingOf) {
  const others = data.filter((d) => d.id !== it.id);
  const gset = new Set(it.genres || []);
  const byElo = (arr) => [...arr].sort((a, b) => ratingOf(b) - ratingOf(a));
  const scored = others
    .map((d) => ({ d, shared: (d.genres || []).filter((g) => gset.has(g)).length }))
    .filter((s) => s.shared > 0)
    .sort((a, b) => b.shared - a.shared || ratingOf(b.d) - ratingOf(a.d));
  const out = scored.slice(0, 6).map((s) => s.d);
  const have = new Set(out.map((d) => d.id));
  const add = (arr) => { for (const d of arr) { if (out.length >= 6) break; if (!have.has(d.id)) { out.push(d); have.add(d.id); } } };
  if (out.length < 4 && it.demo) add(byElo(others.filter((d) => d.demo === it.demo)));
  if (out.length < 4) add(byElo(others.filter((d) => d.era === it.era)));
  return out;
}

export default function AnimeDetail({ data, board, ratingOf }) {
  const { slug: slugParam } = useParams();
  const sorted = [...data].sort((a, b) => ratingOf(b) - ratingOf(a));
  const idx = sorted.findIndex((d) => d.id === slugParam);
  const it = idx >= 0 ? sorted[idx] : null;

  const [desc, setDesc] = useState(null); // null = loading, "" = none
  useEffect(() => {
    if (!it) return;
    let alive = true;
    setDesc(null);
    fetchDescription(it.anilist_id).then((t) => { if (alive) setDesc(t); });
    return () => { alive = false; };
  }, [it && it.id, it && it.anilist_id]);

  if (!it) return (
    <main style={S.stage}>
      <h1 style={S.h1}>Title not found</h1>
      <p style={S.sub}>No anime matches this link — it may have left the catalog.</p>
      <div style={S.controls}><Link to="/leaderboard" style={S.ctaGhost} className="ar-ghost">Browse the leaderboard</Link></div>
    </main>
  );

  const rec = board[it.id] || { elo: START_ELO, w: 0, l: 0 };
  const games = rec.w + rec.l;
  const rankBy = new Map(sorted.map((d, i) => [d.id, i + 1]));
  const similar = similarShows(it, data, ratingOf);

  return (
    <main style={S.detailWrap}>
      <div className="ar-detail-top">
        <div style={S.detailCover} className="ar-detail-cover"><Cover item={it} /></div>

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

        <aside style={S.infoPanel}>
          <div style={S.infoEyebrow}>ABOUT</div>
          {desc === null
            ? <p style={S.infoDescMuted}>Loading description…</p>
            : desc
              ? <p style={S.infoDesc}>{desc}</p>
              : <p style={S.infoDescMuted}>No description available yet.</p>}
          <div style={S.infoDivider} />
          <div style={S.infoRow}><span style={S.infoLabel}>YEAR</span><span style={S.infoValueMono}>{it.year ?? "—"}</span></div>
          <div style={S.infoRow}><span style={S.infoLabel}>ERA</span><span style={{ ...S.infoValue, color: it.era === "new" ? "var(--accent)" : "#5aa9ff" }}>{it.era === "new" ? "New Gen" : "Old Gen"}</span></div>
          <div style={S.infoRow}><span style={S.infoLabel}>DEMOGRAPHIC</span><span style={S.infoValue}>{it.demo ? DEMO_LABEL[it.demo] || it.demo : "—"}</span></div>
          <div style={S.infoRow}>
            <span style={S.infoLabel}>GENRES</span>
            <span style={S.genreChips}>{(it.genres || []).length ? it.genres.map((g) => <span key={g} style={S.genreChip}>{prettyGenre(g)}</span>) : <span style={S.infoValue}>—</span>}</span>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <>
          <h2 style={S.nearbyHead}>SIMILAR SHOWS</h2>
          <div style={S.nearbyRow}>
            {similar.map((n) => (
              <Link key={n.id} to={`/anime/${n.id}`} style={S.nearbyCard} className="ar-card-link" onClick={() => window.scrollTo(0, 0)}>
                <div style={S.nearbyRank}>#{rankBy.get(n.id)}</div>
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
