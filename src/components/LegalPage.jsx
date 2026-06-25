// Renders one of the legal documents (privacy / terms / cookies) from data/legal.js.
// One presentational component, picked by the `doc` prop in the route table.
import { S } from "../styles.js";
import { LEGAL, LAST_UPDATED } from "../data/legal.js";

export default function LegalPage({ doc }) {
  const page = LEGAL[doc];
  if (!page) return null;

  return (
    <div style={S.legalWrap}>
      <h1 style={S.legalTitle}>{page.title}</h1>
      <div style={S.legalUpdated}>Last updated: {LAST_UPDATED}</div>

      <div style={S.legalDraft}>
        <strong>Draft — not legal advice.</strong> This is a starter document tailored to
        what AnimeRanker does today. Have it reviewed by a lawyer and fill in the
        placeholder contact address and jurisdiction before relying on it.
      </div>

      {page.sections.map((sec, i) => (
        <section key={i}>
          <h2 style={S.legalH2}>{sec.h}</h2>
          {sec.body.map((item, j) =>
            Array.isArray(item) ? (
              <ul key={j} style={S.legalList}>
                {item.map((li, k) => (
                  <li key={k}>{li}</li>
                ))}
              </ul>
            ) : (
              <p key={j} style={S.legalP}>{item}</p>
            )
          )}
        </section>
      ))}
    </div>
  );
}
