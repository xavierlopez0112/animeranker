import { useState, useEffect, useCallback } from "react";
import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";

/* =========================================================================
   AnimeRanker — app shell + routing.
   Routes:
     /            Home (hero landing + Current Top 5)
     /vote        endless head-to-head -> global ELO  (scoped by category)
     /leaderboard global ranking, list <-> tier view  (scoped by category)
     /quiz        bounded run -> personal tier list of all titles
     /war         Old Gen vs New Gen with a global tally
     /anime/:slug per-title detail page (rank / ELO / votes + nearby)

   Global board + Era War tally live in Supabase (server-side ELO via the
   cast_vote RPC); falls back to local storage if the backend is unreachable.
   ========================================================================= */

import { fetchAnime } from "./data/anilist.js";
import { FALLBACK } from "./data/fallback.js";
import { inCategory } from "./data/categories.js";
import { canonicalizeList } from "./lib/canon.js";
import { slug } from "./lib/slug.js";
import { START_ELO, K_GLOBAL, expected } from "./lib/elo.js";
import { loadKey, saveKey } from "./lib/storage.js";
import { supabase, hasBackend, voterToken, logEvent } from "./lib/supabase.js";
import { CSS, S } from "./styles.js";
import Home from "./components/Home.jsx";
import Vote from "./components/Vote.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Quiz from "./components/Quiz.jsx";
import EraWar from "./components/EraWar.jsx";
import AnimeDetail from "./components/AnimeDetail.jsx";
import ChipBar from "./components/ChipBar.jsx";

// Load the global board: from Supabase `ratings` if available, else local.
async function loadBoard() {
  if (hasBackend) {
    const { data, error } = await supabase.from("ratings").select("media_id, elo, wins, losses");
    if (!error && data) {
      const board = {};
      for (const r of data) board[r.media_id] = { elo: r.elo, w: r.wins, l: r.losses };
      return board;
    }
  }
  return loadKey("anime-elo-v3", {});
}

const NAV = [["/vote", "Vote"], ["/leaderboard", "Leaderboard"], ["/quiz", "Tier Quiz"], ["/war", "Era War"]];

export default function AnimeRanker() {
  const [cat, setCat] = useState("all");
  const [data, setData] = useState(null);
  const [board, setBoard] = useState({});
  const [source, setSource] = useState("loading");
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      const b = await loadBoard(); if (alive) setBoard(b);
      try {
        const live = canonicalizeList(await fetchAnime());
        if (alive && live.length) { setData(live); setSource("live"); return; }
        throw new Error("empty");
      } catch (_) {
        if (alive) { setData(canonicalizeList(FALLBACK)); setSource("fallback"); }
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => { logEvent("session_start"); }, []);

  const ratingOf = useCallback((it) => board[slug(it.title)]?.elo ?? START_ELO, [board]);

  const recordVote = useCallback((winner, loser, mode = "vote") => {
    const wk = slug(winner.title), lk = slug(loser.title);
    setBoard((prev) => {
      const next = { ...prev };
      const w = next[wk] || { elo: START_ELO, w: 0, l: 0 };
      const l = next[lk] || { elo: START_ELO, w: 0, l: 0 };
      const ew = expected(w.elo, l.elo);
      next[wk] = { elo: Math.round(w.elo + K_GLOBAL * (1 - ew)), w: w.w + 1, l: w.l };
      next[lk] = { elo: Math.round(l.elo + K_GLOBAL * (0 - (1 - ew))), w: l.w, l: l.l + 1 };
      if (!hasBackend) saveKey("anime-elo-v3", next);
      return next;
    });
    if (hasBackend) {
      supabase.rpc("cast_vote", { p_winner: wk, p_loser: lk, p_mode: mode, p_token: voterToken })
        .then(({ data: rows, error }) => {
          if (error) { console.warn("cast_vote failed:", error.message); return; }
          const r = rows && rows[0];
          if (r) setBoard((prev) => ({
            ...prev,
            [wk]: { ...(prev[wk] || { w: 0, l: 0 }), elo: r.winner_elo },
            [lk]: { ...(prev[lk] || { w: 0, l: 0 }), elo: r.loser_elo },
          }));
        });
    }
  }, []);

  const filtered = data ? (cat === "all" ? data : data.filter((d) => inCategory(d, cat))) : [];
  const scoped = ["/vote", "/leaderboard", "/quiz"].includes(location.pathname); // category bar

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <header style={S.header}>
        <Link to="/" style={{ ...S.brand, textDecoration: "none", color: "var(--text)" }}>
          <span style={S.brandMark}>◆</span> ANIME<span style={{ color: "var(--accent)" }}>RANKER</span>
        </Link>
        <nav style={S.nav}>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({ ...S.tab, ...(isActive ? S.tabOn : {}), textDecoration: "none" })}>{label}</NavLink>
          ))}
        </nav>
        <div style={S.sourceTag}>{source === "live" ? "live · anilist" : source === "fallback" ? "offline list" : "loading…"}</div>
      </header>

      {data && scoped && <ChipBar data={data} cat={cat} setCat={setCat} />}

      {!data && <div style={S.loading}>Loading the roster…</div>}
      {data && (
        <Routes>
          <Route path="/" element={<Home data={data} board={board} ratingOf={ratingOf} source={source} />} />
          <Route path="/vote" element={<Vote key={cat} data={filtered} ratingOf={ratingOf} onVote={recordVote} />} />
          <Route path="/leaderboard" element={<Leaderboard data={filtered} board={board} />} />
          <Route path="/quiz" element={<Quiz key={cat} data={filtered} ratingOf={ratingOf} onVote={recordVote} />} />
          <Route path="/war" element={<EraWar data={data} onVote={recordVote} />} />
          <Route path="/anime/:slug" element={<AnimeDetail data={data} board={board} ratingOf={ratingOf} />} />
          <Route path="*" element={<Home data={data} board={board} ratingOf={ratingOf} source={source} />} />
        </Routes>
      )}
    </div>
  );
}
