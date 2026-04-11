/**
 * ISO50001Gap — frontend/gap.atoms.jsx
 * Shared UI primitives: Btn, Input, TA, Sel, Card, ScorePicker, Tag, Toast
 */
import { useState } from "react";
import { C, SCORE_CFG } from "./gap.ui.constants.js";

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg0};color:${C.t0};font-family:'Plus Jakarta Sans',sans-serif;font-size:13px}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:${C.bg1}}
::-webkit-scrollbar-thumb{background:${C.blue};border-radius:3px}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.fade-in{animation:fadeIn .2s ease}
`;

// ── Btn ──────────────────────────────────────────────────────────
const BVARS = {
  primary: `background:linear-gradient(135deg,${C.teal},${C.tealL});color:#fff;border:none`,
  blue:    `background:linear-gradient(135deg,${C.blue},${C.blueL});color:#fff;border:none`,
  red:     `background:linear-gradient(135deg,${C.red},#e74c3c);color:#fff;border:none`,
  ghost:   `background:transparent;color:${C.t1};border:1px solid ${C.bd0}`,
  outline: `background:transparent;color:${C.blueL};border:1px solid ${C.blueL}55`,
};
const BSIZES = {
  sm:  `padding:4px 10px;font-size:11px;border-radius:5px`,
  md:  `padding:7px 16px;font-size:12.5px;border-radius:7px`,
  lg:  `padding:10px 22px;font-size:13.5px;border-radius:8px`,
};
export const Btn = ({ v="ghost", sz="md", onClick, disabled, loading, children, sx={} }) => (
  <button onClick={onClick} disabled={disabled||loading}
    style={{ ...BVARS[v]?.split(";").reduce((o,p)=>{const[k,val]=p.split(":");if(k)o[k.trim().replace(/-(\w)/g,(_,c)=>c.toUpperCase())]=val?.trim();return o},{}),
      ...BSIZES[sz]?.split(";").reduce((o,p)=>{const[k,val]=p.split(":");if(k)o[k.trim().replace(/-(\w)/g,(_,c)=>c.toUpperCase())]=val?.trim();return o},{}),
      cursor:disabled||loading?"not-allowed":"pointer", opacity:disabled||loading?.4:1,
      fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600, transition:"all .15s", ...sx }}>
    {loading ? "⏳ " : ""}{children}
  </button>
);

// ── Input / TA / Sel ─────────────────────────────────────────────
const BASE_INPUT = { background:C.bg3, border:`1px solid ${C.bd0}`, borderRadius:6,
  padding:"6px 10px", color:C.t0, fontSize:12.5, width:"100%",
  fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" };
export const Input = ({ value, onChange, placeholder, type="text", disabled }) => (
  <input type={type} value={value||""} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} disabled={disabled} style={BASE_INPUT}/>
);
export const TA = ({ value, onChange, placeholder, rows=3, disabled }) => (
  <textarea value={value||""} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} rows={rows} disabled={disabled}
    style={{ ...BASE_INPUT, resize:"vertical", lineHeight:1.6 }}/>
);
export const Sel = ({ value, onChange, options=[], disabled }) => (
  <select value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled}
    style={{ ...BASE_INPUT, cursor:disabled?"not-allowed":"pointer" }}>
    {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
  </select>
);
export const Num = ({ value, onChange, min=0, max=100, step=1 }) => (
  <input type="number" value={value||""} onChange={e=>onChange(Number(e.target.value))}
    min={min} max={max} step={step} style={{ ...BASE_INPUT, width:90 }}/>
);

// ── Field / Grid ─────────────────────────────────────────────────
export const Field = ({ label, required, children, sx={} }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:4, ...sx }}>
    {label && <span style={{ fontSize:10.5, fontWeight:700, color:C.t2, textTransform:"uppercase", letterSpacing:.5 }}>
      {label}{required && <span style={{ color:C.red }}> *</span>}
    </span>}
    {children}
  </div>
);
export const Grid = ({ cols=2, gap=10, children }) => (
  <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap }}>{children}</div>
);
export const Rule = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"10px 0 6px" }}>
    <div style={{ height:1, flex:1, background:C.bd0 }}/>
    {label && <span style={{ fontSize:10, color:C.t2, fontWeight:700, textTransform:"uppercase", letterSpacing:.5 }}>{label}</span>}
    <div style={{ height:1, flex:1, background:C.bd0 }}/>
  </div>
);

