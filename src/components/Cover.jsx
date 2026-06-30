import { useState } from "react";
import { hashHue } from "../lib/slug.js";

export default function Cover({ item, className = "" }) {
  const [broken, setBroken] = useState(false);
  const hue = hashHue(item.title);
  const grad = `linear-gradient(150deg, hsl(${hue} 55% 22%), hsl(${(hue + 40) % 360} 60% 12%))`;
  if (!item.image || broken) return (<div className={className} style={{ background: grad, height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, textAlign: "center" }}><span style={{ fontWeight: 700, lineHeight: 1.15, color: "rgba(255,255,255,.9)", textWrap: "balance" }}>{item.title}</span></div>);
  return <img src={item.image} alt={item.title} onError={() => setBroken(true)} loading="lazy" decoding="async" className={className} style={{ height: "100%", width: "100%", objectFit: "cover" }} draggable={false} />;
}
