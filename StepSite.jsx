/**
 * ISO50001Gap — frontend/StepSite.jsx
 * Step 5: Site, Zone & Equipment field survey
 */
import { useState } from "react";
import { C, ZONE_TYPES, EQUIPMENT_TYPES, SCORE_CFG } from "./gap.ui.constants.js";
import { Card, Btn, Field, Input, TA, Sel, Grid, Tag, ScorePicker, KPIBar } from "./gap.atoms.jsx";

const ZONE_ICONS = ["🏭","🔥","🌪️","❄️","💡","🏢","📦","💧","⚡","♻️","🏗️"];
const EQ_STATUSES = [["good","✓ Tốt"],["fair","~ Trung bình"],["poor","⚠ Kém"],["critical","🔴 Nguy hiểm"]];
const STATUS_COL = { good:C.tealL, fair:C.amber, poor:C.orange, critical:C.red };

const newZone = () => ({
  id: `Z${Date.now()}`, name:"", icon:"🏭", zone_type:"",
  energy_types:"Điện", consumption:"", percentage:"",
  is_seu:false, operator:"", potential:"", gap_score:0, notes:"",
  equipment:[],
});
const newEquip = () => ({
  id:`E${Date.now()}`, name:"", type:"", capacity:"",
  age:"", status:"good", gap_score:0, finding:"", recommendation:"",
});

