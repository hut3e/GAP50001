/**
 * StepClauses_Onsite — Đánh giá GAP theo từng điều khoản §4–§10
 * Mỗi clause: chấm điểm 0-5, câu hỏi kỹ thuật, ghi phát hiện, upload bằng chứng
 */
import { useState, useMemo } from "react";
import EvidencePanel from "./EvidencePanel";
import { GAP_CHECKLIST, SCORE_CFG, CAT_CFG, CLAUSE_GROUPS, C } from "./OnsiteAuditConstants";

const inp = {
  background:C.bg3, border:`1px solid ${C.bd}`, borderRadius:8,
  color:C.t0, fontSize:12, padding:"7px 10px", outline:"none",
  width:"100%", boxSizing:"border-box",
};

// ── Score badge button ────────────────────────────────────────────
function ScoreBtn({ s, current, onChange }) {
  const cfg = SCORE_CFG[s];
  const active = s === current;
  return (
    <button onClick={() => onChange(s === current ? 0 : s)} title={cfg.label}
      style={{
        padding:"3px 10px", borderRadius:6, fontSize:11.5, fontWeight:700, cursor:"pointer",
        border:`1px solid ${cfg.col}55`,
        background: active ? cfg.col : `${cfg.col}15`,
        color: active ? "#fff" : cfg.col,
        transition:"all .12s",
      }}>
      {s === 0 ? "N/A" : s}
    </button>
  );
}

