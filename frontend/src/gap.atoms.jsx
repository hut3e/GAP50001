/**
 * ISO50001Gap — frontend/gap.atoms.jsx
 * Shared UI primitives: typography chuẩn, spacing, contrast
 */
import { useState, useRef, useEffect } from "react";
import Flatpickr from "react-flatpickr";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";
import "flatpickr/dist/themes/dark.css";
import { C, SCORE_CFG, FONT, SPACE, RADIUS } from "./gap.ui.constants.js";

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{
  background:${C.bg0};
  color:${C.t0};
  font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
  font-size:${FONT.body}px;
  line-height:1.55;
  letter-spacing:0.01em;
  -webkit-font-smoothing:antialiased;
  min-height:100vh;
}
#root{min-height:100vh}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:${C.bg1}}
::-webkit-scrollbar-thumb{background:${C.blue};border-radius:${RADIUS.full}px}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.fade-in{animation:fadeIn .25s ease-out}

/* Fix styles for date, datetime inputs globally avoiding bright white background */
input[type="date"], input[type="datetime-local"], .flatpickr-input {
  background: ${C.bg3} !important;
  border: 1px solid ${C.bd0} !important;
  border-radius: ${RADIUS.md}px !important;
  padding: 10px 14px !important;
  color: ${C.t0} !important;
  font-size: ${FONT.body}px !important;
  width: 100% !important;
  min-height: 44px !important;
  font-family: 'Plus Jakarta Sans',sans-serif !important;
  outline: none !important;
  transition: border-color .15s, box-shadow .15s !important;
  color-scheme: dark !important; 
}
input[type="date"]:focus, input[type="datetime-local"]:focus, .flatpickr-input:focus {
  border-color: ${C.blueL} !important;
  box-shadow: 0 0 0 3px ${C.blue}30 !important;
}

