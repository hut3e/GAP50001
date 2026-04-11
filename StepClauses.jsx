/**
 * ISO50001Gap — frontend/StepClauses.jsx
 * Step 2: §4–§10 Clause-by-clause gap scoring
 */
import { useState, useMemo } from "react";
import { C, GAP_CHECKLIST, SCORE_CFG, CAT_CFG, WEIGHT_CFG } from "./gap.ui.constants.js";
import { Card, Tag, ScorePicker, Field, TA, Input, KPIBar, Rule } from "./gap.atoms.jsx";

const CLAUSES = [
  { num:"§4", name:"Bối cảnh tổ chức",          col:C.blue,   icon:"🌐", subs:["4.1","4.2","4.3","4.4"] },
  { num:"§5", name:"Lãnh đạo",                   col:C.violet, icon:"👥", subs:["5.1","5.2","5.3"] },
  { num:"§6", name:"Hoạch định",                 col:C.teal,   icon:"📊", subs:["6.1","6.2","6.3","6.4","6.5","6.6"] },
  { num:"§7", name:"Hỗ trợ",                     col:C.greenL, icon:"🛠️", subs:["7.1","7.2","7.3","7.5"] },
  { num:"§8", name:"Vận hành",                   col:C.orange, icon:"⚙️", subs:["8.1","8.2","8.3"] },
  { num:"§9", name:"Đánh giá kết quả",           col:C.red,    icon:"📈", subs:["9.1","9.2","9.3"] },
  { num:"§10",name:"Cải tiến",                   col:C.navy,   icon:"🚀", subs:["10.1","10.2"] },
];
const SUB_NAMES = {
  "4.1":"Bối cảnh & vấn đề","4.2":"Các bên liên quan","4.3":"Phạm vi EnMS","4.4":"Hệ thống EnMS",
  "5.1":"Lãnh đạo & cam kết","5.2":"Chính sách NL","5.3":"Vai trò & TN",
  "6.1":"Rủi ro & cơ hội","6.2":"Mục tiêu NL","6.3":"Rà soát NL (Energy Review)",
  "6.4":"EnPI","6.5":"EnB (Baseline)","6.6":"Thu thập dữ liệu",
  "7.1":"Nguồn lực","7.2":"Năng lực","7.3":"Nhận thức","7.5":"Tài liệu",
  "8.1":"Kiểm soát vận hành","8.2":"Thiết kế","8.3":"Mua sắm",
  "9.1":"Theo dõi & đo lường","9.2":"Đánh giá nội bộ","9.3":"Xem xét lãnh đạo",
  "10.1":"NC & CAR","10.2":"Cải tiến liên tục",
};

function avgScore(items, resp) {
  const s = items.map(i => resp[i.id]?.score||0).filter(s=>s>0);
  return s.length ? (s.reduce((a,b)=>a+b,0)/s.length).toFixed(1) : null;
}

