---
name: animeranker-ui
description: The visual design system for AnimeRanker. Use whenever building, restyling, or adding any UI — components, screens, cards, modals, share images, marketing pages. Defines the palette, type scale, spacing, component conventions, motion, and copy voice so new UI matches the existing app instead of drifting into generic AI defaults.
---

# AnimeRanker UI System

## Subject and intent
AnimeRanker is a head-to-head ranking toy for anime fans. The single job of every screen is a fast, opinionated choice the user wants to share or argue about. The audience is fandom — they expect confidence and a little attitude, not corporate polish. Design decisions should serve *shareability and contestability*: the result screen (tier list, Era War verdict, ELO reveal) is the climax and deserves the most visual weight; everything else stays quiet so the choice is the focus.

## Design tokens (use these exact values — never invent new ones)
Defined as CSS variables on `:root` in the component's `CSS` string:

- `--bg: #0b0b10` — app background (near-black ink, slightly cool)
- `--panel: #15151d` — cards, chips, raised surfaces
- `--line: #23232e` — all borders and dividers (1px)
- `--text: #f3f1f5` — primary text
- `--muted: #9b98a8` — secondary text, labels
- `--faint: #5b5868` — tertiary / disabled / monospace footnotes
- `--accent: #ff2e74` — electric magenta. THE brand color. Use sparingly.
- `--up: #43e6a0` — mint green. Wins, positive ELO, "New Gen" side.
- `--down: #ff6b6b` — coral. Losses, negative ELO.
- Era War "Old Gen" blue: `#5aa9ff` (paired against `--accent` for New Gen).

Tier colors (S→F), used only in tier rows: `#ff5e7e #ff9f43 #ffd93d #5bd18a #5aa9ff #9aa3b2`.

**Accent discipline:** `--accent` appears ONLY on the brand mark, the active nav tab/chip, key numbers, and the New Gen side. If you're reaching for magenta to decorate something, stop — that's the one risk this design spends, and spreading it kills it.

## Typography
- Display/headings: system sans (`ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto`), weight **800**, tight tracking (`-0.02em`). H1 is large (~46px) and confident.
- Body/UI: same family, weight 600 for controls, 400 for prose. Sub-text uses `--muted` at ~14px.
- Numbers, ELO, counters, labels: **monospace** (`ui-monospace, monospace`). All "data" reads as mono — this is a signature.
- Eyebrows/labels: UPPERCASE with wide letter-spacing (`.2em–.25em`), small, `--muted`.

## Layout
- Centered stage, `max-width: 1040px`, generous top padding, `text-align: center` for hero screens.
- Nav: a single pill-shaped segmented control, centered. Active tab = solid `--text` fill with dark text.
- Category chips: horizontal scroll row, pill chips with a mono count badge; active chip = `--accent` fill.
- Cards: portrait `aspect-ratio: 3/4`, `border-radius: 18px`, 1px `--line` border, cover image with a bottom-up black gradient (`cardShade`) so the title is always legible.
- Two-card matchups use a circular "VS" badge overlapping the gap between them.

## Component conventions
- **Cards are buttons.** Always `user-select: none` and `-webkit-tap-highlight-color: transparent`. Remove the click outline but keep `:focus-visible` (2px `--accent` ring) for keyboard play.
- **Hover = lift + glow:** `translateY(-6px) scale(1.012)` plus a soft magenta shadow; inner cover image scales `1.04`. Active = `scale(.99)`.
- **Reveal states:** winning card gets a green ring + the ELO in `--up`; losing card dims (`opacity .4`, slight grayscale) with ELO in `--down`. A white check circle marks the winner.
- **Tier rows:** colored square label cell (S/A/B/…) on the left at weight 900, items wrap in a flex row of small 3/4 thumbnails.
- **Era badges:** small pill top-left of a card, `--accent` for New Gen / `#5aa9ff` for Old Gen, with the year.
- **Progress bars:** thin track in `--panel`, fill is a magenta gradient, mono count label.

## Motion
Subtle and purposeful. Transitions ~`.18s` for hover transforms, `.3–.5s` for reveals and bar fills. Always honor `prefers-reduced-motion: reduce` by disabling card/cover transitions. No ambient/looping animation — this is a fast toy, not a showcase.

## Copy voice
Fan voice, sentence case, plain verbs, a little swagger. Prompts are direct questions ("Which one's better?"). CTAs name the exact action ("Skip this matchup", "Done — show my tiers", "Start the war"). Results invite argument ("New Gen loyalist", "the internet so far: New Gen 54%"). Never corporate, never hype-y filler. Labels label; nothing does double duty.

## Hard rules (do not violate)
- **No `localStorage`/`sessionStorage`** in the artifact context — use the `storage` wrapper (`loadKey`/`saveKey`). In the eventual real backend, persistence moves server-side.
- **Images come from AniList** (or the gradient fallback). Do not hardcode other image hosts.
- **Never sell merch using copyrighted cover art.** The ranker may *display* AniList art; any commercial product (POD, etc.) must use original designs only.
- Keep new UI inside this token system. If a screen seems to need a color/size outside these tokens, that's a signal to reconsider the layout, not to add a token.

## When extending
Spend boldness in one place per screen and keep the rest disciplined. Before shipping a screen, check: does it work down to mobile (the arena stacks vertically under 760px), is keyboard focus visible, is reduced-motion respected, and is `--accent` still rare? If all yes, it fits.
