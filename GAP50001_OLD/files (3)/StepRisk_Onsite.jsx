/**
 * StepRisk_Onsite — Tiếp cận theo rủi ro trong Onsite Audit
 * Ma trận rủi ro 5×5, câu hỏi kỹ thuật, biện pháp kiểm soát, upload bằng chứng
 */
import { useState, useMemo } from "react";
import EvidencePanel from "./EvidencePanel";
import { RISK_CATEGORIES, C } from "./OnsiteAuditConstants";

const inp = {
  background:C.bg3, border:`1px solid ${C.bd}`, borderRadius:6,
  color:C.t0, fontSize:12, padding:"7px 10px", outline:"none",
  width:"100%", boxSizing:"border-box",
};

const LIKELIHOOD = [1,2,3,4,5];
const IMPACT     = [1,2,3,4,5];

function riskLevel(l, i) {
  const s = l * i;
  if (s <= 4)  return { label:"Thấp",       col:"#22c55e", bg:"rgba(34,197,94,.13)"  };
  if (s <= 9)  return { label:"Trung bình", col:"#f59e0b", bg:"rgba(245,158,11,.13)" };
  if (s <= 16) return { label:"Cao",        col:"#f97316", bg:"rgba(249,115,22,.13)" };
  return         { label:"Rất cao",         col:"#ef4444", bg:"rgba(239,68,68,.15)"  };
}

function MatrixCell({ l, i, selected, onClick }) {
  const lvl = riskLevel(l, i);
  return (
    <div onClick={() => onClick(l, i)} title={`L${l}×I${i}=${l*i} — ${lvl.label}`}
      style={{
        width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center",
        background: selected ? lvl.col : lvl.bg,
        color: selected ? "#fff" : lvl.col,
        fontSize:11, fontWeight:700, borderRadius:4, cursor:"pointer",
        border: selected ? `2px solid ${lvl.col}` : `1px solid ${lvl.col}44`,
        transition:"all .12s",
      }}>
      {l*i}
    </div>
  );
}

