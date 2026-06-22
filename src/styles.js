// ---- styles ---------------------------------------------------------------
// Shared design tokens + inline style objects for every AnimeRanker screen.
// Tokens are defined on :root in CSS; components reference S.* / className hooks.
export const CSS = `
:root{ --bg:#0b0b10; --panel:#15151d; --line:#23232e; --text:#f3f1f5; --muted:#9b98a8; --faint:#5b5868; --accent:#ff2e74; --up:#43e6a0; --down:#ff6b6b; }
*{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}
.ar-card{transition:transform .18s ease, box-shadow .18s ease, opacity .35s ease, filter .35s ease; user-select:none; -webkit-user-select:none; -moz-user-select:none;}
.ar-card:focus{outline:none;}
.ar-card:focus-visible{outline:2px solid var(--accent); outline-offset:2px;}
.ar-card:not(:disabled):hover{transform:translateY(-6px) scale(1.012); box-shadow:0 24px 60px -20px rgba(255,46,116,.45);}
.ar-card:not(:disabled):active{transform:scale(.99);}
.ar-cover{transition:transform .4s ease;}
.ar-card:not(:disabled):hover .ar-cover{transform:scale(1.04);}
.ar-chipbar::-webkit-scrollbar{height:0}
@media (max-width:760px){ .ar-arena{flex-direction:column;} }
@media (prefers-reduced-motion: reduce){ .ar-card,.ar-cover{transition:none!important} }
.ar-home{display:grid; grid-template-columns:1.25fr .9fr; gap:44px; align-items:start;}
@media (max-width:880px){ .ar-home{grid-template-columns:1fr;} }
.ar-detail-top{display:grid; grid-template-columns:280px minmax(0,1fr) 340px; gap:32px; align-items:start;}
@media (max-width:980px){ .ar-detail-top{grid-template-columns:1fr;} .ar-detail-cover{max-width:300px;} }
.ar-row-link{transition:background .15s ease;}
.ar-row-link:hover{background:rgba(255,255,255,.05);}
.ar-card-link{transition:transform .15s ease, border-color .15s ease;}
.ar-card-link:hover{transform:translateY(-3px); border-color:var(--accent);}
.ar-cta:hover{filter:brightness(1.08);}
.ar-ghost:hover{border-color:var(--muted);}
.ar-livedot{width:8px; height:8px; border-radius:50%; background:var(--up); display:inline-block; box-shadow:0 0 0 0 rgba(67,230,160,.55); animation:ar-pulse 1.6s ease-out infinite;}
@keyframes ar-pulse{0%{box-shadow:0 0 0 0 rgba(67,230,160,.55);} 70%{box-shadow:0 0 0 7px rgba(67,230,160,0);} 100%{box-shadow:0 0 0 0 rgba(67,230,160,0);}}
@media (prefers-reduced-motion: reduce){ .ar-livedot{animation:none;} }
`;

