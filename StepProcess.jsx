/**
 * ISO50001Gap — frontend/StepProcess.jsx
 * Step 4: Process Approach Gap Assessment
 */
import { C, PROCESS_MAP, SCORE_CFG } from "./gap.ui.constants.js";
import { Card, ScorePicker, Tag, KPIBar } from "./gap.atoms.jsx";

export default function StepProcess({ survey, setSurvey }) {
  const pg = survey.process_gaps || {};
  const setProc = (id, field, val) =>
    setSurvey(p => ({ ...p, process_gaps:{ ...p.process_gaps, [id]:{ ...p.process_gaps[id], [field]:val }}}));

  const assessed = PROCESS_MAP.filter(pr => (pg[pr.id]?.score||0) > 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <KPIBar items={[
        { label:"Đã đánh giá",    value:`${assessed.length}/${PROCESS_MAP.length}`, col:C.blue,   icon:"🔄" },
        { label:"Khoảng cách",    value:assessed.filter(p=>(pg[p.id]?.score||0)<=2).length,       col:C.red,  icon:"⚠️" },
        { label:"Phù hợp",        value:assessed.filter(p=>(pg[p.id]?.score||0)>=4).length,       col:C.teal, icon:"✅" },
      ]}/>

      {PROCESS_MAP.map((pr, i) => {
        const pd  = pg[pr.id] || {};
        const sc  = pd.score || 0;
        const cfg = SCORE_CFG[sc] || SCORE_CFG[0];
        return (
          <div key={pr.id} style={{ background:C.bg2, borderRadius:9,
            border:`1px solid ${sc?cfg.col:C.bd0}25`, padding:12 }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
              <span style={{ fontFamily:"'Fira Code',monospace", fontSize:10.5, color:C.blueL, flexShrink:0, marginTop:2 }}>{pr.id}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.t0 }}>{pr.name}</div>
                <div style={{ display:"flex", gap:6, marginTop:3, flexWrap:"wrap" }}>
                  <Tag c={C.blue}>👤 {pr.owner}</Tag>
                  <Tag c={C.teal}>🕐 {pr.freq}</Tag>
                </div>
              </div>
              {sc > 0 && (
                <span style={{ background:cfg.bg, color:cfg.col, border:`1px solid ${cfg.col}30`,
                  borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700, flexShrink:0 }}>
                  {sc}/5.0
                </span>
              )}
            </div>
            {/* Score */}
            <div style={{ marginBottom:sc>0?8:0 }}>
              <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Điểm đánh giá quá trình:</div>
              <ScorePicker value={sc} onChange={v=>setProc(pr.id,"score",v)}/>
            </div>
            {sc > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:8 }}>
                {[
                  ["finding",  "Phát hiện khoảng cách", "Mô tả khoảng cách cụ thể trong quá trình này...",   sc<=2?`${C.red}08`:C.bg3,    sc<=2?C.red:C.bd0],
                  ["evidence", "Bằng chứng ghi nhận",   "Tài liệu / hồ sơ / quan sát thực tế...",           C.bg3,                        C.bd0],
                  ["action",   "Đề xuất hành động",     "Hành động cụ thể để đóng khoảng cách...",          sc<=3?`${C.orange}08`:C.bg3,  sc<=3?C.orange:C.bd0],
                ].map(([field, label, ph, bg, bc])=>(
                  <div key={field}>
                    <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:3, textTransform:"uppercase" }}>{label}</div>
                    <textarea value={pd[field]||""} onChange={e=>setProc(pr.id,field,e.target.value)}
                      placeholder={ph} rows={3}
                      style={{ width:"100%", background:bg, border:`1px solid ${bc}30`,
                        borderRadius:5, padding:"5px 8px", color:C.t0, fontSize:11.5,
                        resize:"vertical", fontFamily:"inherit" }}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