// ── Clause card ───────────────────────────────────────────────────
function ClauseCard({ item, response, onUpdate, evHook, expanded, onToggle }) {
  const r    = response || {};
  const score = r.score || 0;
  const scfg  = SCORE_CFG[score];
  const cat   = CAT_CFG[item.cat] || {};
  const evList = evHook.getByStep(item.id);

  return (
    <div style={{
      background: C.bg2, borderRadius:10, marginBottom:8,
      border:`1px solid ${score > 0 ? scfg.col + "50" : C.bd}`,
      borderLeft: `4px solid ${score > 0 ? scfg.col : C.t3}`,
    }}>
      {/* ── Header row ─────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px",
        cursor:"pointer" }} onClick={onToggle}>
        <span style={{ color:C.blueL, fontWeight:800, fontSize:12, minWidth:44, flexShrink:0 }}>
          §{item.clause}
        </span>
        <span style={{ flex:1, color:C.t0, fontSize:13, lineHeight:1.4 }}>{item.title}</span>
        <span title={cat.label} style={{ fontSize:14, flexShrink:0 }}>{cat.icon}</span>
        {item.legal && (
          <span style={{ fontSize:10, color:C.amberL, background:`${C.amberL}15`,
            borderRadius:4, padding:"1px 6px", flexShrink:0, whiteSpace:"nowrap" }}>
            {item.legal}
          </span>
        )}
        {/* Score buttons */}
        <div style={{ display:"flex", gap:4, flexShrink:0 }} onClick={e => e.stopPropagation()}>
          {[0,1,2,3,4,5].map(s => (
            <ScoreBtn key={s} s={s} current={score}
              onChange={v => onUpdate(item.id, "score", v)}/>
          ))}
        </div>
        {evList.length > 0 && (
          <span style={{ background:`${C.tealL}20`, color:C.tealL, borderRadius:4,
            padding:"1px 7px", fontSize:11, fontWeight:700, flexShrink:0 }}>
            📎 {evList.length}
          </span>
        )}
        <span style={{ color:C.t2, fontSize:14, flexShrink:0 }}>{expanded ? "▾" : "▸"}</span>
      </div>

      {/* ── Expanded body ────────────────────────────────────────── */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.bd}`, padding:"14px 16px" }}>
          {/* Audit questions */}
          {item.auditQuestions?.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ color:C.amberL, fontSize:11, fontWeight:700,
                textTransform:"uppercase", marginBottom:6 }}>🔍 Câu hỏi đánh giá:</p>
              {item.auditQuestions.map((q, i) => (
                <p key={i} style={{ color:C.t1, fontSize:12, marginBottom:4,
                  paddingLeft:12, borderLeft:`2px solid ${C.amberL}40` }}>
                  {i+1}. {q}
                </p>
              ))}
            </div>
          )}

          {/* Findings + Recommendations */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4 }}>
                📝 Phát hiện / Bằng chứng ghi nhận
              </label>
              <textarea value={r.note||""} rows={3} onChange={e => onUpdate(item.id, "note", e.target.value)}
                placeholder="Mô tả hiện trạng, tài liệu kiểm tra, tình trạng tuân thủ…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, color:C.t2, fontWeight:700,
                textTransform:"uppercase", marginBottom:4 }}>
                💡 Khuyến nghị cải tiến
              </label>
              <textarea value={r.recommendation||""} rows={3}
                onChange={e => onUpdate(item.id, "recommendation", e.target.value)}
                placeholder="Khuyến nghị cho tổ chức…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
          </div>

          {/* Score label */}
          {score > 0 && (
            <div style={{ marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ height:8, flex:1, background:C.bg3, borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${score/5*100}%`,
                  background:scfg.col, borderRadius:4, transition:"width .3s" }}/>
              </div>
              <span style={{ fontSize:12, color:scfg.col, fontWeight:700 }}>
                {scfg.label}
              </span>
            </div>
          )}

          {/* Evidence panel */}
          <div style={{ background:C.bg3, borderRadius:8, padding:"10px 12px",
            border:`1px solid ${C.bd}` }}>
            <p style={{ color:C.t2, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:6 }}>
              📎 Bằng chứng — §{item.clause} • {item.id}
            </p>
            <EvidencePanel evHook={evHook} stepKey={item.id}
              clauseId={item.clause} note={`§${item.clause} ${item.title}`}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function StepClauses_Onsite({ responses, onUpdate, evHook, onSave, saving }) {
  const [activeGroup, setActiveGroup] = useState("§4");
  const [expanded,    setExpanded   ] = useState({});
  const [search,      setSearch     ] = useState("");

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const expandGroup = (clauses) => {
    const ids = GAP_CHECKLIST.filter(c => clauses.includes(c.clause)).map(c => c.id);
    setExpanded(e => { const n={...e}; ids.forEach(id=>{ n[id]=true; }); return n; });
  };

  const handleScore = (id, field, val) => onUpdate("responses", id, { ...(responses[id]||{}), [field]: val });

  // Filter clauses
  const group = CLAUSE_GROUPS.find(g => g.id === activeGroup) || CLAUSE_GROUPS[0];
  const filtered = useMemo(() => {
    let items = GAP_CHECKLIST.filter(c => group.clauses.includes(c.clause));
    if (search.trim()) {
      const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"), "i");
      items = items.filter(c => re.test(c.title) || re.test(c.clause) || re.test(c.id));
    }
    return items;
  }, [group, search]);

  // Stats
  const stats = useMemo(() => {
    const total = GAP_CHECKLIST.length;
    const scored = GAP_CHECKLIST.filter(c => (responses[c.id]?.score||0) > 0).length;
    const vals   = GAP_CHECKLIST.map(c => responses[c.id]?.score||0).filter(s => s > 0);
    const avg    = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : "—";
    return { total, scored, pct: Math.round(scored/total*100), avg };
  }, [responses]);

  const groupStats = useMemo(() => {
    const res = {};
    CLAUSE_GROUPS.forEach(g => {
      const items = GAP_CHECKLIST.filter(c => g.clauses.includes(c.clause));
      const done  = items.filter(c => (responses[c.id]?.score||0)>0).length;
      const vals  = items.map(c=>responses[c.id]?.score||0).filter(s=>s>0);
      const avg   = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
      res[g.id] = { done, total:items.length, avg };
    });
    return res;
  }, [responses]);

  return (
    <div>
      {/* ── Top KPIs ──────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { l:"Tiến độ",    v:`${stats.pct}%`,          col: stats.pct>=80?C.tealL:stats.pct>=50?C.amberL:C.redL },
          { l:"Đã chấm",    v:`${stats.scored}/${stats.total}`, col:C.blueL },
          { l:"Điểm TB",    v:stats.avg,                 col:C.greenL },
          { l:"Bằng chứng", v:evHook.evidence.length,   col:C.violet },
        ].map(k => (
          <div key={k.l} style={{ background:`${k.col}15`, border:`1px solid ${k.col}30`,
            borderRadius:10, padding:"10px 18px", textAlign:"center", minWidth:100 }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.col }}>{k.v}</div>
            <div style={{ fontSize:10, color:C.t2, fontWeight:700, textTransform:"uppercase" }}>{k.l}</div>
          </div>
        ))}
        <button onClick={onSave} disabled={saving}
          style={{ marginLeft:"auto", padding:"8px 20px", background:saving?C.t3:C.tealL,
            color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          {saving ? "⏳ Đang lưu…" : "💾 Lưu tiến độ"}
        </button>
      </div>

      {/* ── Clause group tabs ─────────────────────────────────── */}
      <div style={{ display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
        {CLAUSE_GROUPS.map(g => {
          const gs = groupStats[g.id] || {};
          const active = activeGroup === g.id;
          return (
            <button key={g.id} onClick={() => setActiveGroup(g.id)} style={{
              padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700,
              border:"none", cursor:"pointer", transition:"all .12s",
              background: active ? g.col : `${g.col}18`,
              color: active ? "#fff" : g.col,
            }}>
              {g.label}
              <span style={{ marginLeft:6, fontSize:10, opacity:.8 }}>
                {gs.done}/{gs.total}
                {gs.avg > 0 && ` · ${gs.avg.toFixed(1)}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search + expand all ───────────────────────────────── */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Tìm điều khoản…"
          style={{ ...inp, width:260 }}/>
        <button onClick={() => expandGroup(group.clauses)}
          style={{ padding:"7px 14px", background:`${C.blue}22`, border:`1px solid ${C.blue}44`,
            color:C.blueL, borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
          Mở rộng tất cả
        </button>
        <button onClick={() => setExpanded({})}
          style={{ padding:"7px 14px", background:`${C.t3}22`, border:`1px solid ${C.bd}`,
            color:C.t2, borderRadius:8, fontSize:12, cursor:"pointer" }}>
          Thu gọn
        </button>
      </div>

      {/* ── Clause list ──────────────────────────────────────── */}
      {filtered.length === 0 && (
        <p style={{ color:C.t2, fontSize:13 }}>Không tìm thấy điều khoản phù hợp.</p>
      )}
      {filtered.map(item => (
        <ClauseCard key={item.id}
          item={item}
          response={responses[item.id]}
          onUpdate={handleScore}
          evHook={evHook}
          expanded={!!expanded[item.id]}
          onToggle={() => toggle(item.id)}/>
      ))}
    </div>
  );
}
