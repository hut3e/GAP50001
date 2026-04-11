/**
 * ISO50001Gap — frontend/StepRisk.jsx
 * Step 3: Risk Matrix Assessment (5×5)
 */
import { useMemo, useState } from "react";
import { C, RISK_CATEGORIES, RISK_LIKELIHOOD, RISK_IMPACT } from "./gap.ui.constants.js";
import { Card, Tag, KPIBar, Field, TA, Input, Sel } from "./gap.atoms.jsx";

const riskLevel = (l, i) => {
  const v = l * i;
  if (v >= 16) return { label:"NGHIÊM TRỌNG", col:C.red,    bg:`${C.red}15`,    icon:"🔴" };
  if (v >= 9)  return { label:"CAO",           col:C.orange, bg:`${C.orange}12`, icon:"🟠" };
  if (v >= 4)  return { label:"TRUNG BÌNH",    col:C.amber,  bg:`${C.amber}12`,  icon:"🟡" };
  return               { label:"THẤP",          col:C.green,  bg:`${C.green}12`,  icon:"🟢" };
};

export default function StepRisk({ survey, setSurvey }) {
  const [open, setOpen] = useState({ "RISK-LEG":true });
  const rd = survey.risk_assessments || {};

  const setRisk = (id, field, val) =>
    setSurvey(p => ({ ...p, risk_assessments:{ ...p.risk_assessments, [id]:{ ...p.risk_assessments[id], [field]:val }}}));

  const stats = useMemo(() => {
    const all = RISK_CATEGORIES.flatMap(c=>c.items);
    const assessed = all.filter(r => (rd[r.id]?.likelihood||0) > 0);
    const high  = assessed.filter(r => (rd[r.id]?.likelihood*rd[r.id]?.impact) >= 9).length;
    const crit  = assessed.filter(r => (rd[r.id]?.likelihood*rd[r.id]?.impact) >= 16).length;
    return { total:all.length, assessed:assessed.length, high, crit };
  }, [rd]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <KPIBar items={[
        { label:"Tổng rủi ro",      value:`${stats.assessed}/${stats.total}`, col:C.blue,   icon:"📊" },
        { label:"Nghiêm trọng",     value:stats.crit,  col:C.red,    icon:"🔴" },
        { label:"Cao",              value:stats.high - stats.crit, col:C.orange, icon:"🟠" },
      ]}/>

      {/* 5x5 heat map legend */}
      <div style={{ background:C.bg2, borderRadius:9, padding:12, border:`1px solid ${C.bd0}` }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.t1, marginBottom:8 }}>
          📐 Mức độ rủi ro = Khả năng xảy ra (L) × Ảnh hưởng (I) — thang 1–5
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[
            ["1–3","🟢 THẤP — Chấp nhận, theo dõi định kỳ",C.green],
            ["4–8","🟡 TRUNG BÌNH — Kiểm soát, lập kế hoạch",C.amber],
            ["9–15","🟠 CAO — Hành động trong 3 tháng",C.orange],
            ["16–25","🔴 NGHIÊM TRỌNG — Hành động ngay",C.red],
          ].map(([r,l,c])=>(
            <div key={r} style={{ background:`${c}12`, border:`1px solid ${c}25`,
              borderRadius:5, padding:"4px 9px", fontSize:11, color:c, fontWeight:700 }}>
              L×I = {r} → {l}
            </div>
          ))}
        </div>
      </div>

      {RISK_CATEGORIES.map(cat => {
        const isOpen = !!open[cat.id];
        const catItems = cat.items;
        const assessed = catItems.filter(r=>(rd[r.id]?.likelihood||0)>0);
        const topRisk = assessed.reduce((a,r) => {
          const v = (rd[r.id]?.likelihood||0)*(rd[r.id]?.impact||0);
          return v > a ? v : a;
        }, 0);
        const topRL = topRisk > 0 ? riskLevel(Math.min(topRisk,5),1) : null; // approximate

        return (
          <div key={cat.id} style={{ background:C.bg2, borderRadius:10, overflow:"hidden",
            border:`1px solid ${cat.col}30` }}>
            <div onClick={()=>setOpen(p=>({...p,[cat.id]:!isOpen}))}
              style={{ padding:"10px 14px", background:`${cat.col}15`,
                borderBottom:isOpen?`1px solid ${cat.col}25`:"none",
                display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:700,
                color:C.t0, flex:1 }}>{cat.name}</span>
              <span style={{ fontSize:11, color:C.t2 }}>{assessed.length}/{catItems.length} đánh giá</span>
              {topRisk >= 9 && (
                <Tag c={topRisk>=16?C.red:C.orange}>
                  {topRisk>=16?"🔴 Có rủi ro nghiêm trọng":"🟠 Có rủi ro cao"}
                </Tag>
              )}
              <span style={{ color:C.t2 }}>{isOpen?"▼":"▶"}</span>
            </div>

            {isOpen && (
              <div style={{ padding:14, display:"flex", flexDirection:"column", gap:10 }}>
                {catItems.map(risk => {
                  const r = rd[risk.id] || {};
                  const l = r.likelihood || 0;
                  const imp = r.impact || 0;
                  const lxi = l && imp ? l * imp : 0;
                  const rl = lxi ? riskLevel(l, imp) : null;

                  return (
                    <div key={risk.id} style={{ background:lxi>=9?`${rl?.col}08`:C.bg3,
                      border:`1px solid ${lxi>=9?rl?.col:C.bd2}25`, borderRadius:8, padding:10 }}>
                      {/* Risk header */}
                      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:10.5,
                          color:C.blueL, flexShrink:0, marginTop:2 }}>{risk.id}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, color:C.t0, fontWeight:500, lineHeight:1.5 }}>{risk.risk}</div>
                          <Tag c={C.red} sx={{ marginTop:3 }}>⚖️ {risk.ref}</Tag>
                        </div>
                        {lxi > 0 && (
                          <div style={{ textAlign:"center", flexShrink:0 }}>
                            <div style={{ background:rl.bg, border:`1px solid ${rl.col}30`,
                              borderRadius:6, padding:"4px 10px" }}>
                              <div style={{ fontSize:20, fontWeight:800, color:rl.col,
                                fontFamily:"'Rajdhani',sans-serif" }}>{lxi}</div>
                              <div style={{ fontSize:9.5, color:rl.col, fontWeight:700 }}>{rl.label}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* L × I pickers */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:C.t2, marginBottom:4, textTransform:"uppercase" }}>
                            Khả năng xảy ra (L)
                          </div>
                          <div style={{ display:"flex", gap:3 }}>
                            {[1,2,3,4,5].map(v => {
                              const c = v<=2?C.tealL:v<=3?C.amber:v<=4?C.orange:C.red;
                              return (
                                <button key={v} onClick={()=>setRisk(risk.id,"likelihood",v)}
                                  style={{ flex:1, padding:"5px 0", borderRadius:5,
                                    border:`1px solid ${c}40`,
                                    background:v===l?c:`${c}10`,
                                    color:v===l?"#fff":c, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                                  {v}
                                </button>
                              );
                            })}
                          </div>
                          {l>0 && <div style={{ fontSize:10, color:C.t2, marginTop:2 }}>
                            {RISK_LIKELIHOOD[l-1]?.l}
                          </div>}
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:C.t2, marginBottom:4, textTransform:"uppercase" }}>
                            Mức độ ảnh hưởng (I)
                          </div>
                          <div style={{ display:"flex", gap:3 }}>
                            {[1,2,3,4,5].map(v => {
                              const c = v<=2?C.tealL:v<=3?C.amber:v<=4?C.orange:C.red;
                              return (
                                <button key={v} onClick={()=>setRisk(risk.id,"impact",v)}
                                  style={{ flex:1, padding:"5px 0", borderRadius:5,
                                    border:`1px solid ${c}40`,
                                    background:v===imp?c:`${c}10`,
                                    color:v===imp?"#fff":c, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                                  {v}
                                </button>
                              );
                            })}
                          </div>
                          {imp>0 && <div style={{ fontSize:10, color:C.t2, marginTop:2 }}>
                            {RISK_IMPACT[imp-1]?.l}
                          </div>}
                        </div>
                      </div>

                      {/* Control and recommendation */}
                      {lxi > 0 && (
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                          <div>
                            <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:3, textTransform:"uppercase" }}>
                              Biện pháp kiểm soát hiện tại
                            </div>
                            <textarea value={r.control||""} onChange={e=>setRisk(risk.id,"control",e.target.value)}
                              placeholder="Mô tả biện pháp kiểm soát đang áp dụng..."
                              rows={2} style={{ width:"100%", background:C.bg4,
                                border:`1px solid ${C.bd0}`, borderRadius:5, padding:"5px 8px",
                                color:C.t0, fontSize:11.5, resize:"vertical", fontFamily:"inherit" }}/>
                          </div>
                          <div>
                            <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:3, textTransform:"uppercase" }}>
                              Đề xuất cải thiện
                            </div>
                            <textarea value={r.recommendation||""} onChange={e=>setRisk(risk.id,"recommendation",e.target.value)}
                              placeholder={lxi>=9?"Hành động ưu tiên cần thực hiện ngay...":"Đề xuất cải thiện..."}
                              rows={2} style={{ width:"100%",
                                background:lxi>=9?`${rl?.col}08`:C.bg4,
                                border:`1px solid ${lxi>=9?rl?.col:C.bd0}30`, borderRadius:5, padding:"5px 8px",
                                color:C.t0, fontSize:11.5, resize:"vertical", fontFamily:"inherit" }}/>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