export const S = {
  root: { minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", paddingBottom: 70 },
  header: { display: "flex", alignItems: "center", gap: 16, padding: "18px 28px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "rgba(11,11,16,.85)", backdropFilter: "blur(10px)", zIndex: 5 },
  brand: { fontWeight: 800, letterSpacing: ".12em", fontSize: 18 }, brandMark: { color: "var(--accent)", marginRight: 6 },
  nav: { display: "flex", gap: 6, margin: "0 auto", background: "var(--panel)", padding: 5, borderRadius: 999, border: "1px solid var(--line)" },
  tab: { border: "none", background: "transparent", color: "var(--muted)", fontSize: 14, fontWeight: 600, padding: "8px 16px", borderRadius: 999, cursor: "pointer" },
  tabOn: { background: "var(--text)", color: "#0b0b10" },
  sourceTag: { fontSize: 11, color: "var(--faint)", fontFamily: "ui-monospace, monospace", letterSpacing: ".05em" },
  loading: { textAlign: "center", padding: 120, color: "var(--muted)" },

  chipBar: { display: "flex", gap: 8, overflowX: "auto", padding: "14px 28px", borderBottom: "1px solid var(--line)", scrollbarWidth: "none" },
  chip: { flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--muted)", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap" },
  chipOn: { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" },
  chipOff: { opacity: .35, cursor: "not-allowed" },
  chipCount: { fontSize: 11, fontFamily: "ui-monospace, monospace", opacity: .7 },

  stage: { maxWidth: 1040, margin: "0 auto", padding: "40px 24px 0", textAlign: "center" },
  h1: { fontSize: 46, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 8px" },
  sub: { color: "var(--muted)", fontSize: 14, margin: "0 auto 28px", maxWidth: 640 },
  arena: { display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  card: { position: "relative", width: 360, maxWidth: "42vw", aspectRatio: "3/4", borderRadius: 18, overflow: "hidden", border: "1px solid var(--line)", padding: 0, cursor: "pointer", background: "var(--panel)", color: "var(--text)" },
  cardDim: { opacity: .4, filter: "grayscale(.5)" }, cardWin: { boxShadow: "0 0 0 2px var(--up), 0 24px 60px -18px rgba(67,230,160,.5)" },
  cardShade: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,0) 45%)" },
  cardName: { position: "absolute", left: 18, right: 18, bottom: 16, textAlign: "left", fontSize: 22, fontWeight: 800, lineHeight: 1.1, textShadow: "0 2px 12px rgba(0,0,0,.6)" },
  eraBadge: { position: "absolute", top: 12, left: 12, fontSize: 10, fontWeight: 800, letterSpacing: ".06em", padding: "4px 9px", borderRadius: 999, color: "#fff" },
  revealWrap: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(8,8,12,.35)" },
  check: { width: 56, height: 56, borderRadius: "50%", background: "#fff", color: "#0b0b10", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, marginBottom: 14 },
  elo: { fontSize: 40, fontWeight: 800, fontFamily: "ui-monospace, monospace" }, eloLabel: { fontSize: 11, letterSpacing: ".25em", color: "var(--muted)", marginTop: 2 },
  vs: { width: 48, height: 48, flex: "0 0 auto", margin: "0 -10px", zIndex: 2, borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--line)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, letterSpacing: ".08em", color: "var(--muted)" },
  controls: { marginTop: 28 },
  ghostBtn: { background: "transparent", color: "var(--text)", border: "1px solid var(--line)", padding: "11px 22px", borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  tally: { marginTop: 18, fontSize: 12, color: "var(--faint)", fontFamily: "ui-monospace, monospace" },

  segWrap: { display: "inline-flex", gap: 4, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 999, padding: 4, marginBottom: 22 },
  seg: { border: "none", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, padding: "7px 20px", borderRadius: 999, cursor: "pointer" }, segOn: { background: "var(--text)", color: "#0b0b10" },

  boardWrap: { textAlign: "left", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" },
  boardRow: { display: "grid", gridTemplateColumns: "46px 52px 1fr auto 76px", alignItems: "center", gap: 14, padding: "10px 16px", borderBottom: "1px solid var(--line)" },
  boardRowTop: { background: "linear-gradient(90deg, rgba(255,46,116,.06), transparent)" },
  rank: { fontSize: 20, fontWeight: 800, textAlign: "center", fontFamily: "ui-monospace, monospace" },
  thumb: { width: 52, height: 52, borderRadius: 10, overflow: "hidden", flex: "0 0 auto" },
  boardName: { fontWeight: 700, fontSize: 15 }, boardStat: { fontSize: 12, fontFamily: "ui-monospace, monospace", textAlign: "right" },
  boardElo: { fontSize: 18, fontWeight: 800, textAlign: "right", fontFamily: "ui-monospace, monospace" },
  pagerWrap: { display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24 },
  pagerBtn: { minWidth: 40, height: 40, padding: "0 12px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--muted)", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "grid", placeItems: "center", fontFamily: "ui-monospace, monospace" },
  pagerBtnOn: { background: "var(--text)", color: "#0b0b10", borderColor: "var(--text)" },
  pagerNext: { minWidth: 40, height: 40, padding: "0 16px", border: "1px solid var(--line)", background: "transparent", color: "var(--text)", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  pagerDisabled: { opacity: .4, cursor: "not-allowed" },

  tierWrap: { display: "flex", flexDirection: "column", gap: 8, textAlign: "left" },
  tierRow: { display: "flex", alignItems: "stretch", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--panel)" },
  tierLabel: { width: 64, flex: "0 0 64px", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, color: "#0b0b10" },
  tierItems: { display: "flex", flexWrap: "wrap", gap: 8, padding: 10, flex: 1 },
  tierCard: { width: 64, height: 84, borderRadius: 8, overflow: "hidden", position: "relative", flex: "0 0 auto", border: "1px solid var(--line)" },
  tierCardName: { position: "absolute", left: 0, right: 0, bottom: 0, fontSize: 8, lineHeight: 1.05, padding: "8px 3px 3px", background: "linear-gradient(to top, rgba(0,0,0,.9), transparent)", fontWeight: 700 },

  poolRow: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" },
  poolBtn: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px 34px", cursor: "pointer", color: "var(--text)", minWidth: 150 },
  poolNum: { fontSize: 24, fontWeight: 800 }, poolMeta: { fontSize: 12, color: "var(--muted)", marginTop: 6, fontFamily: "ui-monospace, monospace" },

  progressOuter: { position: "relative", height: 14, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 999, overflow: "hidden", maxWidth: 520, margin: "0 auto 28px" },
  progressInner: { position: "absolute", top: 0, bottom: 0, left: 0, background: "linear-gradient(90deg, var(--accent), #ff7aa8)", transition: "width .3s ease" },
  progressLabel: { position: "absolute", right: 10, top: -1, fontSize: 10, fontWeight: 800, color: "var(--text)", lineHeight: "16px", fontFamily: "ui-monospace, monospace" },

  warLegend: { display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", marginBottom: 6 },
  warSide: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 22px", maxWidth: 280 },
  warDot: { width: 12, height: 12, borderRadius: "50%" },
  warEx: { fontSize: 11, color: "var(--muted)", textAlign: "center" },
  warBar: { display: "flex", height: 44, borderRadius: 12, overflow: "hidden", maxWidth: 560, margin: "0 auto 16px", border: "1px solid var(--line)" },
  warFill: { display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: 12, color: "#fff", fontWeight: 800, fontSize: 13, transition: "width .5s ease" },
  warFillR: { display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 12, color: "#fff", fontWeight: 800, fontSize: 13, transition: "width .5s ease" },
  warGlobal: { fontSize: 13, color: "var(--muted)", marginTop: 4 },

  // ---- home / landing ----
  homeWrap: { maxWidth: 1040, margin: "0 auto", padding: "56px 24px 0" },
  hero: { textAlign: "left" },
  heroEyebrow: { fontSize: 13, fontWeight: 700, letterSpacing: ".22em", color: "var(--muted)", marginBottom: 18 },
  heroTitle: { fontSize: "clamp(40px, 7vw, 68px)", fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.02, margin: "0 0 16px" },
  heroSub: { color: "var(--muted)", fontSize: 17, lineHeight: 1.5, maxWidth: 520, margin: "0 0 30px" },
  heroCtas: { display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" },
  ctaPrimary: { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)", padding: "13px 28px", borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-block" },
  ctaGhost: { background: "transparent", color: "var(--text)", border: "1px solid var(--line)", padding: "13px 28px", borderRadius: 999, fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" },
  heroStatus: { fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--muted)", letterSpacing: ".05em", display: "inline-flex", alignItems: "center", gap: 9 },
  shareNote: { fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--up)", marginTop: 10, textAlign: "center" },

  top5Card: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 18, padding: 18 },
  top5Head: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontWeight: 800, fontSize: 15 },
  top5View: { color: "var(--accent)", fontSize: 12, fontWeight: 600, textDecoration: "none" },
  top5Row: { display: "grid", gridTemplateColumns: "28px 44px 1fr auto", alignItems: "center", gap: 12, padding: "8px 6px", borderRadius: 10, textDecoration: "none", color: "inherit" },
  top5Rank: { fontFamily: "ui-monospace, monospace", fontWeight: 800, fontSize: 16, textAlign: "center" },
  top5Thumb: { width: 44, height: 58, borderRadius: 8, overflow: "hidden", flex: "0 0 auto" },
  top5Name: { fontWeight: 700, fontSize: 14, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  top5Elo: { fontFamily: "ui-monospace, monospace", fontWeight: 800, fontSize: 15 },
  shareRow: { display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", flexWrap: "wrap" },
  shareBtn: { flex: "1 1 auto", background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", borderRadius: 999, padding: "8px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },

  // ---- anime detail ----
  detailWrap: { maxWidth: 1040, margin: "0 auto", padding: "40px 24px 0" },
  detailCover: { width: "100%", aspectRatio: "3/4", borderRadius: 18, overflow: "hidden", border: "1px solid var(--line)" },
  detailEra: { display: "inline-block", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", marginBottom: 12 },
  detailTitle: { fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.05, margin: "0 0 26px" },
  statRow: { display: "flex", gap: 40, marginBottom: 30, flexWrap: "wrap" },
  stat: {},
  statValue: { fontSize: 42, fontWeight: 800, fontFamily: "ui-monospace, monospace", lineHeight: 1 },
  statLabel: { fontSize: 11, letterSpacing: ".22em", color: "var(--muted)", marginTop: 6 },
  nearbyHead: { fontSize: 13, fontWeight: 700, letterSpacing: ".18em", color: "var(--muted)", margin: "40px 0 16px" },
  nearbyRow: { display: "flex", gap: 14, flexWrap: "wrap" },
  nearbyCard: { width: 150, textDecoration: "none", color: "inherit", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: 10 },
  nearbyRank: { fontFamily: "ui-monospace, monospace", color: "var(--muted)", fontWeight: 800, fontSize: 13, marginBottom: 6 },
  nearbyThumb: { width: "100%", aspectRatio: "3/4", borderRadius: 10, overflow: "hidden", marginBottom: 8 },
  nearbyName: { fontWeight: 700, fontSize: 13, lineHeight: 1.15 },
  nearbyElo: { fontFamily: "ui-monospace, monospace", fontWeight: 800, fontSize: 14, marginTop: 4 },

  // ---- detail: description + info panel ----
  infoPanel: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 },
  infoEyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: ".2em", color: "var(--muted)", marginBottom: 10 },
  infoDesc: { fontSize: 14, lineHeight: 1.6, color: "var(--text)", margin: 0, whiteSpace: "pre-line" },
  infoDescMuted: { fontSize: 14, lineHeight: 1.6, color: "var(--faint)", margin: 0, fontStyle: "italic" },
  infoDivider: { height: 1, background: "var(--line)", margin: "18px 0" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, padding: "7px 0" },
  infoLabel: { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "var(--muted)", flex: "0 0 auto" },
  infoValue: { fontSize: 14, fontWeight: 600, textAlign: "right" },
  infoValueMono: { fontSize: 14, fontWeight: 800, fontFamily: "ui-monospace, monospace", textAlign: "right" },
  genreChips: { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" },
  genreChip: { fontSize: 11, fontWeight: 600, color: "var(--muted)", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 999, padding: "3px 9px" },
};
