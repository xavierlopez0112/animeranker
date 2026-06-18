import Cover from "./Cover.jsx";
import { S } from "../styles.js";

export default function TierList({ tiers }) {
  return (
    <div style={S.tierWrap}>
      {tiers.map((t) => (
        <div key={t.key} style={S.tierRow}>
          <div style={{ ...S.tierLabel, background: t.color }}>{t.key}</div>
          <div style={S.tierItems}>
            {t.items.map((it) => (<div key={it.id} style={S.tierCard} title={it.title}><Cover item={it} /><div style={S.tierCardName}>{it.title}</div></div>))}
          </div>
        </div>
      ))}
    </div>
  );
}
