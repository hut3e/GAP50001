/**
 * ISO50001Gap — frontend/StepActions.jsx
 * Step 6: Master Action Plan — build gap closure roadmap
 */
import { useMemo } from "react";
import { C, ACTION_PHASES, GAP_CHECKLIST } from "./gap.ui.constants.js";
import { Btn, Field, Input, TA, Sel, Tag, KPIBar } from "./gap.atoms.jsx";

const CLAUSES_OPT = ["","§4.1","§4.2","§4.3","§4.4","§5.1","§5.2","§5.3",
  "§6.1","§6.2","§6.3","§6.4","§6.5","§6.6","§7.1","§7.2","§7.3","§7.5",
  "§8.1","§8.2","§8.3","§9.1","§9.2","§9.3","§10.1","§10.2","Pháp lý","Rủi ro","Quá trình","Hiện trường"];

const newAction = (phase="P1") => ({
  id:`AP${Date.now()}`, code:"", action:"", clause:"", phase,
  responsible:"", deadline:"", resources:"", status:"open",
});

export default function StepActions({ survey, setSurvey }) {
  const actions = survey.action_plan || [];

  const update = acts => setSurvey(p=>({ ...p, action_plan:acts }));
  const addAction = phase => update([...actions, newAction(phase)]);
  const remove    = id    => update(actions.filter(a=>a.id!==id));
  const setAct    = (id,field,val) => update(actions.map(a=>a.id===id?{...a,[field]:val}:a));

  // Auto-suggest actions from gap responses
  const autoSuggest = useMemo(() => {
    const resp = survey.responses || {};
    return GAP_CHECKLIST
      .filter(i => (resp[i.id]?.score||0) > 0 && (resp[i.id]?.score||0) <= 3)
      .sort((a,b) => (resp[a.id]?.score||0) - (resp[b.id]?.score||0))
      .slice(0,8);
  }, [survey.responses]);

  const addFromGap = item => {
    const resp = survey.responses || {};
    const sc = resp[item.id]?.score || 1;
    const phase = sc===1?"P1":sc===2?"P2":"P3";
    const newAct = {
      ...newAction(phase),
      code:`AP-${item.id}`,
      action: resp[item.id]?.recommendation || `Khắc phục: "${item.title}"`,
      clause: `§${item.clause}`,
      deadline: sc===1?"30 ngày":sc===2?"90 ngày":"180 ngày",
    };
    update([...actions, newAct]);
  };

  const byPhase = id => actions.filter(a=>a.phase===id);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <KPIBar items={[
        { label:"Tổng actions",  value:actions.length,                               col:C.blue,   icon:"📋" },
        { label:"Giai đoạn 1",   value:byPhase("P1").length,                        col:C.red,    icon:"🔴" },
        { label:"Giai đoạn 2",   value:byPhase("P2").length,                        col:C.orange, icon:"🟠" },
        { label:"Giai đoạn 3-4", value:byPhase("P3").length+byPhase("P4").length,   col:C.teal,   icon:"🟢" },
      ]}/>

      {/* Auto suggestions from gap */}
      {autoSuggest.length > 0 && (
        <div style={{ background:C.bg2, borderRadius:9, padding:12, border:`1px solid ${C.orange}30` }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.orangeL, marginBottom:8 }}>
            💡 Gợi ý từ kết quả đánh giá GAP ({autoSuggest.length} yêu cầu cần hành động)
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {autoSuggest.map(item => {
              const sc = survey.responses?.[item.id]?.score || 0;
              const col = sc===1?C.red:sc===2?C.orange:C.amber;
              const alreadyAdded = actions.some(a=>a.code===`AP-${item.id}`);
              return (
                <div key={item.id} style={{ display:"flex", alignItems:"center", gap:8,
                  padding:"6px 10px", background:C.bg3, borderRadius:6,
                  border:`1px solid ${col}20` }}>
                  <Tag c={col}>{item.id}</Tag>
                  <span style={{ flex:1, fontSize:12, color:C.t0 }}>{item.title}</span>
                  <Tag c={col}>Score {sc}</Tag>
                  <Btn v={alreadyAdded?"ghost":"outline"} sz="sm"
                    onClick={()=>!alreadyAdded&&addFromGap(item)} disabled={alreadyAdded}>
                    {alreadyAdded?"✓ Đã thêm":"＋ Thêm vào Plan"}
                  </Btn>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase-based sections */}
      {ACTION_PHASES.map(ph => (
        <div key={ph.id} style={{ background:C.bg2, borderRadius:10, overflow:"hidden",
          border:`1px solid ${ph.col}30` }}>
          <div style={{ padding:"9px 14px", background:`${ph.col}15`,
            display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700,
              color:C.t0, flex:1 }}>{ph.label}</div>
            <Tag c={ph.col}>{byPhase(ph.id).length} actions</Tag>
            <Btn v="outline" sz="sm" onClick={()=>addAction(ph.id)} sx={{ borderColor:`${ph.col}60`, color:ph.col }}>
              ＋ Thêm
            </Btn>
          </div>

          <div style={{ padding:ph.id && byPhase(ph.id).length ? 10 : 0 }}>
            {byPhase(ph.id).map((act, i) => (
              <div key={act.id} style={{ background:C.bg3, borderRadius:8, padding:10,
                marginBottom:7, border:`1px solid ${C.bd2}` }}>
                <div style={{ display:"flex", gap:8, marginBottom:7, alignItems:"center" }}>
                  <div style={{ width:110 }}>
                    <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:2, textTransform:"uppercase" }}>Mã</div>
                    <Input value={act.code} onChange={v=>setAct(act.id,"code",v)} placeholder={`AP-${i+1}`}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:2, textTransform:"uppercase" }}>Hành động / Dự án</div>
                    <Input value={act.action} onChange={v=>setAct(act.id,"action",v)} placeholder="Mô tả hành động cụ thể cần thực hiện..."/>
                  </div>
                  <div style={{ width:130 }}>
                    <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:2, textTransform:"uppercase" }}>Điều khoản</div>
                    <Sel value={act.clause||""} onChange={v=>setAct(act.id,"clause",v)}
                      options={CLAUSES_OPT.map(c=>[c,c||"— Chọn —"])}/>
                  </div>
                  <Btn v="ghost" sz="sm" onClick={()=>remove(act.id)} sx={{ color:C.red, borderColor:C.red+"40" }}>✕</Btn>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
                  <div>
                    <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:2, textTransform:"uppercase" }}>Người chịu TN</div>
                    <Input value={act.responsible} onChange={v=>setAct(act.id,"responsible",v)} placeholder="EMR / Phòng..."/>
                  </div>
                  <div>
                    <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:2, textTransform:"uppercase" }}>Deadline</div>
                    <Input value={act.deadline} onChange={v=>setAct(act.id,"deadline",v)} placeholder="30/03/2025"/>
                  </div>
                  <div>
                    <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:2, textTransform:"uppercase" }}>Nguồn lực</div>
                    <Input value={act.resources} onChange={v=>setAct(act.id,"resources",v)} placeholder="Ngân sách / Nhân lực..."/>
                  </div>
                  <div>
                    <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:2, textTransform:"uppercase" }}>Trạng thái</div>
                    <Sel value={act.status||"open"} onChange={v=>setAct(act.id,"status",v)} options={[
                      ["open","⬜ Chưa bắt đầu"],["in_progress","🔄 Đang thực hiện"],
                      ["done","✅ Hoàn thành"],["deferred","⏸ Tạm hoãn"],
                    ]}/>
                  </div>
                </div>
              </div>
            ))}
            {byPhase(ph.id).length === 0 && (
              <div style={{ textAlign:"center", padding:"14px", color:C.t3, fontSize:12 }}>
                Không có action trong giai đoạn này — nhấn "＋ Thêm"
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
