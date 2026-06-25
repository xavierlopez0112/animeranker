// Site footer: the three legal links plus attribution. Rendered once below the
// route outlet, on every screen.
import { Link } from "react-router-dom";
import { S } from "../styles.js";

const LINKS = [
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/cookies", "Cookie Notice"],
];

export default function Footer() {
  return (
    <footer style={S.footer}>
      <nav style={S.footerLinks}>
        {LINKS.map(([to, label]) => (
          <Link key={to} to={to} style={S.footerLink}>{label}</Link>
        ))}
      </nav>
      <div style={S.footerMeta}>
        © {new Date().getFullYear()} AnimeRanker · data &amp; cover art via AniList
      </div>
    </footer>
  );
}