export default function StepSite({ survey, setSurvey }) {
  const [openZone, setOpenZone] = useState({});
  const zones = survey.site_assessments || [];

  const updateZones = zones => setSurvey(p=>({ ...p, site_assessments:zones }));
  const addZone  = () => updateZones([...zones, newZone()]);
  const removeZone = id => updateZones(zones.filter(z=>z.id!==id));
  const setZone  = (id, field, val) =>
    updateZones(zones.map(z => z.id===id ? { ...z, [field]:val } : z));
  const addEquip = zid =>
    updateZones(zones.map(z => z.id===zid ? { ...z, equipment:[...z.equipment, newEquip()] } : z));
  const removeEquip = (zid, eid) =>
    updateZones(zones.map(z => z.id===zid ? { ...z, equipment:z.equipment.filter(e=>e.id!==eid) } : z));
  const setEquip = (zid, eid, field, val) =>
    updateZones(zones.map(z => z.id!==zid ? z : {
      ...z, equipment: z.equipment.map(e => e.id===eid ? { ...e, [field]:val } : e),
    }));

  const totalEq   = zones.reduce((a,z)=>a+z.equipment.length,0);
  const seuCount  = zones.filter(z=>z.is_seu).length;
  const poorEq    = zones.flatMap(z=>z.equipment).filter(e=>e.status==="poor"||e.status==="critical").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <KPIBar items={[
        { label:"Khu vực",       value:zones.length,   col:C.blue,   icon:"🏭" },
        { label:"SEU",           value:seuCount,        col:C.orange, icon:"⚡" },
        { label:"Thiết bị",      value:totalEq,         col:C.teal,   icon:"⚙️" },
        { label:"Thiết bị kém",  value:poorEq,          col:C.red,    icon:"⚠️" },
      ]}/>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn v="blue" sz="sm" onClick={addZone}>＋ Thêm khu vực / nhà xưởng</Btn>
      </div>

      {zones.length === 0 && (
        <div style={{ textAlign:"center", padding:"30px", background:C.bg2, borderRadius:10,
          border:`2px dashed ${C.bd0}`, color:C.t2 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🏭</div>
          <div style={{ fontSize:13 }}>Chưa có khu vực nào. Nhấn "+ Thêm khu vực" để bắt đầu khảo sát hiện trường.</div>
        </div>
      )}

      {zones.map((zone, zi) => {
        const sc    = zone.gap_score || 0;
        const cfg   = SCORE_CFG[Math.round(sc)] || SCORE_CFG[0];
        const isOpen = openZone[zone.id] !== false;

        return (
          <div key={zone.id} style={{ background:C.bg2, borderRadius:10, overflow:"hidden",
            border:`1px solid ${sc?cfg.col:C.bd0}30` }}>
            {/* Zone header */}
            <div style={{ padding:"9px 13px", background:`${sc?cfg.col:C.blue}10`,
              borderBottom:isOpen?`1px solid ${sc?cfg.col:C.blue}15`:"none",
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18, cursor:"pointer" }} onClick={()=>setOpenZone(p=>({...p,[zone.id]:!isOpen}))}>
                {zone.icon||"🏭"}
              </span>
              <div style={{ flex:1, cursor:"pointer" }} onClick={()=>setOpenZone(p=>({...p,[zone.id]:!isOpen}))}>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:700, color:C.t0 }}>
                  {zone.name || `Khu vực ${zi+1}`}
                  {zone.is_seu && <Tag c={C.orange} sx={{ marginLeft:8 }}>⚡ SEU</Tag>}
                </div>
                {zone.zone_type && <div style={{ fontSize:11, color:C.t2 }}>{zone.zone_type}</div>}
              </div>
              {zone.consumption && <Tag c={C.skyL}>{zone.consumption}</Tag>}
              {sc>0 && <span style={{ background:cfg.bg, color:cfg.col, border:`1px solid ${cfg.col}25`,
                borderRadius:5, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{sc}/5</span>}
              <Btn v="ghost" sz="sm" onClick={()=>removeZone(zone.id)} sx={{ color:C.red, borderColor:C.red+"40" }}>✕</Btn>
              <span style={{ color:C.t2, cursor:"pointer" }} onClick={()=>setOpenZone(p=>({...p,[zone.id]:!isOpen}))}>
                {isOpen?"▼":"▶"}
              </span>
            </div>

            {isOpen && (
              <div style={{ padding:12 }}>
                {/* Zone info */}
                <Grid cols={3} gap={8}>
                  <Field label="Tên khu vực / Nhà xưởng">
                    <Input value={zone.name} onChange={v=>setZone(zone.id,"name",v)} placeholder="Xưởng sản xuất A..."/>
                  </Field>
                  <Field label="Loại khu vực">
                    <Sel value={zone.zone_type||""} onChange={v=>setZone(zone.id,"zone_type",v)}
                      options={[["","— Chọn loại —"],...ZONE_TYPES.map(t=>[t,t])]}/>
                  </Field>
                  <Field label="Biểu tượng">
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {ZONE_ICONS.map(ic=>(
                        <button key={ic} onClick={()=>setZone(zone.id,"icon",ic)}
                          style={{ background:zone.icon===ic?C.blue+"30":"transparent",
                            border:`1px solid ${zone.icon===ic?C.blue:C.bd0}`,
                            borderRadius:5, padding:"3px 6px", cursor:"pointer", fontSize:16 }}>{ic}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Loại NL chính">
                    <Input value={zone.energy_types} onChange={v=>setZone(zone.id,"energy_types",v)} placeholder="Điện, Than, Khí nén..."/>
                  </Field>
                  <Field label="NL tiêu thụ/năm">
                    <Input value={zone.consumption} onChange={v=>setZone(zone.id,"consumption",v)} placeholder="5.000.000 kWh/năm"/>
                  </Field>
                  <Field label="% Tổng NL nhà máy">
                    <Input value={zone.percentage} onChange={v=>setZone(zone.id,"percentage",v)} placeholder="35%"/>
                  </Field>
                  <Field label="Người vận hành">
                    <Input value={zone.operator} onChange={v=>setZone(zone.id,"operator",v)} placeholder="Ca trưởng / Bộ phận phụ trách"/>
                  </Field>
                  <Field label="Tiềm năng TKNL">
                    <Input value={zone.potential} onChange={v=>setZone(zone.id,"potential",v)} placeholder="8–12% (~600.000 kWh)"/>
                  </Field>
                  <Field label="SEU — Khu vực trọng yếu?">
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0" }}>
                      <input type="checkbox" checked={!!zone.is_seu} onChange={e=>setZone(zone.id,"is_seu",e.target.checked)}
                        style={{ width:16, height:16, accentColor:C.orangeL, cursor:"pointer" }}/>
                      <span style={{ fontSize:12, color:zone.is_seu?C.orangeL:C.t2 }}>
                        {zone.is_seu?"⚡ Đây là SEU (Significant Energy Use)":"Đánh dấu là SEU nếu chiếm ≥20% tổng NL"}
                      </span>
                    </div>
                  </Field>
                </Grid>

                {/* Zone gap score */}
                <div style={{ margin:"8px 0" }}>
                  <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:4, textTransform:"uppercase" }}>
                    Điểm GAP khu vực này:
                  </div>
                  <ScorePicker value={sc} onChange={v=>setZone(zone.id,"gap_score",v)}/>
                </div>

                {/* Zone notes */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:4, textTransform:"uppercase" }}>
                    Nhận xét hiện trường / Phát hiện chính:
                  </div>
                  <textarea value={zone.notes||""} onChange={e=>setZone(zone.id,"notes",e.target.value)}
                    placeholder="Quan sát tại chỗ: thiết bị vận hành, hiệu suất, rò rỉ, đo lường, nhận thức nhân viên..."
                    rows={3} style={{ width:"100%", background:C.bg3, border:`1px solid ${C.bd0}`,
                      borderRadius:6, padding:"6px 10px", color:C.t0, fontSize:12, resize:"vertical", fontFamily:"inherit" }}/>
                </div>

                {/* Equipment list */}
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:12.5, fontWeight:700, color:C.t0 }}>
                      ⚙️ Thiết bị trong khu vực ({zone.equipment.length})
                    </span>
                    <Btn v="outline" sz="sm" onClick={()=>addEquip(zone.id)}>＋ Thêm thiết bị</Btn>
                  </div>

                  {zone.equipment.map((eq, ei) => {
                    const eqcol = STATUS_COL[eq.status] || C.teal;
                    const eqsc  = eq.gap_score || 0;
                    const eqcfg = SCORE_CFG[eqsc] || SCORE_CFG[0];
                    return (
                      <div key={eq.id} style={{ background:C.bg3, borderRadius:7, padding:10,
                        marginBottom:7, border:`1px solid ${eqcol}20` }}>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:6, alignItems:"center" }}>
                          <div style={{ flex:1 }}>
                            <Input value={eq.name} onChange={v=>setEquip(zone.id,eq.id,"name",v)}
                              placeholder={`Thiết bị ${ei+1}: Tên thiết bị...`}/>
                          </div>
                          <div style={{ width:160 }}>
                            <Sel value={eq.type||""} onChange={v=>setEquip(zone.id,eq.id,"type",v)}
                              options={[["","— Loại —"],...EQUIPMENT_TYPES.map(t=>[t,t])]}/>
                          </div>
                          <div style={{ width:100 }}>
                            <Input value={eq.capacity} onChange={v=>setEquip(zone.id,eq.id,"capacity",v)} placeholder="kW"/>
                          </div>
                          <Btn v="ghost" sz="sm" onClick={()=>removeEquip(zone.id,eq.id)} sx={{ color:C.red, borderColor:C.red+"40" }}>✕</Btn>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr 2fr", gap:6, alignItems:"start" }}>
                          <div>
                            <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:3, textTransform:"uppercase" }}>Tuổi (năm)</div>
                            <Input value={eq.age} onChange={v=>setEquip(zone.id,eq.id,"age",v)} placeholder="5"/>
                          </div>
                          <div>
                            <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:3, textTransform:"uppercase" }}>Trạng thái</div>
                            <Sel value={eq.status} onChange={v=>setEquip(zone.id,eq.id,"status",v)}
                              options={EQ_STATUSES}/>
                          </div>
                          <div>
                            <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:3, textTransform:"uppercase" }}>Phát hiện</div>
                            <textarea value={eq.finding||""} onChange={e=>setEquip(zone.id,eq.id,"finding",e.target.value)}
                              placeholder="Phát hiện kỹ thuật tại hiện trường..."
                              rows={2} style={{ width:"100%", background:C.bg4,
                                border:`1px solid ${C.bd0}`, borderRadius:5, padding:"4px 7px",
                                color:C.t0, fontSize:11, resize:"none", fontFamily:"inherit" }}/>
                          </div>
                          <div>
                            <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:3, textTransform:"uppercase" }}>Đề xuất</div>
                            <textarea value={eq.recommendation||""} onChange={e=>setEquip(zone.id,eq.id,"recommendation",e.target.value)}
                              placeholder="Giải pháp cải thiện hiệu quả NL..."
                              rows={2} style={{ width:"100%", background:C.bg4,
                                border:`1px solid ${C.bd0}`, borderRadius:5, padding:"4px 7px",
                                color:C.t0, fontSize:11, resize:"none", fontFamily:"inherit" }}/>
                          </div>
                        </div>
                        {/* Equipment gap score */}
                        <div style={{ marginTop:6 }}>
                          <div style={{ fontSize:9.5, color:C.t2, fontWeight:700, marginBottom:3, textTransform:"uppercase" }}>Điểm GAP thiết bị:</div>
                          <ScorePicker value={eqsc} onChange={v=>setEquip(zone.id,eq.id,"gap_score",v)}/>
                        </div>
                      </div>
                    );
                  })}
                  {zone.equipment.length === 0 && (
                    <div style={{ textAlign:"center", padding:"12px", background:C.bg4,
                      borderRadius:7, border:`1px dashed ${C.bd0}`, color:C.t3, fontSize:12 }}>
                      Chưa có thiết bị — nhấn "＋ Thêm thiết bị" để nhập dữ liệu khảo sát
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