@media print{
  body{font-size:${FONT.body}px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .no-print{display:none!important}
}
`;

// ── Btn ──────────────────────────────────────────────────────────
const BVARS = {
  primary: { background: `linear-gradient(135deg,${C.teal},${C.tealL})`, color: "#fff", border: "none" },
  blue:    { background: `linear-gradient(135deg,${C.blue},${C.blueL})`, color: "#fff", border: "none" },
  red:     { background: `linear-gradient(135deg,${C.red},${C.redL})`, color: "#fff", border: "none" },
  ghost:   { background: "transparent", color: C.t1, border: `1px solid ${C.bd0}` },
  outline: { background: "transparent", color: C.blueL, border: `1px solid ${C.blueL}88` },
};
const BSIZES = {
  sm:  { padding: "6px 12px", fontSize: FONT.label, borderRadius: RADIUS.md, minHeight: 32 },
  md:  { padding: "8px 18px", fontSize: FONT.body, borderRadius: RADIUS.md, minHeight: 40 },
  lg:  { padding: "10px 24px", fontSize: FONT.body, borderRadius: RADIUS.lg, minHeight: 44 },
};
export const Btn = ({ v="ghost", sz="md", onClick, disabled, loading, children, sx={} }) => (
  <button onClick={onClick} disabled={disabled||loading}
    style={{
      ...BVARS[v],
      ...BSIZES[sz],
      cursor: disabled||loading ? "not-allowed" : "pointer",
      opacity: disabled||loading ? 0.5 : 1,
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      fontWeight: 600,
      transition: "all .15s",
      ...sx,
    }}>
    {loading ? "⏳ " : ""}{children}
  </button>
);

// ── Input / TA / Sel ─────────────────────────────────────────────
const BASE_INPUT = {
  background: C.bg3,
  border: `1px solid ${C.bd0}`,
  borderRadius: RADIUS.md,
  padding: "10px 14px",
  color: C.t0,
  fontSize: FONT.body,
  width: "100%",
  minHeight: 44,
  fontFamily: "'Plus Jakarta Sans',sans-serif",
  outline: "none",
  transition: "border-color .15s, box-shadow .15s",
};
export const Input = ({ value, onChange, placeholder, type="text", disabled }) => (
  <input type={type} value={value||""} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} disabled={disabled} style={BASE_INPUT}
    onFocus={e=>{ e.target.style.borderColor=C.blueL; e.target.style.boxShadow=`0 0 0 3px ${C.blue}30`; }}
    onBlur={e=>{ e.target.style.borderColor=C.bd0; e.target.style.boxShadow="none"; }}/>
);
export const TA = ({ value, onChange, placeholder, rows=3, disabled }) => (
  <textarea value={value||""} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} rows={rows} disabled={disabled}
    style={{ ...BASE_INPUT, resize:"vertical", lineHeight:1.6, minHeight:80 }}/>
);

export const DatePicker = ({ value, onChange, placeholder = "Chọn ngày...", disabled, mode = "single", enableTime = false }) => {
  return (
    <Flatpickr
      value={value}
      onChange={(dates, dateStr) => onChange(dateStr)}
      options={{
        mode,
        enableTime,
        locale: Vietnamese,
        dateFormat: enableTime ? "d/m/Y H:i" : "d/m/Y",
        altInput: false,
        disableMobile: true
      }}
      disabled={disabled}
      placeholder={placeholder}
      style={BASE_INPUT}
      className={disabled ? "flatpickr-disabled" : ""}
    />
  );
};

export const Sel = ({ value, onChange, options=[], disabled, placeholder="Chọn một mục...", allowAdd=true }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = options.find(o => String(o[0]) === String(value))?.[1] || (value || placeholder);
  const filtered = options.filter(o => String(o[1]).toLowerCase().includes(q.toLowerCase()));
  const exactMatch = options.find(o => String(o[1]).toLowerCase() === q.toLowerCase());

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div 
        onClick={() => !disabled && setOpen(!open)}
        style={{ ...BASE_INPUT, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
      >
        <span style={{ color: value ? C.t0 : C.t2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedLabel}</span>
        <span style={{ color: C.t2, fontSize: 10 }}>▼</span>
      </div>
      {open && (
         <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999, background: C.bg2, border: `1px solid ${C.bd1}`, borderRadius: RADIUS.md, marginTop: 4, padding: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.6)"}}>
           <input 
             autoFocus 
             value={q} 
             onChange={e => setQ(e.target.value)} 
             placeholder="🔍 Tìm nhanh hoặc gõ chữ mới..." 
             style={{ width: "100%", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, padding: "8px 10px", color: C.t0, outline: "none", marginBottom: 6, fontSize: FONT.body, fontFamily: "'Plus Jakarta Sans',sans-serif" }} 
           />
           <div style={{ maxHeight: 220, overflowY: "auto" }}>
             {filtered.length === 0 && !q.trim() && <div style={{ padding: "8px 10px", color: C.t2, fontSize: FONT.caption }}>Không có kết quả.</div>}
             {filtered.map(([v, l]) => (
               <div 
                 key={v} 
                 onClick={() => { onChange(v); setOpen(false); setQ(""); }}
                 style={{ padding: "8px 10px", borderRadius: RADIUS.sm, cursor: "pointer", background: String(v) === String(value) ? `${C.blue}20` : "transparent", color: String(v) === String(value) ? C.blueL : C.t0, transition: "background .15s" }}
                 onMouseEnter={e => { if(String(v) !== String(value)) e.currentTarget.style.background = C.bg3; }}
                 onMouseLeave={e => { if(String(v) !== String(value)) e.currentTarget.style.background = "transparent"; }}
               >
                 {l}
               </div>
             ))}
             {allowAdd && q.trim() && !exactMatch && (
               <div 
                 onClick={() => { onChange(q.trim()); setOpen(false); setQ(""); }}
                 style={{ marginTop: 4, padding: "8px 10px", borderRadius: RADIUS.sm, cursor: "pointer", background: `${C.teal}20`, border: `1px dashed ${C.tealL}`, color: C.tealL, transition: "background .15s" }}
                 onMouseEnter={e => e.currentTarget.style.background = `${C.teal}30`}
                 onMouseLeave={e => e.currentTarget.style.background = `${C.teal}20`}
               >
                 ＋ <b>Thêm:</b> {q.trim()}
               </div>
             )}
           </div>
         </div>
      )}
    </div>
  );
};
export const Num = ({ value, onChange, min=0, max=100, step=1 }) => (
  <input type="number" value={value||""} onChange={e=>onChange(Number(e.target.value))}
    min={min} max={max} step={step} style={{ ...BASE_INPUT, width: 100 }}/>
);

// ── Field / Grid ─────────────────────────────────────────────────
export const Field = ({ label, required, children, sx={} }) => (
  <div style={{ display:"flex", flexDirection:"column", gap: SPACE.sm, ...sx }}>
    {label && (
      <span style={{
        fontSize: FONT.label,
        fontWeight: 600,
        color: C.t1,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </span>
    )}
    {children}
  </div>
);
export const Grid = ({ cols, gap=SPACE.lg, minCol="260px", children }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: cols ? `repeat(auto-fit, minmax(min(100%, max(${minCol}, calc(100% / ${cols} - ${gap}px))), 1fr))` : `repeat(auto-fill, minmax(min(100%, ${minCol}), 1fr))`,
    gap,
  }}>{children}</div>
);
export const Rule = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap: SPACE.sm, margin: `${SPACE.md}px 0` }}>
    <div style={{ height: 1, flex: 1, background: C.bd0 }}/>
    {label && <span style={{ fontSize: FONT.label, color: C.t1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>}
    <div style={{ height: 1, flex: 1, background: C.bd0 }}/>
  </div>
);

// ── Card ─────────────────────────────────────────────────────────
export const Card = ({ title, icon, accent, children, collapsed, onToggle, badge }) => (
  <div style={{
    background: C.bg2,
    borderRadius: RADIUS.xl,
    border: `1px solid ${(accent||C.blue)}45`,
    boxShadow: `0 1px 3px rgba(0,0,0,.2)`,
    overflow: "hidden",
    marginBottom: SPACE.lg,
  }}>
    <div onClick={onToggle} style={{
      padding: `${SPACE.md}px ${SPACE.lg}px`,
      background: `${accent||C.blue}18`,
      borderBottom: `1px solid ${(accent||C.blue)}40`,
      display: "flex", alignItems: "center", gap: SPACE.sm,
      cursor: onToggle ? "pointer" : "default",
    }}>
      {icon && <span style={{ fontSize: FONT.display }}>{icon}</span>}
      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: FONT.title, fontWeight: 700, color: C.t0, flex: 1 }}>{title}</span>
      {badge && <Tag c={accent||C.blue}>{badge}</Tag>}
      {onToggle && <span style={{ color: C.t2, fontSize: FONT.body }}>{collapsed ? "▶" : "▼"}</span>}
    </div>
    {!collapsed && <div style={{ padding: SPACE.lg }}>{children}</div>}
  </div>
);

// ── Tag ──────────────────────────────────────────────────────────
export const Tag = ({ c=C.blue, children, sm }) => (
  <span style={{
    background: `${c}1a`,
    color: c,
    border: `1px solid ${c}35`,
    borderRadius: RADIUS.sm,
    padding: sm ? "2px 6px" : "4px 10px",
    fontSize: sm ? FONT.caption : FONT.label,
    fontWeight: 600,
  }}>
    {children}
  </span>
);

// ── ScorePicker — 0 to 5 ─────────────────────────────────────────
export const ScorePicker = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: SPACE.sm, flexWrap: "wrap" }}>
    {Object.entries(SCORE_CFG).map(([s, cfg]) => (
      <button key={s} onClick={() => onChange(Number(s))}
        style={{
          padding: "6px 12px",
          borderRadius: RADIUS.md,
          border: `1px solid ${cfg.col}50`,
          background: Number(s) === value ? cfg.col : cfg.bg,
          color: Number(s) === value ? "#fff" : cfg.col,
          fontSize: FONT.label,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all .15s",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}>
        {s}{s !== "0" && ` — ${cfg.short}`}
      </button>
    ))}
  </div>
);

// ── RiskSlider (1–5) ─────────────────────────────────────────────
export const RiskSlider = ({ label, value, onChange, cols }) => (
  <div>
    <div style={{ fontSize: FONT.label, fontWeight: 700, color: C.t2, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ display:"flex", gap:3 }}>
      {(cols||[1,2,3,4,5]).map(v => {
        const col = v<=2?C.teal:v<=3?C.amber:v<=4?C.orange:C.red;
        return (
          <button key={v} onClick={() => onChange(v)}
            style={{ flex:1, padding:"4px 0", borderRadius:5, border:`1px solid ${col}40`,
              background:v===value?col:`${col}12`, color:v===value?"#fff":col,
              fontSize: FONT.caption, fontWeight: 700, cursor: "pointer" }}>
            {v}
          </button>
        );
      })}
    </div>
    {value > 0 && <div style={{ fontSize: FONT.label, color: C.t2, marginTop: 3 }}>
      {(cols||[0,0,"Trung bình","Cao","Nghiêm trọng"])[value-1]||value}
    </div>}
  </div>
);

// ── Toast ────────────────────────────────────────────────────────
export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  const col = toast.type === "success" ? C.teal : toast.type === "error" ? C.red : C.orange;
  return (
    <div className="fade-in" style={{
      position: "fixed",
      top: 24,
      right: 24,
      zIndex: 10000,
      background: C.bg2,
      border: `1px solid ${col}50`,
      borderRadius: RADIUS.lg,
      padding: `${SPACE.md}px ${SPACE.lg}px`,
      boxShadow: `0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px ${col}30`,
      display: "flex", alignItems: "center", gap: SPACE.md,
      maxWidth: 420
    }}>
      <span style={{ fontSize: 24 }}>{toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}</span>
      <span style={{ flex: 1, fontSize: FONT.body, color: C.t0, fontWeight: 500, lineHeight: 1.4 }}>{toast.msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: C.t2, cursor: "pointer", fontSize: 20 }}>✕</button>
    </div>
  );
};

// ── KPIBar ───────────────────────────────────────────────────────
export const KPIBar = ({ items }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  }}>
    {items.map(({ label, value, col=C.blue, icon }) => (
      <div key={label} style={{
        background: `${col}12`,
        border: `1px solid ${col}28`,
        borderRadius: RADIUS.lg,
        padding: `${SPACE.md}px ${SPACE.sm}px`,
        textAlign: "center",
      }}>
        {icon && <div style={{ fontSize: 18, marginBottom: SPACE.xs }}>{icon}</div>}
        <div style={{ fontSize: 20, fontWeight: 700, color: col, fontFamily: "'Rajdhani',sans-serif" }}>{value}</div>
        <div style={{ fontSize: FONT.label, color: C.t2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", marginTop: 2 }}>{label}</div>
      </div>
    ))}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, width = 560 }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        padding: 24,
      }}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="fade-in"
        style={{
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflow: "auto",
          background: C.bg2,
          borderRadius: RADIUS.xl,
          border: `2px solid ${C.bd0}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,.06)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${SPACE.lg}px ${SPACE.xl}px`,
          borderBottom: `2px solid ${C.bd0}`,
          background: C.bg3,
        }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: FONT.lead, fontWeight: 700, color: C.t0 }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: C.t1, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: SPACE.xl }}>{children}</div>
      </div>
    </div>
  );
};

// ── SectionHeader ─────────────────────────────────────────────────
export const SectionHeader = ({ icon, title, badge }) => (
  <div style={{ marginBottom: SPACE.xl }}>
    <div style={{ display: "flex", alignItems: "center", gap: SPACE.md, marginBottom: SPACE.sm }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: FONT.display, fontWeight: 700, color: C.t0 }}>{title}</div>
      {badge && <Tag c={C.blue}>{badge}</Tag>}
    </div>
    <div style={{ height: 3, borderRadius: RADIUS.full, background: `linear-gradient(90deg,${C.blue},${C.tealL}80,transparent)` }}/>
  </div>
);

// ── Checkbox (Tickbox) ───────────────────────────────────────────
export const Checkbox = ({ id, label, checked, onChange, sx={} }) => (
  <div style={{ display:"flex", alignItems:"flex-start", gap: 8, ...sx }}>
    <input type="checkbox" id={id} checked={!!checked} onChange={e => onChange(e.target.checked)}
      style={{ width: 18, height: 18, accentColor: C.blueL, cursor: "pointer", marginTop: 2, flexShrink: 0 }} />
    <label htmlFor={id} style={{ cursor: "pointer", fontSize: FONT.body, color: C.t0, lineHeight: 1.5, userSelect: "none" }}>
      {label}
    </label>
  </div>
);

// ── QuickHints (Gợi ý nhanh) ─────────────────────────────────────
export const QuickHints = ({ hints=[], onSelect }) => {
  if (!hints || hints.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
      {hints.map((h, i) => (
        <span key={i} onClick={() => onSelect(h)}
          style={{ background: C.bg3, border: `1px dashed ${C.bd0}`, padding: "2px 8px", borderRadius: RADIUS.full, fontSize: FONT.caption, color: C.t2, ...{cursor: "pointer", transition: "all 0.2s", userSelect: "none"} }}
          onMouseEnter={e => { e.target.style.background = `${C.blue}22`; e.target.style.borderColor = C.blueL; e.target.style.color = C.blueL; }}
          onMouseLeave={e => { e.target.style.background = C.bg3; e.target.style.borderColor = C.bd0; e.target.style.color = C.t2; }}
        >
          {h}
        </span>
      ))}
    </div>
  );
};
