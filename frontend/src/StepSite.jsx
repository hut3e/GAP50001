/**
 * ISO50001Gap — frontend/StepSite.jsx
 * Step 5: Site, Zone & Equipment field survey
 */
import { useState } from "react";
import { C, ZONE_TYPES, EQUIPMENT_TYPES, SCORE_CFG } from "./gap.ui.constants.js";
import { Card, Btn, Field, Input, TA, Sel, Grid, Tag, ScorePicker, KPIBar, Modal } from "./gap.atoms.jsx";

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
const newSolar = () => ({
  id: `SL${Date.now()}`, name: "", capacity: "", generation: "", notes: ""
});

export default function StepSite({ survey, setSurvey }) {
  const [openZone, setOpenZone] = useState({});
  const [editZone, setEditZone] = useState(null); // { id: string } or null
  const [editEquip, setEditEquip] = useState(null); // { zid: string, equip: object } or null

  const zones = survey.site_assessments || [];

  const updateZones = zones => setSurvey(p=>({ ...p, site_assessments:zones }));
  
  const moveZone = (index, direction) => {
    moveToIndex(index, index + direction);
  };

  const moveToIndex = (oldIndex, newIndex) => {
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= zones.length) newIndex = zones.length - 1;
    if (oldIndex === newIndex) return;
    const newZones = [...zones];
    const [movedItem] = newZones.splice(oldIndex, 1);
    newZones.splice(newIndex, 0, movedItem);
    // Lưu thứ tự explicit vào biến orderIndex để lưu chính xác vào DataBase
    updateZones(newZones.map((z, idx) => ({ ...z, orderIndex: idx + 1 })));
  };

  const addZone  = () => {
    const nz = newZone();
    nz.orderIndex = zones.length + 1;
    updateZones([...zones, nz]);
    setEditZone({ id: nz.id });
    setOpenZone(p=>({...p, [nz.id]: true}));
  };
  const removeZone = id => updateZones(zones.filter(z=>z.id!==id));
  const setZone  = (id, field, val) =>
    updateZones(zones.map(z => z.id===id ? { ...z, [field]:val } : z));
    
  const addEquip = zid => {
    const ne = newEquip();
    // Add dummy equip first
    updateZones(zones.map(z => z.id===zid ? { ...z, equipment:[...(z.equipment||[]), ne] } : z));
    setEditEquip({ zid, equip: ne });
  };
  const removeEquip = (zid, eid) =>
    updateZones(zones.map(z => z.id===zid ? { ...z, equipment:(z.equipment||[]).filter(e=>e.id!==eid) } : z));
  const saveEquip = (zid, updatedEq) => {
    updateZones(zones.map(z => z.id!==zid ? z : {
      ...z, equipment: (z.equipment||[]).map(e => e.id===updatedEq.id ? updatedEq : e),
    }));
    setEditEquip(null);
  };

  const totalEq   = zones.reduce((a,z)=>a+(z.equipment||[]).length,0);
  const seuCount  = zones.filter(z=>z.is_seu).length;
  const poorEq    = zones.flatMap(z=>z.equipment||[]).filter(e=>e.status==="poor"||e.status==="critical").length;

  const currentEditZone = editZone ? zones.find(z => z.id === editZone.id) : null;

  const parseVnNum = (numStr) => {
    let s = numStr.trim();
    if (s.includes('.') && s.includes(',')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (s.includes(',')) {
      if ((s.length - s.lastIndexOf(',')) === 4) s = s.replace(/,/g, '');
      else s = s.replace(',', '.');
    } else if (s.includes('.')) {
      if ((s.length - s.lastIndexOf('.')) === 4) s = s.replace(/\./g, '');
    }
    return parseFloat(s) || 0;
  };

  const energyTotals = { kWh: 0, tan: 0, lit: 0, m3: 0 };
  zones.forEach(z => {
    if (!z.consumption) return;
    const segments = z.consumption.toLowerCase().split(/(?:\+|;|và|\n|,\s+)/);
    segments.forEach(seg => {
      const match = seg.match(/([\d.,]+)\s*(kwh|tấn|lit|lít|m3|m³)?/);
      if (!match) return;
      let numStr = match[1].replace(/[.,]+$/, "");
      const val = parseVnNum(numStr);
      if (val === 0) return;
      
      if (seg.includes("kwh") || seg.includes("điện")) energyTotals.kWh += val;
      else if (seg.includes("gas") || seg.includes("lpg")) energyTotals.tan += val;
      else if (seg.includes("dầu") || seg.includes("xăng") || seg.includes("lit") || seg.includes("lít")) energyTotals.lit += val;
      else if (seg.includes("m3") || seg.includes("m³") || seg.includes("nước") || seg.includes("khí")) energyTotals.m3 += val;
      else if (seg.includes("tấn")) energyTotals.tan += val; 
    });
  });

  // Calculate total solar
  let totalSolar = 0;
  (survey.solar_assessments || []).forEach(s => {
    if (!s.generation) return;
    const segments = s.generation.toLowerCase().split(/(?:\+|;|và|\n|,\s+)/);
    segments.forEach(seg => {
      const match = seg.match(/([\d.,]+)/);
      if (match) {
        let numStr = match[1].replace(/[.,]+$/, "");
        let val = parseVnNum(numStr);
        if (!isNaN(val)) totalSolar += val;
      }
    });
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <KPIBar items={[
        { label:"Khu vực",       value:zones.length,   col:C.blue,   icon:"🏭" },
        { label:"SEU",           value:seuCount,        col:C.orange, icon:"⚡" },
        { label:"Thiết bị",      value:totalEq,         col:C.teal,   icon:"⚙️" },
        { label:"Thiết bị kém",  value:poorEq,          col:C.red,    icon:"⚠️" },
      ]}/>

      {/* Energy Breakdown Auto-Parsed */}
      <div style={{ background: C.bg2, borderRadius: 10, padding: 16, border: `1px solid ${C.bd1}` }}>
        <div style={{ fontSize: 13, textTransform: "uppercase", fontWeight: 800, color: C.t2, marginBottom: 12 }}>
          ⚡ Bảng Tổng Hợp Năng Lượng Tiêu Thụ (Tự động trích xuất)
        </div>
        <Grid cols={5} gap={10}>
          <div style={{ background: C.bg3, padding: 12, borderRadius: 8, borderLeft: `4px solid ${C.skyL}` }}>
            <div style={{ fontSize: 12, color: C.t2 }}>Tổng Điện Năng</div>
            <div style={{ fontSize: 20, color: C.t0, fontWeight: 700 }}>
              {new Intl.NumberFormat('en-US').format(energyTotals.kWh)} <span style={{fontSize:14, color:C.t3}}>kWh</span>
            </div>
          </div>
          <div style={{ background: C.bg3, padding: 12, borderRadius: 8, borderLeft: `4px solid ${C.amber}` }}>
            <div style={{ fontSize: 12, color: C.t2 }}>Tổng Điện Mặt Trời</div>
            <div style={{ fontSize: 20, color: C.t0, fontWeight: 700 }}>
              {new Intl.NumberFormat('en-US').format(totalSolar)} <span style={{fontSize:14, color:C.t3}}>kWh</span>
            </div>
          </div>
          <div style={{ background: C.bg3, padding: 12, borderRadius: 8, borderLeft: `4px solid ${C.orangeL}` }}>
            <div style={{ fontSize: 12, color: C.t2 }}>Tổng Gas LPG</div>
            <div style={{ fontSize: 20, color: C.t0, fontWeight: 700 }}>
              {new Intl.NumberFormat('en-US').format(energyTotals.tan)} <span style={{fontSize:14, color:C.t3}}>tấn</span>
            </div>
          </div>
          <div style={{ background: C.bg3, padding: 12, borderRadius: 8, borderLeft: `4px solid ${C.teal}` }}>
            <div style={{ fontSize: 12, color: C.t2 }}>Tổng Dầu/Xăng</div>
            <div style={{ fontSize: 20, color: C.t0, fontWeight: 700 }}>
              {new Intl.NumberFormat('en-US').format(energyTotals.lit)} <span style={{fontSize:14, color:C.t3}}>lít</span>
            </div>
          </div>
          <div style={{ background: C.bg3, padding: 12, borderRadius: 8, borderLeft: `4px solid ${C.blue}` }}>
            <div style={{ fontSize: 12, color: C.t2 }}>Thuỷ Năng/Khí</div>
            <div style={{ fontSize: 20, color: C.t0, fontWeight: 700 }}>
              {new Intl.NumberFormat('en-US').format(energyTotals.m3)} <span style={{fontSize:14, color:C.t3}}>m³</span>
            </div>
          </div>

        </Grid>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn v="blue" sz="sm" onClick={addZone}>＋ Thêm khu vực / nhà xưởng</Btn>
      </div>

      {zones.length === 0 && (
        <div style={{ textAlign:"center", padding:"30px", background:C.bg2, borderRadius:10,
          border:`2px dashed ${C.bd0}`, color:C.t2 }}>
          <div style={{ fontSize:34, marginBottom:8 }}>🏭</div>
          <div style={{ fontSize:15 }}>Chưa có khu vực nào. Nhấn "+ Thêm khu vực" để bắt đầu khảo sát hiện trường.</div>
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
              borderBottom:isOpen?`1px solid ${C.bd0}40`:"none",
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:20, cursor:"pointer" }} onClick={()=>setOpenZone(p=>({...p,[zone.id]:!isOpen}))}>
                {zone.icon||"🏭"}
              </span>
              <div style={{ flex:1, cursor:"pointer" }} onClick={()=>setOpenZone(p=>({...p,[zone.id]:!isOpen}))}>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17, fontWeight:700, color:C.t0 }}>
                  {zone.name || `Khu vực ${zi+1}`}
                  {zone.is_seu && <Tag c={C.orange} sx={{ marginLeft:8 }}>⚡ SEU</Tag>}
                </div>
                {zone.zone_type && <div style={{ fontSize:13, color:C.t2 }}>{zone.zone_type}</div>}
              </div>
              {zone.consumption && <Tag c={C.skyL}>{zone.consumption}</Tag>}
              {sc>0 && <span style={{ background:cfg.bg, color:cfg.col, border:`1px solid ${cfg.col}25`,
                borderRadius:5, padding:"2px 8px", fontSize:13, fontWeight:700 }}>{sc}/5</span>}
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.bg3, padding: "2px 4px", borderRadius: 6, border: `1px solid ${C.bd1}` }} onClick={e => e.stopPropagation()}>
                <Btn v="ghost" sz="sm" onClick={(e)=>{ e.stopPropagation(); moveZone(zi, -1); }} disabled={zi === 0} sx={{ padding:"2px 6px", minHeight: 24 }}>▲</Btn>
                <input 
                  type="number" 
                  value={zi + 1} 
                  min={1} 
                  max={zones.length}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) moveToIndex(zi, val - 1);
                  }}
                  style={{ width: 32, background: "transparent", border: "none", color: C.blueL, fontSize: 13, textAlign: "center", outline: "none", fontWeight: 700 }}
                  onClick={e => e.stopPropagation()}
                />
                <span style={{ color: C.t2, fontSize: 12, marginRight: 4 }}>/ {zones.length}</span>
                <Btn v="ghost" sz="sm" onClick={(e)=>{ e.stopPropagation(); moveZone(zi, 1); }} disabled={zi === zones.length - 1} sx={{ padding:"2px 6px", minHeight: 24 }}>▼</Btn>
              </div>
              <Btn v="blue" sz="sm" onClick={(e)=>{ e.stopPropagation(); setEditZone({ id: zone.id }); }}>Sửa thông tin</Btn>
              <Btn v="ghost" sz="sm" onClick={(e)=>{ e.stopPropagation(); removeZone(zone.id); }} sx={{ color:C.red, borderColor:C.red+"40" }}>✕</Btn>
              <span style={{ color:C.t2, cursor:"pointer", paddingLeft: 6 }} onClick={()=>setOpenZone(p=>({...p,[zone.id]:!isOpen}))}>
                {isOpen?"▼":"▶"}
              </span>
            </div>

            {isOpen && (
              <div style={{ padding:16 }}>
                {/* Visual Summary */}
                <div style={{ marginBottom: 16, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                   <div style={{ flex: 1, minWidth: 250, background: C.bg3, padding: 12, borderRadius: 8, border: `1px solid ${C.bd0}` }}>
                     <div style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700, color: C.t2, marginBottom: 8 }}>Thông tin chung</div>
                     <div style={{ fontSize: 14, color: C.t0 }}><strong>Năng lượng:</strong> {zone.energy_types || "—"}</div>
                     <div style={{ fontSize: 14, color: C.t0 }}><strong>Mức tiêu thụ:</strong> {zone.consumption || "—"} ({zone.percentage || "—"}%)</div>
                     <div style={{ fontSize: 14, color: C.t0 }}><strong>Người vận hành:</strong> {zone.operator || "—"}</div>
                     <div style={{ fontSize: 14, color: C.t0 }}><strong>Tiềm năng TKNL:</strong> <span style={{ color: C.tealL }}>{zone.potential || "—"}</span></div>
                   </div>
                   <div style={{ flex: 1, minWidth: 250, background: C.bg3, padding: 12, borderRadius: 8, border: `1px solid ${C.bd0}` }}>
                     <div style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700, color: C.t2, marginBottom: 8 }}>Ghi chú hiện trường</div>
                     <div style={{ fontSize: 14, color: C.t0, whiteSpace: "pre-wrap" }}>{zone.notes || <span style={{color:C.t3}}><em>Chưa có ghi chú</em></span>}</div>
                   </div>
                </div>

                {/* Equipment list */}
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <span style={{ fontSize:16, fontWeight:700, color:C.t0, fontFamily: "'Rajdhani',sans-serif" }}>
                      ⚙️ Danh sách Thiết bị ({(zone.equipment||[]).length})
                    </span>
                    <Btn v="primary" sz="sm" onClick={()=>addEquip(zone.id)}>＋ Thêm thiết bị</Btn>
                  </div>

                  <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
                    {(zone.equipment||[]).map((eq, ei) => {
                      const eqcol = STATUS_COL[eq.status] || C.teal;
                      const eqsc  = eq.gap_score || 0;
                      return (
                        <div key={eq.id} style={{ background:C.bg3, borderRadius:8, padding:12, border:`1px solid ${eqcol}40`, borderLeft: `4px solid ${eqcol}aa`, display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                               <div style={{ fontWeight: 700, color: C.t0, fontSize: 15 }}>{eq.name || `Thiết bị ${ei+1}`}</div>
                               <div style={{ fontSize: 13, color: C.t2 }}>{eq.type || "Loại thiết bị"} • {eq.capacity || "Công suất"}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                               <Btn v="ghost" sz="sm" onClick={()=>setEditEquip({ zid: zone.id, equip: eq })} sx={{ padding: "4px 10px", color: C.blueL }}>Sửa</Btn>
                               <Btn v="ghost" sz="sm" onClick={()=>removeEquip(zone.id,eq.id)} sx={{ padding: "4px 8px", color:C.red }}>✕</Btn>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <Tag sm c={eqcol}>{EQ_STATUSES.find(s=>s[0]===eq.status)?.[1]}</Tag>
                            {eqsc > 0 && <Tag sm c={SCORE_CFG[eqsc]?.col}>GAP: {eqsc}/5</Tag>}
                            {eq.age && <Tag sm c={C.sky}>Tuổi: {eq.age}</Tag>}
                          </div>
                          {eq.finding && <div style={{ fontSize: 13, color: C.t1, marginTop: 4 }}><strong>Phát hiện:</strong> {eq.finding}</div>}
                          {eq.recommendation && <div style={{ fontSize: 13, color: C.tealL }}><strong>Đề xuất:</strong> {eq.recommendation}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {(zone.equipment||[]).length === 0 && (
                    <div style={{ textAlign:"center", padding:"16px", background:C.bg4,
                      borderRadius:8, border:`1px dashed ${C.bd0}`, color:C.t3, fontSize:14 }}>
                      Chưa có thiết bị nào. Nhấn "＋ Thêm thiết bị" để bắt đầu.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Solar Panel */}
      <div style={{ background: C.bg2, borderRadius: 10, padding: 16, border: `1px solid ${C.bd0}30`, marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.t0, fontFamily: "'Rajdhani',sans-serif" }}>
            ☀️ Tổng Điện Mặt Trời (Solar)
          </div>
          <Btn v="blue" sz="sm" onClick={() => {
            const ss = survey.solar_assessments || [];
            setSurvey(p => ({...p, solar_assessments: [...ss, newSolar()]}));
          }}>＋ Thêm Hệ thống Solar</Btn>
        </div>

        {(survey.solar_assessments || []).map((sol, si) => (
          <div key={sol.id} style={{ display: "flex", gap: 10, background: C.bg3, padding: 12, borderRadius: 8, marginBottom: 8, border: `1px solid ${C.bd1}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: C.t2, fontWeight: 700, marginBottom: 3, textTransform: "uppercase" }}>Tên Trạm</div>
              <Input value={sol.name} onChange={v => {
                setSurvey(p => ({...p, solar_assessments: p.solar_assessments.map(s => s.id===sol.id ? {...s, name: v} : s)}));
              }} placeholder="Trạm 1..."/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: C.t2, fontWeight: 700, marginBottom: 3, textTransform: "uppercase" }}>Công suất lắp (kWp)</div>
              <Input value={sol.capacity} onChange={v => {
                setSurvey(p => ({...p, solar_assessments: p.solar_assessments.map(s => s.id===sol.id ? {...s, capacity: v} : s)}));
              }} placeholder="500 kWp"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: C.t2, fontWeight: 700, marginBottom: 3, textTransform: "uppercase" }}>Sản lượng (kWh/năm)</div>
              <Input value={sol.generation} onChange={v => {
                setSurvey(p => ({...p, solar_assessments: p.solar_assessments.map(s => s.id===sol.id ? {...s, generation: v} : s)}));
              }} placeholder="650,000 kWh"/>
            </div>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 11.5, color: C.t2, fontWeight: 700, marginBottom: 3, textTransform: "uppercase" }}>Ghi chú hiện trạng</div>
              <Input value={sol.notes} onChange={v => {
                setSurvey(p => ({...p, solar_assessments: p.solar_assessments.map(s => s.id===sol.id ? {...s, notes: v} : s)}));
              }} placeholder="Đang bám tải, vệ sinh tốt..."/>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <Btn v="ghost" sz="sm" onClick={() => {
                setSurvey(p => ({...p, solar_assessments: p.solar_assessments.filter(s => s.id!==sol.id)}));
              }} sx={{ color: C.red, height: 36 }}>✕</Btn>
            </div>
          </div>
        ))}
        {!(survey.solar_assessments?.length > 0) && (
          <div style={{ textAlign: "center", color: C.t3, padding: 16, border: `1px dashed ${C.bd1}`, borderRadius: 8 }}>
            Chưa có Hệ thống điện mặt trời mái nhà/áp mái nào. Nhấn "+ Thêm Hệ thống Solar" để bổ sung.
          </div>
        )}
      </div>

      {/* Modal CRUD Zone */}
      {editZone && currentEditZone && (
        <Modal open={true} onClose={() => setEditZone(null)} title={`Thông tin Nhà xưởng / Khu vực`} width={720}>
          <Grid cols={2} gap={16}>
            <Field label="Tên khu vực / Nhà xưởng" required>
              <Input value={currentEditZone.name} onChange={v=>setZone(currentEditZone.id,"name",v)} placeholder="Xưởng sản xuất A..."/>
            </Field>
            <Field label="Loại khu vực">
              <Sel value={currentEditZone.zone_type||""} onChange={v=>setZone(currentEditZone.id,"zone_type",v)}
                options={[["","— Chọn loại —"],...ZONE_TYPES.map(t=>[t.name,`${t.icon} ${t.name}`])]}/>
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Biểu tượng nhận diện">
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {ZONE_ICONS.map(ic=>(
                    <button key={ic} onClick={()=>setZone(currentEditZone.id,"icon",ic)}
                      style={{ background:currentEditZone.icon===ic?C.blue+"30":"transparent",
                        border:`1px solid ${currentEditZone.icon===ic?C.blueL:C.bd0}`,
                        borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:22, transition: "all .2s" }}>{ic}</button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Loại NL tiêu thụ chính">
              <Input value={currentEditZone.energy_types} onChange={v=>setZone(currentEditZone.id,"energy_types",v)} placeholder="Điện, Than, Khí nén..."/>
            </Field>
            <Field label="Tiêu thụ hàng năm">
              <Input value={currentEditZone.consumption} onChange={v=>setZone(currentEditZone.id,"consumption",v)} placeholder="5.000.000 kWh/năm"/>
            </Field>
            <Field label="Tỷ trọng NL (%)">
              <Input value={currentEditZone.percentage} onChange={v=>setZone(currentEditZone.id,"percentage",v)} placeholder="35%"/>
            </Field>
            <Field label="Người vận hành/Quản lý">
              <Input value={currentEditZone.operator} onChange={v=>setZone(currentEditZone.id,"operator",v)} placeholder="Ca trưởng / Bộ phận phụ trách"/>
            </Field>
            <Field label="Tiềm năng Tiết kiệm NL">
              <Input value={currentEditZone.potential} onChange={v=>setZone(currentEditZone.id,"potential",v)} placeholder="8–12% (~600.000 kWh)"/>
            </Field>
            <Field label="Phân loại SEU">
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:`${C.orange}15`, borderRadius:8, border: `1px solid ${C.orange}30`, height: "100%" }}>
                <input type="checkbox" checked={!!currentEditZone.is_seu} onChange={e=>setZone(currentEditZone.id,"is_seu",e.target.checked)}
                  style={{ width:18, height:18, accentColor:C.orangeL, cursor:"pointer" }}/>
                <span style={{ fontSize:14, color:currentEditZone.is_seu?C.orangeL:C.t1, fontWeight: 600 }}>
                  Đây là khu vực SEU (Tiêu thụ NL trọng yếu)
                </span>
              </div>
            </Field>
          </Grid>

          <div style={{ marginTop:20, paddingTop: 16, borderTop: `1px solid ${C.bd0}` }}>
            <div style={{ fontSize:13, color:C.t2, fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>
              Điểm đánh giá GAP (0-5)
            </div>
            <ScorePicker value={currentEditZone.gap_score} onChange={v=>setZone(currentEditZone.id,"gap_score",v)}/>
          </div>

          <div style={{ marginTop:20 }}>
            <Field label="Nhận xét hiện trường / Phát hiện chính:">
              <TA value={currentEditZone.notes||""} onChange={v=>setZone(currentEditZone.id,"notes",v)}
                placeholder="Quan sát tại chỗ: thiết bị vận hành, hiệu suất, rò rỉ, đo lường, nhận thức nhân viên..."
                rows={4}/>
            </Field>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:24 }}>
            <Btn v="blue" sz="lg" onClick={()=>setEditZone(null)}>Hoàn tất Sửa (Đóng)</Btn>
          </div>
        </Modal>
      )}

      {/* Modal CRUD Equipment */}
      {editEquip && (
        <Modal open={true} onClose={() => setEditEquip(null)} title="Chi tiết thiết bị" width={640}>
          <Grid cols={2} gap={16}>
            <Field label="Tên thiết bị *" required>
              <Input value={editEquip.equip.name} onChange={v => setEditEquip(p => ({...p, equip: {...p.equip, name: v}}))} placeholder="Máy nén khí số 1..." />
            </Field>
            <Field label="Loại thiết bị">
              <Sel value={editEquip.equip.type||""} onChange={v => setEditEquip(p => ({...p, equip: {...p.equip, type: v}}))}
                options={[["","— Chọn loại thiếp bị —"],...EQUIPMENT_TYPES.map(t=>[t.name,`${t.icon} ${t.name}`])]}/>
            </Field>
            <Field label="Công suất / Kích cỡ">
              <Input value={editEquip.equip.capacity} onChange={v => setEditEquip(p => ({...p, equip: {...p.equip, capacity: v}}))} placeholder="110 kW" />
            </Field>
            <Field label="Tuổi đời (năm)">
              <Input value={editEquip.equip.age} onChange={v => setEditEquip(p => ({...p, equip: {...p.equip, age: v}}))} placeholder="5 năm" />
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Trạng thái vận hành">
                 <div style={{ display: "flex", gap: 10 }}>
                   {EQ_STATUSES.map(([val, label]) => (
                     <Btn key={val} v="ghost" sz="sm" 
                       onClick={() => setEditEquip(p => ({...p, equip: {...p.equip, status: val}}))}
                       sx={{
                         flex: 1, 
                         border: `1px solid ${STATUS_COL[val]}50`,
                         background: editEquip.equip.status === val ? `${STATUS_COL[val]}25` : "transparent",
                         color: editEquip.equip.status === val ? STATUS_COL[val] : C.t1
                       }}>
                       {label}
                     </Btn>
                   ))}
                 </div>
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1", paddingTop: 12, borderTop: `1px solid ${C.bd0}` }}>
              <div style={{ fontSize:13, color:C.t2, fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>
                Điểm đánh giá GAP thiết bị (0-5)
              </div>
              <ScorePicker value={editEquip.equip.gap_score} onChange={v => setEditEquip(p => ({...p, equip: {...p.equip, gap_score: v}}))}/>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Phát hiện & Quan sát tại hiện trường">
                <TA value={editEquip.equip.finding||""} onChange={v => setEditEquip(p => ({...p, equip: {...p.equip, finding: v}}))} placeholder="Vận hành dưới tải, tiếng ồn lớn, rò rỉ khí..." rows={3} />
              </Field>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Đề xuất cải tiến & Khắc phục">
                <TA value={editEquip.equip.recommendation||""} onChange={v => setEditEquip(p => ({...p, equip: {...p.equip, recommendation: v}}))} placeholder="Thay bằng biến tần, bảo dưỡng lại bạc đạn..." rows={3} />
              </Field>
            </div>
          </Grid>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
            <Btn v="ghost" sz="md" onClick={() => setEditEquip(null)}>Huỷ</Btn>
            <Btn v="primary" sz="md" onClick={() => saveEquip(editEquip.zid, editEquip.equip)}>Lưu lại</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
