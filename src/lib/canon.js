import { slug } from "./slug.js";
import { ERA_CUT } from "../data/categories.js";

// canon.js — collapse per-season / per-arc AniList entries into ONE canonical
// franchise title. "Attack on Titan Season 3", "...: The Final Season" etc.
// all become a single "Attack on Titan".
//
// Used by BOTH scripts/seed.js (to build the catalog) and the frontend (to map
// live AniList titles to the same slug), so the two ALWAYS agree on slugs.

// Explicit franchise overrides. If a raw title matches, it maps straight to the
// canonical name. These handle seasons, parts AND named story arcs (which the
// generic suffix rules below can't detect, e.g. "Demon Slayer: ... Arc").
// First match wins, so order doesn't matter much here.
const OVERRIDES = [
  [/^attack on titan|^shingeki no kyojin/i, "Attack on Titan"],
  [/^demon slayer|kimetsu no yaiba/i, "Demon Slayer"],
  [/^jujutsu kaisen/i, "Jujutsu Kaisen"],
  [/^my hero academia|^boku no hero/i, "My Hero Academia"],
  [/^bleach/i, "Bleach"],
  [/^jojo'?s bizarre adventure/i, "JoJo's Bizarre Adventure"],
  [/^mob psycho 100/i, "Mob Psycho 100"],
  [/^one punch man/i, "One Punch Man"],
  [/^spy ?x ?family/i, "Spy x Family"],
  [/^vinland saga/i, "Vinland Saga"],
  [/^the rising of the shield hero|^tate no yuusha/i, "The Rising of the Shield Hero"],
  [/^kaguya-?sama/i, "Kaguya-sama: Love is War"],
  [/^dr\.? ?stone/i, "Dr. Stone"],
  [/^the seven deadly sins|^nanatsu no taizai/i, "The Seven Deadly Sins"],
  [/^sword art online/i, "Sword Art Online"],
  [/^tokyo ghoul/i, "Tokyo Ghoul"],
  [/^haikyu/i, "Haikyuu!!"],
  [/^black clover/i, "Black Clover"],
  [/^fire force|^enen no shouboutai/i, "Fire Force"],
  [/^the promised neverland|^yakusoku no neverland/i, "The Promised Neverland"],
  [/^overlord/i, "Overlord"],
  [/^re:?\s?zero/i, "Re:Zero"],
  [/reincarnated as a slime|^tensei shitara slime/i, "That Time I Got Reincarnated as a Slime"],
  [/^the eminence in shadow/i, "The Eminence in Shadow"],
  [/^classroom of the elite/i, "Classroom of the Elite"],
  [/^chainsaw man/i, "Chainsaw Man"],
  [/^frieren|^sousou no frieren/i, "Frieren: Beyond Journey's End"],
  [/oshi no ko/i, "Oshi no Ko"],
  [/^solo leveling/i, "Solo Leveling"],
  [/^blue lock/i, "Blue Lock"],
  [/^made in abyss/i, "Made in Abyss"],
  [/the apothecary diaries|^kusuriya no hitorigoto/i, "The Apothecary Diaries"],
  [/^konosuba/i, "KonoSuba"],
  [/^hunter ?x ?hunter/i, "Hunter x Hunter"],
  [/^fullmetal alchemist/i, "Fullmetal Alchemist: Brotherhood"],
  [/^code geass/i, "Code Geass"],
  [/^naruto/i, "Naruto"],
  [/^parasyte/i, "Parasyte"],
  // multi-season / arc-subtitle franchises pulled in by the larger fetch
  [/^tokyo revengers/i, "Tokyo Revengers"],
  [/^gintama/i, "Gintama"],
  [/^fairy tail/i, "Fairy Tail"],
  [/monogatari/i, "Monogatari Series"],
  [/^mushoku tensei/i, "Mushoku Tensei: Jobless Reincarnation"],
  [/^date a live/i, "Date A Live"],
  [/^bungou? stray dogs/i, "Bungo Stray Dogs"],
  [/quintessential quintuplets|^5-?toubun/i, "The Quintessential Quintuplets"],
  [/saiki k|disastrous life of saiki/i, "The Disastrous Life of Saiki K."],
  [/rascal does not dream|^seishun buta/i, "Rascal Does Not Dream of Bunny Girl Senpai"],
  [/^the devil is a part-?timer|^hataraku maou/i, "The Devil is a Part-Timer!"],
  [/^86\b|eighty-six/i, "86 Eighty-Six"],
  [/^horimiya/i, "Horimiya"],
  [/^komi can'?t communicate|^komi-san/i, "Komi Can't Communicate"],
  [/^no game,? no life/i, "No Game, No Life"],
  [/realist hero/i, "How a Realist Hero Rebuilt the Kingdom"],
  [/^arifureta/i, "Arifureta: From Commonplace to World's Strongest"],
  [/^kuroko/i, "Kuroko's Basketball"],
  [/ace of diamond|^daiya no a/i, "Ace of Diamond"],
  [/^free!/i, "Free!"],
  [/^chihayafuru/i, "Chihayafuru"],
  [/^hajime no ippo/i, "Hajime no Ippo"],
  [/yuri!*\s*on ice/i, "Yuri!!! on Ice"],
  [/^clannad/i, "Clannad"],
  [/^food wars|^shokugeki/i, "Food Wars!"],
  [/^noragami/i, "Noragami"],
  [/my teen romantic comedy snafu|^oregairu|^yahari ore/i, "My Teen Romantic Comedy SNAFU"],
  [/^neon genesis evangelion/i, "Neon Genesis Evangelion"],
  // casing fixes for AniList's all-caps / stylized titles (casing only — keeps slugs stable)
  [/^one piece$/i, "One Piece"],
  [/^erased$/i, "Erased"],
  [/your lie in april/i, "Your Lie in April"],
  [/^bocchi the rock/i, "Bocchi the Rock!"],
  [/^mashle/i, "Mashle: Magic and Muscles"],
  [/^goblin slayer/i, "Goblin Slayer"],
  [/^dan ?da ?dan|^dandadan/i, "Dan Da Dan"],
  [/^zombie ?land saga/i, "Zombie Land Saga"],
  [/^darling in the franxx/i, "Darling in the FranXX"],
  [/don'?t toy with me,? miss nagatoro|^ijiranaide/i, "Don't Toy with Me, Miss Nagatoro"],
  [/^wonder egg priority/i, "Wonder Egg Priority"],
  [/^banana fish/i, "Banana Fish"],
  [/^baki/i, "Baki"],
  [/^beastars/i, "Beastars"],
  [/^psycho-?pass/i, "Psycho-Pass"],
  [/^k-?on/i, "K-On!"],
  // --- debatable merges (fans may disagree) — easy to remove if you want them split:
  [/^jojo/i, "JoJo's Bizarre Adventure"],
  [/^fate\/?(zero|stay|grand|kaleid|apocrypha)/i, "Fate series"],
];

// Generic suffix strippers for everything NOT covered by an override.
const SUFFIX = [
  /\s*[:\-–—]\s*the final season.*$/i, // ": The Final Season", "- The Final Season Part 2"
  /\s+final season.*$/i,
  /\s+\d+(st|nd|rd|th)\s+season.*$/i,   // "2nd Season"
  /\s+(second|third|fourth|fifth|sixth|seventh)\s+season.*$/i, // spelled-out
  /\s+season\s+\d+.*$/i,                // "Season 2"
  /\s+part\s+\d+.*$/i,                  // "Part 2"
  /\s+\d+(st|nd|rd|th)\s+cour.*$/i,
  /\s+cour\s+\d+.*$/i,
  /\s+(ii|iii|iv|vi|v)$/i,              // trailing roman numeral
];

export function canonicalTitle(rawTitle) {
  const t = (rawTitle || "").trim();
  for (const [re, canon] of OVERRIDES) if (re.test(t)) return canon;
  let s = t;
  for (const re of SUFFIX) s = s.replace(re, "");
  s = s.replace(/[\s:–—-]+$/g, "").trim(); // tidy leftover trailing separators
  return s || t;
}

// Collapse a list of normalized items (per-season AniList entries) into the same
// canonical franchises the backend stores: deduped by canonical slug, keeping
// the first (most popular) entry's art/genres and the EARLIEST season's year/era.
// Used by the frontend so its slugs match the seeded `media` catalog exactly.
export function canonicalizeList(items) {
  const groups = new Map();
  for (const it of items || []) {
    const title = canonicalTitle(it.title);
    const id = slug(title);
    if (!id) continue;
    let g = groups.get(id);
    if (!g) { g = { id, title, flagship: it, minYear: it.year ?? null }; groups.set(id, g); }
    if (it.year != null && (g.minYear == null || it.year < g.minYear)) g.minYear = it.year;
  }
  return [...groups.values()].map((g) => ({
    id: g.id,
    anilist_id: /^\d+$/.test(g.flagship.id) ? Number(g.flagship.id) : null,
    title: g.title,
    image: g.flagship.image ?? null,
    year: g.minYear,
    era: (g.minYear != null && g.minYear < ERA_CUT) ? "old" : "new",
    demo: g.flagship.demo ?? null,
    genres: g.flagship.genres ?? [],
  }));
}
