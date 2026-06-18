import { useState, useEffect, useCallback } from "react";

/* =========================================================================
   AnimeRanker  (v3 — categories + Era War)
   Modes:
     Vote        endless head-to-head -> global ELO  (scoped by category)
     Leaderboard global ranking, list <-> tier view  (scoped by category)
     Tier Quiz   short bounded run -> personal tier list (scoped by category)
     Era War     Old Gen vs New Gen cross-era quiz with a global tally
   Categories scope the first three modes: All / Old Gen / New Gen / Shonen /
     Seinen / Isekai / Fantasy / Action / Romance / Slice of Life /
     Sci-Fi & Mecha / Sports / Dark & Psych.
   Data: AniList GraphQL (top ~100), falls back to a baked-in tagged list.

   This file is the app shell; the pieces live in:
     data/   anilist, fallback, categories
     lib/    elo, tiers, storage, slug, quiz
     components/ Cover, ChipBar, Vote, Leaderboard, TierList, Quiz, EraWar
     styles.js — shared tokens (CSS) + inline style objects (S)
   ========================================================================= */

import { fetchAnime } from "./data/anilist.js";
import { FALLBACK } from "./data/fallback.js";
import { inCategory } from "./data/categories.js";
import { slug } from "./lib/slug.js";
import { START_ELO, K_GLOBAL, expected } from "./lib/elo.js";
import { loadKey, saveKey } from "./lib/storage.js";
import { CSS, S } from "./styles.js";
import Vote from "./components/Vote.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Quiz from "./components/Quiz.jsx";
import EraWar from "./components/EraWar.jsx";
import ChipBar from "./components/ChipBar.jsx";

export default function AnimeRanker() {
  const [tab, setTab] = useState("vote");
  const [cat, setCat] = useState("all");
  const [data, setData] = useState(null);
  const [board, setBoard] = useState({});
  const [source, setSource] = useState("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      const b = await loadKey("anime-elo-v3", {}); if (alive) setBoard(b);
      try { const live = await fetchAnime(); if (alive && live && live.length) { setData(live); setSource("live"); return; } throw new Error("empty"); }
      catch (_) { if (alive) { setData(FALLBACK); setSource("fallback"); } }
    })();
    return () => { alive = false; };
  }, []);

  const ratingOf = useCallback((it) => board[slug(it.title)]?.elo ?? START_ELO, [board]);
  const recordVote = useCallback((winner, loser) => {
    setBoard((prev) => {
      const next = { ...prev }; const wk = slug(winner.title), lk = slug(loser.title);
      const w = next[wk] || { elo: START_ELO, w: 0, l: 0 }; const l = next[lk] || { elo: START_ELO, w: 0, l: 0 };
      const ew = expected(w.elo, l.elo);
      next[wk] = { elo: Math.round(w.elo + K_GLOBAL * (1 - ew)), w: w.w + 1, l: w.l };
      next[lk] = { elo: Math.round(l.elo + K_GLOBAL * (0 - (1 - ew))), w: l.w, l: l.l + 1 };
      saveKey("anime-elo-v3", next); return next;
    });
  }, []);

  const filtered = data ? (cat === "all" ? data : data.filter((d) => inCategory(d, cat))) : [];
  const scoped = tab !== "war"; // category bar shows for vote/board/quiz

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <header style={S.header}>
        <div style={S.brand}><span style={S.brandMark}>◆</span> ANIME<span style={{ color: "var(--accent)" }}>RANKER</span></div>
        <nav style={S.nav}>
          {[["vote", "Vote"], ["board", "Leaderboard"], ["quiz", "Tier Quiz"], ["war", "Era War"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...S.tab, ...(tab === k ? S.tabOn : {}) }}>{label}</button>
          ))}
        </nav>
        <div style={S.sourceTag}>{source === "live" ? "live · anilist" : source === "fallback" ? "offline list" : "loading…"}</div>
      </header>

      {data && scoped && <ChipBar data={data} cat={cat} setCat={setCat} />}

      {!data && <div style={S.loading}>Loading the roster…</div>}
      {data && tab === "vote" && <Vote key={cat} data={filtered} ratingOf={ratingOf} onVote={recordVote} />}
      {data && tab === "board" && <Leaderboard data={filtered} board={board} />}
      {data && tab === "quiz" && <Quiz key={cat} data={filtered} ratingOf={ratingOf} onVote={recordVote} />}
      {data && tab === "war" && <EraWar data={data} onVote={recordVote} />}
    </div>
  );
}
