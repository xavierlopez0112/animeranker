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

export async function fetchAnime() {
  const q = `query{p1:Page(page:1,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){id title{english romaji} coverImage{extraLarge large} genres startDate{year} tags{name}}} p2:Page(page:2,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){id title{english romaji} coverImage{extraLarge large} genres startDate{year} tags{name}}}}`;
  const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query: q }) });
  const j = await res.json();
  return [...j.data.p1.media, ...j.data.p2.media].map(normLive);
}
