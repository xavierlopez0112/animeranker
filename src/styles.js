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
};