// ── Card ─────────────────────────────────────────────────────────
export const Card = ({ title, icon, accent, children, collapsed, onToggle, badge }) => (
  <div style={{ background:C.bg2, borderRadius:10, border:`1px solid ${accent||C.bd0}30`,
    overflow:"hidden", marginBottom:8 }}>
    <div onClick={onToggle} style={{ padding:"10px 14px", background:`${accent||C.blue}12`,
      borderBottom:`1px solid ${accent||C.blue}20`,
      display:"flex", alignItems:"center", gap:8, cursor:onToggle?"pointer":"default" }}>
      {icon && <span style={{ fontSize:16 }}>{icon}</span>}
      <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:700, color:C.t0, flex:1 }}>{title}</span>
      {badge && <Tag c={accent||C.blue}>{badge}</Tag>}
      {onToggle && <span style={{ color:C.t2, fontSize:12 }}>{collapsed?"▶":"▼"}</span>}
    </div>
    {!collapsed && <div style={{ padding:14 }}>{children}</div>}
  </div>
);

// ── Tag ──────────────────────────────────────────────────────────
export const Tag = ({ c=C.blue, children, sm }) => (
  <span style={{ background:`${c}18`, color:c, border:`1px solid ${c}28`,
    borderRadius:4, padding:sm?"1px 5px":"2px 7px", fontSize:sm?9.5:10.5, fontWeight:700 }}>
    {children}
  </span>
);

// ── ScorePicker — 0 to 5 ─────────────────────────────────────────
export const ScorePicker = ({ value, onChange }) => (
  <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
    {Object.entries(SCORE_CFG).map(([s, cfg]) => (
      <button key={s} onClick={() => onChange(Number(s))}
        style={{ padding:"3px 8px", borderRadius:5, border:`1px solid ${cfg.col}40`,
          background:Number(s)===value ? cfg.col : cfg.bg,
          color:Number(s)===value ? "#fff" : cfg.col,
          fontSize:10.5, fontWeight:700, cursor:"pointer", transition:"all .12s",
          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        {s}{s!=="0"&&` — ${cfg.short}`}
      </button>
    ))}
  </div>
);

// ── RiskSlider (1–5) ─────────────────────────────────────────────
export const RiskSlider = ({ label, value, onChange, cols }) => (
  <div>
    <div style={{ fontSize:10, fontWeight:700, color:C.t2, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>{label}</div>
    <div style={{ display:"flex", gap:3 }}>
      {(cols||[1,2,3,4,5]).map(v => {
        const col = v<=2?C.teal:v<=3?C.amber:v<=4?C.orange:C.red;
        return (
          <button key={v} onClick={() => onChange(v)}
            style={{ flex:1, padding:"4px 0", borderRadius:5, border:`1px solid ${col}40`,
              background:v===value?col:`${col}12`, color:v===value?"#fff":col,
              fontSize:11.5, fontWeight:700, cursor:"pointer" }}>
            {v}
          </button>
        );
      })}
    </div>
    {value > 0 && <div style={{ fontSize:10, color:C.t2, marginTop:3 }}>
      {(cols||[0,0,"Trung bình","Cao","Nghiêm trọng"])[value-1]||value}
    </div>}
  </div>
);

// ── Toast ────────────────────────────────────────────────────────
export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  const col = toast.type === "success" ? C.teal : toast.type === "error" ? C.red : C.orange;
  return (
    <div className="fade-in" style={{ background:`${col}18`, border:`1px solid ${col}35`,
      borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:16 }}>{toast.type==="success"?"✅":toast.type==="error"?"❌":"ℹ️"}</span>
      <span style={{ flex:1, fontSize:12.5, color:C.t0 }}>{toast.msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", color:C.t2, cursor:"pointer", fontSize:14 }}>✕</button>
    </div>
  );
};

// ── KPIBar ───────────────────────────────────────────────────────
export const KPIBar = ({ items }) => (
  <div style={{ display:"grid", gridTemplateColumns:`repeat(${items.length},1fr)`, gap:6, marginBottom:12 }}>
    {items.map(({ label, value, col=C.blue, icon }) => (
      <div key={label} style={{ background:`${col}12`, border:`1px solid ${col}25`,
        borderRadius:8, padding:"9px 10px", textAlign:"center" }}>
        {icon && <div style={{ fontSize:16, marginBottom:2 }}>{icon}</div>}
        <div style={{ fontSize:22, fontWeight:800, color:col, fontFamily:"'Rajdhani',sans-serif" }}>{value}</div>
        <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, textTransform:"uppercase", letterSpacing:.4 }}>{label}</div>
      </div>
    ))}
  </div>
);

// ── SectionHeader ─────────────────────────────────────────────────
export const SectionHeader = ({ icon, title, badge }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, color:C.t0 }}>{title}</div>
      {badge && <Tag c={C.blue}>{badge}</Tag>}
    </div>
    <div style={{ height:2, background:`linear-gradient(90deg,${C.blue},transparent)` }}/>
  </div>
);
