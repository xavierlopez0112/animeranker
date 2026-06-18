// categories + era boundary --------------------------------------------------
export const ERA_CUT = 2013; // Attack on Titan line: <2013 old gen, >=2013 new gen

export const CATEGORIES = [
  ["all", "All"], ["old", "Old Gen"], ["new", "New Gen"], ["shonen", "Shonen"], ["seinen", "Seinen"],
  ["isekai", "Isekai"], ["fantasy", "Fantasy"], ["action", "Action"], ["romance", "Romance"],
  ["sol", "Slice of Life"], ["scifi", "Sci-Fi & Mecha"], ["sports", "Sports"], ["dark", "Dark & Psych"],
];

export function inCategory(it, key) {
  const g = it.genres || [];
  switch (key) {
    case "all": return true;
    case "old": return it.era === "old";
    case "new": return it.era === "new";
    case "shonen": return it.demo === "shonen";
    case "seinen": return it.demo === "seinen";
    case "isekai": return g.includes("isekai");
    case "fantasy": return g.includes("fantasy");
    case "action": return g.includes("action");
    case "romance": return g.includes("romance");
    case "sol": return g.includes("sliceoflife");
    case "scifi": return g.includes("scifi") || g.includes("mecha");
    case "sports": return g.includes("sports");
    case "dark": return g.includes("psychological") || g.includes("horror") || g.includes("thriller");
    default: return true;
  }
}