export default function StepClauses({ survey, setSurvey }) {
  const [open, setOpen] = useState({ "§4":true });
  const resp = survey.responses || {};

  const setResp = (id, field, val) =>
    setSurvey(p => ({ ...p, responses:{ ...p.responses, [id]:{ ...p.responses[id], [field]:val }}}));

  const stats = useMemo(() => {
    const all = GAP_CHECKLIST;
    const scored = all.filter(i => (resp[i.id]?.score||0) > 0);
    const crit = scored.filter(i => resp[i.id].score <= 1).length;
    const maj  = scored.filter(i => resp[i.id].score === 2).length;
    const min  = scored.filter(i => resp[i.id].score === 3).length;
    const good = scored.filter(i => resp[i.id].score >= 4).length;
    return { total:all.length, scored:scored.length, crit, maj, min, good };
  }, [resp]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

      <KPIBar items={[
        { label:"Tổng yêu cầu",    value:`${stats.scored}/${stats.total}`, col:C.blue,   icon:"📋" },
        { label:"Nghiêm trọng",    value:stats.crit,  col:C.red,    icon:"⛔" },
        { label:"Khoảng cách lớn", value:stats.maj,   col:C.orange, icon:"⚠️" },
        { label:"Cần cải thiện",   value:stats.min,   col:C.amber,  icon:"🔶" },
        { label:"Phù hợp",         value:stats.good,  col:C.teal,   icon:"✅" },
      ]}/>

      {/* Scoring guide */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:4 }}>
        {Object.entries(SCORE_CFG).map(([s,cfg]) => (
          <span key={s} style={{ background:cfg.bg, color:cfg.col, border:`1px solid ${cfg.col}30`,
            borderRadius:4, padding:"2px 7px", fontSize:10, fontWeight:700 }}>
            {s} — {cfg.label}
          </span>
        ))}
      </div>

      {CLAUSES.map(cl => {
        const clItems = GAP_CHECKLIST.filter(i => i.clause.startsWith(cl.num.replace("§","")));
        const avg = avgScore(clItems, resp);
        const avgN = avg ? parseFloat(avg) : 0;
        const avgInt = Math.round(avgN);
        const scfg = SCORE_CFG[avgInt] || SCORE_CFG[0];
        const isOpen = !!open[cl.num];

        return (
          <div key={cl.num} style={{ background:C.bg2, borderRadius:10, overflow:"hidden",
            border:`1px solid ${cl.col}30` }}>
            {/* Clause header */}
            <div onClick={() => setOpen(p=>({...p,[cl.num]:!isOpen}))}
              style={{ padding:"10px 14px", background:`${cl.col}12`,
                borderBottom:isOpen?`1px solid ${cl.col}20`:"none",
                display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <span style={{ fontSize:18 }}>{cl.icon}</span>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:C.t0, flex:1 }}>
                {cl.num} — {cl.name}
              </span>
              <span style={{ fontSize:11, color:C.t2 }}>{clItems.length} yêu cầu</span>
              {avg && (
                <span style={{ background:scfg.bg, color:scfg.col, border:`1px solid ${scfg.col}30`,
                  borderRadius:5, padding:"2px 8px", fontSize:11.5, fontWeight:700 }}>
                  TB: {avg}/5.0
                </span>
              )}
              <span style={{ color:C.t2 }}>{isOpen?"▼":"▶"}</span>
            </div>

            {isOpen && (
              <div style={{ padding:14 }}>
                {cl.subs.map(sub => {
                  const subItems = clItems.filter(i => i.clause === sub);
                  if (!subItems.length) return null;
                  const subAvg = avgScore(subItems, resp);
                  const sAvgN = subAvg ? parseFloat(subAvg) : 0;
                  const sCfg = SCORE_CFG[Math.round(sAvgN)] || SCORE_CFG[0];
                  return (
                    <div key={sub} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6,
                        padding:"5px 10px", background:C.bg3, borderRadius:6,
                        borderLeft:`3px solid ${cl.col}` }}>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11, color:cl.col, fontWeight:700 }}>{sub}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:C.t0, flex:1 }}>{SUB_NAMES[sub]||sub}</span>
                        {subAvg && (
                          <span style={{ background:sCfg.bg, color:sCfg.col,
                            border:`1px solid ${sCfg.col}30`, borderRadius:4,
                            padding:"1px 7px", fontSize:10.5, fontWeight:700 }}>
                            {subAvg}/5.0
                          </span>
                        )}
                      </div>

                      {subItems.map((item, idx) => {
                        const r = resp[item.id] || {};
                        const sc = r.score || 0;
                        const cfg = SCORE_CFG[sc] || SCORE_CFG[0];
                        const wcfg = WEIGHT_CFG[item.weight] || WEIGHT_CFG[1];
                        const ccfg = CAT_CFG[item.cat] || CAT_CFG.practice;
                        return (
                          <div key={item.id} style={{ marginBottom:8, padding:10,
                            background:sc ? `${cfg.col}08` : C.bg3,
                            border:`1px solid ${sc?cfg.col:C.bd2}28`,
                            borderRadius:7 }}>
                            {/* Item header */}
                            <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                              <span style={{ fontFamily:"'Fira Code',monospace", fontSize:10,
                                color:C.blueL, flexShrink:0, marginTop:2 }}>{item.id}</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, color:C.t0, fontWeight:500, lineHeight:1.5 }}>{item.title}</div>
                                <div style={{ display:"flex", gap:5, marginTop:3, flexWrap:"wrap" }}>
                                  <Tag c={ccfg.col}>{ccfg.icon} {ccfg.label}</Tag>
                                  <Tag c={wcfg.col}>{wcfg.label}</Tag>
                                  {item.legal && <Tag c={C.red}>⚖️ {item.legal}</Tag>}
                                </div>
                              </div>
                              {sc > 0 && (
                                <span style={{ background:cfg.bg, color:cfg.col,
                                  border:`1px solid ${cfg.col}30`, borderRadius:5,
                                  padding:"2px 8px", fontSize:10.5, fontWeight:700, flexShrink:0 }}>
                                  {sc}/5
                                </span>
                              )}
                            </div>
                            {/* Score picker */}
                            <div style={{ marginBottom:sc<=3&&sc>0?8:0 }}>
                              <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Điểm đánh giá:</div>
                              <ScorePicker value={sc} onChange={v => setResp(item.id,"score",v)}/>
                            </div>
                            {/* Note field */}
                            {sc > 0 && (
                              <div style={{ marginTop:6 }}>
                                <textarea value={r.note||""} onChange={e=>setResp(item.id,"note",e.target.value)}
                                  placeholder={sc<=2 ? "Mô tả khoảng cách cụ thể phát hiện tại hiện trường..."
                                    : sc===3 ? "Mô tả hiện trạng và điểm cần hoàn thiện..."
                                    : "Bằng chứng / tài liệu ghi nhận được..."}
                                  rows={2} style={{ width:"100%", background:C.bg4,
                                    border:`1px solid ${C.bd0}`, borderRadius:5, padding:"5px 8px",
                                    color:C.t0, fontSize:11.5, resize:"vertical", fontFamily:"inherit" }}/>
                              </div>
                            )}
                            {/* Recommendation for gaps */}
                            {sc > 0 && sc <= 3 && (
                              <div style={{ marginTop:5 }}>
                                <textarea value={r.recommendation||""} onChange={e=>setResp(item.id,"recommendation",e.target.value)}
                                  placeholder="Đề xuất hành động khắc phục / cải thiện..."
                                  rows={2} style={{ width:"100%", background:`${C.orange}08`,
                                    border:`1px solid ${C.orange}25`, borderRadius:5, padding:"5px 8px",
                                    color:C.t0, fontSize:11.5, resize:"vertical", fontFamily:"inherit" }}/>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
