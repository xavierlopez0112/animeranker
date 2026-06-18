import { CATEGORIES, inCategory } from "../data/categories.js";
import { S } from "../styles.js";

export default function ChipBar({ data, cat, setCat }) {
  return (
    <div style={S.chipBar}>
      {CATEGORIES.map(([k, label]) => {
        const n = k === "all" ? data.length : data.filter((d) => inCategory(d, k)).length;
        const disabled = n < 2;
        return (
          <button key={k} onClick={() => !disabled && setCat(k)} disabled={disabled}
            style={{ ...S.chip, ...(cat === k ? S.chipOn : {}), ...(disabled ? S.chipOff : {}) }}>
            {label}<span style={S.chipCount}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}
