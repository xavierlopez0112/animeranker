import { useState } from "react";
import { Link } from "react-router-dom";
import Cover from "./Cover.jsx";
import { S } from "../styles.js";
import { logEvent } from "../lib/supabase.js";

const SITE = "https://animeranker.vercel.app";
const SHARE_TEXT = "Which anime is better? Vote head-to-head and settle Old Gen vs New Gen on AnimeRanker";

export default function Home({ data, ratingOf, source }) {
  const [note, setNote] = useState("");
  const top5 = [...data].sort((a, b) => ratingOf(b) - ratingOf(a)).slice(0, 5);
  const flash = (msg) => { setNote(msg); setTimeout(() => setNote(""), 2400); };

  const share = async (via) => {
    logEvent("share", { type: "site", via });
    if (via === "x") return void window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SITE)}`, "_blank", "noopener");
    if (via === "reddit") return void window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(SITE)}&title=${encodeURIComponent("AnimeRanker — which anime is better?")}`, "_blank", "noopener");
    if (via === "copy") { navigator.clipboard?.writeText(SITE); return flash("Link copied!"); }
    // TikTok / Instagram have no web share URL — use the native share sheet on
    // mobile (which lists them), else copy the link to paste into the app.
    const label = via === "tiktok" ? "TikTok" : "Instagram";
    if (navigator.share) { try { await navigator.share({ title: "AnimeRanker", text: SHARE_TEXT, url: SITE }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    navigator.clipboard?.writeText(SITE); flash(`Link copied — paste it into ${label}`);
  };

  return (
    <main style={S.homeWrap} className="ar-home">
      <section style={S.hero}>
        <h1 style={S.heroTitle}>Which anime is <span style={{ color: "var(--accent)" }}>better</span>?</h1>
        <p style={S.heroSub}>Vote head-to-head, build your tier list, and settle Old Gen vs New Gen — all feeding one live global leaderboard.</p>
        <div style={S.heroCtas}>
          <Link to="/vote" style={S.ctaPrimary} className="ar-cta">Start Voting</Link>
          <Link to="/leaderboard" style={S.ctaGhost} className="ar-ghost">View Rankings</Link>
        </div>
        <div style={S.heroStatus}>
          {source === "live"
            ? <><span className="ar-livedot" /> Live Anime Rankings · {data.length} titles</>
            : <><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--faint)", display: "inline-block" }} /> Offline · {data.length} titles</>}
        </div>
      </section>

      <aside style={S.top5Card}>
        <div style={S.top5Head}><span>Current Top 5</span><Link to="/leaderboard" style={S.top5View}>View All →</Link></div>
        {top5.map((it, i) => (
          <Link key={it.id} to={`/anime/${it.id}`} style={S.top5Row} className="ar-row-link">
            <div style={{ ...S.top5Rank, color: i === 0 ? "var(--accent)" : i < 3 ? "var(--text)" : "var(--muted)" }}>{i + 1}</div>
            <div style={S.top5Thumb}><Cover item={it} /></div>
            <div style={S.top5Name}>{it.title}</div>
            <div style={S.top5Elo}>{ratingOf(it)}</div>
          </Link>
        ))}
        <div style={S.shareRow}>
          <button style={S.shareBtn} onClick={() => share("x")}>X</button>
          <button style={S.shareBtn} onClick={() => share("reddit")}>Reddit</button>
          <button style={S.shareBtn} onClick={() => share("tiktok")}>TikTok</button>
          <button style={S.shareBtn} onClick={() => share("instagram")}>Instagram</button>
          <button style={S.shareBtn} onClick={() => share("copy")}>Copy</button>
        </div>
        {note && <div style={S.shareNote}>{note}</div>}
      </aside>
    </main>
  );
}