// ── Risk item card ────────────────────────────────────────────────
function RiskCard({ cat, item, assessment, onUpdate, evHook, expanded, onToggle }) {
  const a   = assessment || {};
  const l   = a.likelihood || 0;
  const imp = a.impact     || 0;
  const lvl = l && imp ? riskLevel(l, imp) : null;

  const stepKey = `risk-${item.id}`;

  return (
    <div style={{
      background:C.bg2, borderRadius:10, marginBottom:8,
      border:`1px solid ${lvl ? lvl.col+"50" : C.bd}`,
      borderLeft:`4px solid ${lvl ? lvl.col : C.t3}`,
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px",
        cursor:"pointer" }} onClick={onToggle}>
        <span style={{ color:C.t2, fontWeight:700, fontSize:11, minWidth:52, flexShrink:0 }}>
          {item.id}
        </span>
        <span style={{ flex:1, color:C.t0, fontSize:13 }}>{item.risk}</span>
        {item.ref && (
          <span style={{ fontSize:10, color:C.amberL, background:`${C.amberL}15`,
            borderRadius:4, padding:"1px 6px", flexShrink:0, whiteSpace:"nowrap" }}>
            {item.ref}
          </span>
        )}
        {lvl && (
          <span style={{ background:lvl.bg, color:lvl.col, border:`1px solid ${lvl.col}44`,
            borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, flexShrink:0 }}>
            {lvl.label} · {l}×{imp}={l*imp}
          </span>
        )}
        {evHook.getByStep(stepKey).length > 0 && (
          <span style={{ background:`${C.tealL}20`, color:C.tealL, borderRadius:4,
            padding:"1px 7px", fontSize:11, fontWeight:700, flexShrink:0 }}>
            📎 {evHook.getByStep(stepKey).length}
          </span>
        )}
        <span style={{ color:C.t2, fontSize:14, flexShrink:0 }}>{expanded?"▾":"▸"}</span>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.bd}`, padding:"14px 16px" }}>
          {/* Risk matrix */}
          <div style={{ display:"flex", gap:24, marginBottom:16, flexWrap:"wrap" }}>
            <div>
              <p style={{ color:C.t2, fontSize:11, fontWeight:700,
                textTransform:"uppercase", marginBottom:8 }}>Ma trận rủi ro (click chọn)</p>
              {/* I axis label */}
              <div style={{ display:"flex", gap:6, alignItems:"flex-end" }}>
                <div style={{ width:32 }}>
                  <p style={{ color:C.t2, fontSize:10, writingMode:"vertical-rl",
                    transform:"rotate(180deg)", height:80, textAlign:"center" }}>
                    Tác động →
                  </p>
                </div>
                <div>
                  <div style={{ display:"grid",
                    gridTemplateColumns:"repeat(5,28px)",
                    gridTemplateRows:"repeat(5,28px)", gap:3 }}>
                    {IMPACT.slice().reverse().map(i => LIKELIHOOD.map(ll => (
                      <MatrixCell key={`${ll}${i}`} l={ll} i={i}
                        selected={l===ll && imp===i}
                        onClick={(ll2, i2) => {
                          onUpdate(item.id, "likelihood", ll2);
                          onUpdate(item.id, "impact",     i2);
                        }}/>
                    )))}
                  </div>
                  <div style={{ display:"flex", gap:3, paddingLeft:0, marginTop:4 }}>
                    {LIKELIHOOD.map(ll => (
                      <div key={ll} style={{ width:28, textAlign:"center",
                        color:C.t2, fontSize:10 }}>{ll}</div>
                    ))}
                  </div>
                  <p style={{ color:C.t2, fontSize:10, textAlign:"center", marginTop:2 }}>← Khả năng xảy ra</p>
                </div>
              </div>
            </div>

            {/* Score summary */}
            {l > 0 && imp > 0 && (
              <div style={{ background:lvl.bg, border:`1px solid ${lvl.col}44`,
                borderRadius:10, padding:"14px 20px", minWidth:160 }}>
                <p style={{ color:C.t2, fontSize:11, marginBottom:6 }}>Mức độ rủi ro</p>
                <p style={{ color:lvl.col, fontWeight:800, fontSize:28, margin:0 }}>
                  {l * imp} / 25
                </p>
                <p style={{ color:lvl.col, fontWeight:700, fontSize:14, margin:"4px 0" }}>
                  {lvl.label}
                </p>
                <p style={{ color:C.t2, fontSize:11 }}>L{l} × I{imp}</p>
              </div>
            )}
          </div>

          {/* Audit questions */}
          {item.questions?.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <p style={{ color:C.amberL, fontSize:11, fontWeight:700,
                textTransform:"uppercase", marginBottom:6 }}>🔍 Câu hỏi đánh giá rủi ro:</p>
              {item.questions.map((q, i) => (
                <p key={i} style={{ color:C.t1, fontSize:12, marginBottom:4,
                  paddingLeft:12, borderLeft:`2px solid ${C.amberL}40` }}>
                  {i+1}. {q}
                </p>
              ))}
            </div>
          )}

          {/* Findings, controls, owner */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4 }}>📝 Phát hiện tại hiện trường</label>
              <textarea value={a.finding||""} rows={3}
                onChange={e => onUpdate(item.id,"finding",e.target.value)}
                placeholder="Mô tả bằng chứng rủi ro ghi nhận được…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4 }}>🛡 Biện pháp kiểm soát hiện tại</label>
              <textarea value={a.control||""} rows={3}
                onChange={e => onUpdate(item.id,"control",e.target.value)}
                placeholder="Mô tả các biện pháp kiểm soát đang áp dụng…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4 }}>💡 Khuyến nghị xử lý</label>
              <textarea value={a.recommendation||""} rows={3}
                onChange={e => onUpdate(item.id,"recommendation",e.target.value)}
                placeholder="Biện pháp giảm thiểu rủi ro đề xuất…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4 }}>👤 Bộ phận / Người chịu trách nhiệm</label>
              <input value={a.owner||""} onChange={e => onUpdate(item.id,"owner",e.target.value)}
                placeholder="Phòng ban / Chức danh" style={inp}/>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4, marginTop:10 }}>📅 Hạn xử lý</label>
              <input type="date" value={a.dueDate||""} onChange={e => onUpdate(item.id,"dueDate",e.target.value)}
                style={inp}/>
            </div>
          </div>

          {/* Evidence */}
          <div style={{ background:C.bg3, borderRadius:8, padding:"10px 12px",
            border:`1px solid ${C.bd}` }}>
            <p style={{ color:C.t2, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:6 }}>
              📎 Bằng chứng — Rủi ro {item.id}
            </p>
            <EvidencePanel evHook={evHook} stepKey={stepKey}
              clauseId={item.id} note={`Rủi ro: ${item.risk}`} compact/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function StepRisk_Onsite({ riskData, onUpdate, evHook, onSave, saving }) {
  const [activeCat, setActiveCat] = useState(RISK_CATEGORIES[0].id);
  const [expanded,  setExpanded ] = useState({});
  const toggle = id => setExpanded(e => ({ ...e, [id]:!e[id] }));

  const cat = RISK_CATEGORIES.find(c => c.id === activeCat) || RISK_CATEGORIES[0];

  const handleUpdate = (itemId, field, val) => {
    onUpdate("risk_assessments", itemId, { ...(riskData[itemId]||{}), [field]:val });
  };

  // Summary
  const summary = useMemo(() => {
    let high=0, med=0, low=0, unscored=0;
    RISK_CATEGORIES.forEach(c => c.items.forEach(item => {
      const a = riskData[item.id] || {};
      if (!a.likelihood || !a.impact) { unscored++; return; }
      const s = a.likelihood * a.impact;
      if (s >= 17) high++;
      else if (s >= 10) med++;
      else low++;
    }));
    return { high, med, low, unscored };
  }, [riskData]);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { l:"Rủi ro cao",   v:summary.high,    col:"#ef4444" },
          { l:"Trung bình",   v:summary.med,     col:"#f97316" },
          { l:"Thấp",         v:summary.low,     col:"#22c55e" },
          { l:"Chưa đánh giá",v:summary.unscored,col:C.t2     },
        ].map(k => (
          <div key={k.l} style={{ background:`${k.col}14`, border:`1px solid ${k.col}30`,
            borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:100 }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.col }}>{k.v}</div>
            <div style={{ fontSize:10, color:C.t2, fontWeight:700, textTransform:"uppercase" }}>{k.l}</div>
          </div>
        ))}
        <button onClick={onSave} disabled={saving}
          style={{ marginLeft:"auto", padding:"8px 20px", background:saving?C.t3:C.tealL,
            color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          {saving ? "⏳ Đang lưu…" : "💾 Lưu rủi ro"}
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
        {RISK_CATEGORIES.map(c => {
          const assessed = c.items.filter(i => riskData[i.id]?.likelihood).length;
          return (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
              padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700,
              border:"none", cursor:"pointer",
              background: activeCat===c.id ? c.col : `${c.col}18`,
              color: activeCat===c.id ? "#fff" : c.col,
            }}>
              {c.name}
              <span style={{ marginLeft:6, fontSize:10, opacity:.8 }}>
                {assessed}/{c.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      {cat.items.map(item => (
        <RiskCard key={item.id} cat={cat} item={item}
          assessment={riskData[item.id]}
          onUpdate={handleUpdate}
          evHook={evHook}
          expanded={!!expanded[item.id]}
          onToggle={() => toggle(item.id)}/>
      ))}
    </div>
  );
}
