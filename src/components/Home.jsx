import { useState } from "react";
import { Link } from "react-router-dom";
import Cover from "./Cover.jsx";
import { S } from "../styles.js";
import { logEvent } from "../lib/supabase.js";

const SITE = "https://animeranker.vercel.app";
const SHARE_TEXT = "Which anime is better? Vote head-to-head and settle Old Gen vs New Gen on AnimeRanker";

export default function Home({ data, ratingOf, source }) {
  const [copied, setCopied] = useState(false);
  const top5 = [...data].sort((a, b) => ratingOf(b) - ratingOf(a)).slice(0, 5);

  const share = (via) => {
    if (via === "x") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SITE)}`, "_blank", "noopener");
    else if (via === "reddit") window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(SITE)}&title=${encodeURIComponent("AnimeRanker — which anime is better?")}`, "_blank", "noopener");
    else if (via === "copy") { navigator.clipboard?.writeText(SITE); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    logEvent("share", { type: "site", via });
  };

  return (
    <main style={S.homeWrap} className="ar-home">
      <section style={S.hero}>
        <div style={S.heroEyebrow}>LIVE ANIME RANKINGS</div>
        <h1 style={S.heroTitle}>Which anime is <span style={{ color: "var(--accent)" }}>better</span>?</h1>
        <p style={S.heroSub}>Vote head-to-head, build your tier list, and settle Old Gen vs New Gen — all feeding one live global leaderboard.</p>
        <div style={S.heroCtas}>
          <Link to="/vote" style={S.ctaPrimary} className="ar-cta">Start Voting</Link>
          <Link to="/leaderboard" style={S.ctaGhost} className="ar-ghost">View Rankings</Link>
        </div>
        <div style={S.heroStatus}>{source === "live" ? "live · anilist" : "offline list"} · {data.length} titles</div>
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
          <button style={S.shareBtn} onClick={() => share("x")}>Share on X</button>
          <button style={S.shareBtn} onClick={() => share("reddit")}>Reddit</button>
          <button style={S.shareBtn} onClick={() => share("copy")}>{copied ? "Copied!" : "Copy link"}</button>
        </div>
      </aside>
    </main>
  );
}
