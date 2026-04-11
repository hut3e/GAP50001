/**
 * StepProcess_Onsite — Tiếp cận theo quá trình (Process Approach)
 * Đánh giá 9 quá trình EnMS chính, câu hỏi kỹ thuật, tài liệu yêu cầu, bằng chứng
 */
import { useState, useMemo } from "react";
import EvidencePanel from "./EvidencePanel";
import { PROCESS_MAP, C } from "./OnsiteAuditConstants";

const inp = {
  background:C.bg3, border:`1px solid ${C.bd}`, borderRadius:6,
  color:C.t0, fontSize:12, padding:"7px 10px", outline:"none",
  width:"100%", boxSizing:"border-box",
};

const CONFORMANCE = [
  { v:"conform",     label:"✅ Phù hợp",            col:"#22c55e" },
  { v:"minor_nc",    label:"⚠️ Không phù hợp nhỏ", col:"#f59e0b" },
  { v:"major_nc",    label:"🚨 Không phù hợp lớn",  col:"#ef4444" },
  { v:"observation", label:"👁 Quan sát",            col:"#60a5fa" },
  { v:"na",          label:"➖ Không áp dụng",       col:"#718096" },
];

function ConformBtn({ v, current, onChange }) {
  const cfg = CONFORMANCE.find(c => c.v === v);
  const active = v === current;
  return (
    <button onClick={() => onChange(v === current ? "" : v)} title={cfg.label}
      style={{
        padding:"4px 10px", borderRadius:6, fontSize:11.5, fontWeight:700, cursor:"pointer",
        border:`1px solid ${cfg.col}55`,
        background: active ? cfg.col : `${cfg.col}18`,
        color: active ? "#fff" : cfg.col,
        whiteSpace:"nowrap",
      }}>
      {cfg.label}
    </button>
  );
}

