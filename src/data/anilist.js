import { ERA_CUT } from "./categories.js";

// live-data normalization ----------------------------------------------------
const GENRE_MAP = { "Action": "action", "Fantasy": "fantasy", "Romance": "romance", "Slice of Life": "sliceoflife", "Sci-Fi": "scifi", "Mecha": "mecha", "Sports": "sports", "Horror": "horror", "Psychological": "psychological", "Thriller": "thriller", "Supernatural": "supernatural", "Mystery": "mystery", "Drama": "drama", "Comedy": "comedy", "Adventure": "adventure", "Music": "music" };
const DEMO_TAGS = { "Shounen": "shonen", "Seinen": "seinen", "Shoujo": "shojo", "Josei": "josei", "Kids": "kids" };

export function normLive(m) {
  const genres = (m.genres || []).map((g) => GENRE_MAP[g]).filter(Boolean);
  const tags = (m.tags || []).map((t) => t.name);
  if (tags.includes("Isekai") && !genres.includes("isekai")) genres.push("isekai");
  let demo = null; for (const t of tags) { if (DEMO_TAGS[t]) { demo = DEMO_TAGS[t]; break; } }
  const year = m.startDate && m.startDate.year ? m.startDate.year : null;
  return { id: String(m.id), title: m.title.english || m.title.romaji, image: m.coverImage.extraLarge || m.coverImage.large, genres, demo, year, era: year && year < ERA_CUT ? "old" : "new" };
}

const MEDIA = `id title{english romaji} coverImage{extraLarge large} genres startDate{year} tags{name}`;
const POP_PAGES = 4;                                   // 4 × 50 = 200 popularity-sorted entries
const GENRE_FILL = [["Sports", 18], ["Mecha", 12], ["Music", 10]]; // top-ups for thin categories

async function gql(query) {
  const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query }) });
  const j = await res.json();
  if (j.errors) throw new Error(j.errors.map((e) => e.message).join("; "));
  return j.data;
}

// Pull top popularity entries + targeted genre top-ups, deduped by AniList id.
// (canonicalization later collapses each franchise's seasons into one title.)
export async function fetchAnime() {
  const popBlocks = Array.from({ length: POP_PAGES }, (_, i) =>
    `p${i + 1}:Page(page:${i + 1},perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){${MEDIA}}}`).join(" ");
  const pop = await gql(`query{${popBlocks}}`);

  let gen = {};
  try {
    const genreBlocks = GENRE_FILL.map(([g, n], i) =>
      `g${i}:Page(page:1,perPage:${n}){media(type:ANIME,genre:"${g}",sort:POPULARITY_DESC,isAdult:false){${MEDIA}}}`).join(" ");
    gen = await gql(`query{${genreBlocks}}`);
  } catch (_) { /* genre fill is best-effort; popularity pull is what matters */ }

  const seen = new Set(); const out = [];
  for (const data of [pop, gen]) {
    for (const key of Object.keys(data)) {
      for (const m of data[key].media) { if (seen.has(m.id)) continue; seen.add(m.id); out.push(normLive(m)); }
    }
  }
  return out;
}

// strip AniList's HTML description down to plain text, trimmed to a short synopsis
function stripHtml(s) {
  return (s || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function clamp(s, max = 360) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s.,;:]+$/, "") + "…";
}

// lazy per-title description fetch, cached in-memory. Returns plain text or "".
const descCache = new Map();
export async function fetchDescription(anilistId) {
  if (!anilistId) return "";
  if (descCache.has(anilistId)) return descCache.get(anilistId);
  try {
    const q = `query($id:Int){Media(id:$id,type:ANIME){description(asHtml:false)}}`;
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query: q, variables: { id: anilistId } }) });
    const j = await res.json();
    const text = clamp(stripHtml(j?.data?.Media?.description || ""));
    descCache.set(anilistId, text);
    return text;
  } catch (_) {
    return "";
  }
}