function ProcessCard({ proc, data, onUpdate, evHook, expanded, onToggle }) {
  const d       = data || {};
  const stepKey = `proc-${proc.id}`;
  const conf    = CONFORMANCE.find(c => c.v === d.conformance);

  return (
    <div style={{
      background:C.bg2, borderRadius:10, marginBottom:8,
      border:`1px solid ${conf ? conf.col+"50" : C.bd}`,
      borderLeft:`4px solid ${conf ? conf.col : C.t3}`,
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px",
        cursor:"pointer" }} onClick={onToggle}>
        <span style={{ color:C.blueL, fontWeight:800, fontSize:12, minWidth:52, flexShrink:0 }}>
          {proc.id}
        </span>
        <div style={{ flex:1 }}>
          <p style={{ color:C.t0, fontSize:13, margin:0, fontWeight:600 }}>{proc.name}</p>
          <p style={{ color:C.t2, fontSize:11, margin:0 }}>
            👤 {proc.owner} · 🔄 {proc.freq}
          </p>
        </div>
        <span style={{ fontSize:10, color:C.skyL, background:`${C.skyL}15`,
          borderRadius:4, padding:"1px 7px", flexShrink:0 }}>§{proc.clause}</span>
        {conf && (
          <span style={{ background:`${conf.col}18`, color:conf.col, border:`1px solid ${conf.col}44`,
            borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700, flexShrink:0 }}>
            {conf.label}
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
          {/* Conformance assessment */}
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.t2, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:8 }}>Đánh giá sự phù hợp:</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {CONFORMANCE.map(c => (
                <ConformBtn key={c.v} v={c.v} current={d.conformance||""}
                  onChange={v => onUpdate(proc.id,"conformance",v)}/>
              ))}
            </div>
          </div>

          {/* Audit questions */}
          {proc.questions?.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ color:C.amberL, fontSize:11, fontWeight:700,
                textTransform:"uppercase", marginBottom:6 }}>🔍 Câu hỏi đánh giá quá trình:</p>
              {proc.questions.map((q, i) => (
                <div key={i} style={{ marginBottom:10 }}>
                  <p style={{ color:C.t1, fontSize:12, marginBottom:4,
                    paddingLeft:12, borderLeft:`2px solid ${C.amberL}40` }}>
                    {i+1}. {q}
                  </p>
                  <input value={(d.answers||{})[i]||""}
                    onChange={e => onUpdate(proc.id, "answers",
                      { ...(d.answers||{}), [i]:e.target.value })}
                    placeholder="Ghi nhận câu trả lời tại hiện trường…"
                    style={{ ...inp, marginLeft:12 }}/>
                </div>
              ))}
            </div>
          )}

          {/* Document checklist */}
          {proc.docRequired?.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ color:C.t2, fontSize:11, fontWeight:700,
                textTransform:"uppercase", marginBottom:8 }}>📂 Tài liệu yêu cầu:</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {proc.docRequired.map(doc => {
                  const ok = (d.docsReceived||[]).includes(doc);
                  return (
                    <label key={doc} style={{
                      cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                      background: ok ? `${C.greenL}15` : `${C.redL}15`,
                      border:`1px solid ${ok ? C.greenL+"44" : C.redL+"44"}`,
                      borderRadius:6, padding:"4px 10px", fontSize:12,
                      color: ok ? C.greenL : C.t1,
                    }}>
                      <input type="checkbox" checked={ok}
                        onChange={e => {
                          const arr = [...(d.docsReceived||[])];
                          if (e.target.checked) arr.push(doc);
                          else arr.splice(arr.indexOf(doc),1);
                          onUpdate(proc.id, "docsReceived", arr);
                        }}/>
                      {ok?"✅":"❌"} {doc}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Finding + Recommendation */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4 }}>📝 Phát hiện</label>
              <textarea value={d.finding||""} rows={3}
                onChange={e => onUpdate(proc.id,"finding",e.target.value)}
                placeholder="Mô tả phát hiện tại hiện trường…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4 }}>💡 Khuyến nghị</label>
              <textarea value={d.recommendation||""} rows={3}
                onChange={e => onUpdate(proc.id,"recommendation",e.target.value)}
                placeholder="Khuyến nghị cải tiến quá trình…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
          </div>

          {/* Evidence */}
          <div style={{ background:C.bg3, borderRadius:8, padding:"10px 12px",
            border:`1px solid ${C.bd}` }}>
            <p style={{ color:C.t2, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:6 }}>
              📎 Bằng chứng — {proc.id}: {proc.name}
            </p>
            <EvidencePanel evHook={evHook} stepKey={stepKey}
              clauseId={proc.clause} note={proc.name} compact/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function StepProcess_Onsite({ processData, onUpdate, evHook, onSave, saving }) {
  const [expanded, setExpanded] = useState({});
  const toggle = id => setExpanded(e => ({ ...e, [id]:!e[id] }));

  const handleUpdate = (procId, field, val) => {
    onUpdate("process_gaps", procId, { ...(processData[procId]||{}), [field]:val });
  };

  const summary = useMemo(() => {
    const counts = { conform:0, minor_nc:0, major_nc:0, observation:0, pending:0 };
    PROCESS_MAP.forEach(p => {
      const c = processData[p.id]?.conformance;
      if (!c) counts.pending++;
      else if (counts[c] !== undefined) counts[c]++;
      else counts.pending++;
    });
    return counts;
  }, [processData]);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { l:"Phù hợp",        v:summary.conform,     col:"#22c55e" },
          { l:"NC nhỏ",         v:summary.minor_nc,    col:"#f59e0b" },
          { l:"NC lớn",         v:summary.major_nc,    col:"#ef4444" },
          { l:"Quan sát",       v:summary.observation, col:"#60a5fa" },
          { l:"Chưa đánh giá",  v:summary.pending,     col:C.t2     },
        ].map(k => (
          <div key={k.l} style={{ background:`${k.col}14`, border:`1px solid ${k.col}30`,
            borderRadius:10, padding:"10px 14px", textAlign:"center", minWidth:90 }}>
            <div style={{ fontSize:20, fontWeight:800, color:k.col }}>{k.v}</div>
            <div style={{ fontSize:10, color:C.t2, fontWeight:700, textTransform:"uppercase" }}>{k.l}</div>
          </div>
        ))}
        <button onClick={onSave} disabled={saving}
          style={{ marginLeft:"auto", padding:"8px 20px", background:saving?C.t3:C.tealL,
            color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          {saving ? "⏳ Đang lưu…" : "💾 Lưu quá trình"}
        </button>
      </div>

      {/* Expand all */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <button onClick={() => {
          const n={};PROCESS_MAP.forEach(p=>{n[p.id]=true;});setExpanded(n);
        }} style={{ padding:"6px 14px", background:`${C.blue}22`, border:`1px solid ${C.blue}44`,
          color:C.blueL, borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
          Mở rộng tất cả
        </button>
        <button onClick={()=>setExpanded({})}
          style={{ padding:"6px 14px", background:"transparent", border:`1px solid ${C.bd}`,
            color:C.t2, borderRadius:8, fontSize:12, cursor:"pointer" }}>
          Thu gọn
        </button>
      </div>

      {PROCESS_MAP.map(proc => (
        <ProcessCard key={proc.id} proc={proc}
          data={processData[proc.id]}
          onUpdate={handleUpdate}
          evHook={evHook}
          expanded={!!expanded[proc.id]}
          onToggle={() => toggle(proc.id)}/>
      ))}
    </div>
  );
}
