/**
 * StepEquipment_Onsite — Đánh giá Thiết bị Tiêu thụ Năng lượng (SEU/Equipment)
 * CRUD thiết bị, thông số kỹ thuật, trạng thái hiệu suất, câu hỏi, bằng chứng
 */
import { useState } from "react";
import EvidencePanel from "./EvidencePanel";
import {
  EQUIPMENT_TYPES, EQUIPMENT_STATUS, ZONE_TYPES,
  EQUIPMENT_AUDIT_QUESTIONS, C,
} from "./OnsiteAuditConstants";

const inp = {
  background:C.bg3, border:`1px solid ${C.bd}`, borderRadius:6,
  color:C.t0, fontSize:12, padding:"7px 10px", outline:"none",
  width:"100%", boxSizing:"border-box",
};
const sel = { ...inp };

const EMPTY_EQUIP = {
  id: "", name:"", zone:"", type:EQUIPMENT_TYPES[0], brand:"", model:"",
  capacity:"", unit:"kW", year:"", count:1,
  isSEU:false, euPercent:"",
  status:"unknown",
  ratedEfficiency:"", actualEfficiency:"",
  monthlyConsumption:"", operatingHours:"",
  lastMaintenanceDate:"",
  answers:{}, finding:"", recommendation:"",
};

function genId() { return `EQ-${Date.now().toString(36).slice(-5).toUpperCase()}`; }

// ── Status badge ─────────────────────────────────────────────────
function StatusBadge({ v }) {
  const cfg = EQUIPMENT_STATUS.find(s => s.v === v) || EQUIPMENT_STATUS[3];
  return (
    <span style={{ background:`${cfg.col}18`, color:cfg.col,
      border:`1px solid ${cfg.col}44`, borderRadius:6,
      padding:"2px 9px", fontSize:11, fontWeight:700 }}>
      {cfg.label}
    </span>
  );
}

// ── Equipment card ────────────────────────────────────────────────
function EquipCard({ equip, idx, onUpdate, onDelete, evHook, expanded, onToggle }) {
  const stepKey = `equip-${equip.id}`;
  const statusCfg = EQUIPMENT_STATUS.find(s => s.v === equip.status) || EQUIPMENT_STATUS[3];

  const up = (field, val) => onUpdate(equip.id, field, val);

  return (
    <div style={{
      background:C.bg2, borderRadius:10, marginBottom:10,
      border:`1px solid ${equip.isSEU ? C.amberL+"55" : C.bd}`,
      borderLeft:`4px solid ${equip.isSEU ? C.amberL : statusCfg.col}`,
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px" }}>
        <span style={{ color:C.t2, fontWeight:700, fontSize:11, minWidth:32 }}>
          #{idx+1}
        </span>
        <div style={{ flex:1, cursor:"pointer" }} onClick={onToggle}>
          <p style={{ color:C.t0, fontWeight:600, fontSize:13, margin:0 }}>
            {equip.name || `[Chưa đặt tên]`}
            {equip.isSEU && (
              <span style={{ marginLeft:8, background:`${C.amberL}20`, color:C.amberL,
                border:`1px solid ${C.amberL}44`, borderRadius:4,
                padding:"1px 6px", fontSize:10, fontWeight:700 }}>
                ⚡ SEU
              </span>
            )}
          </p>
          <p style={{ color:C.t2, fontSize:11, margin:0 }}>
            {equip.type} {equip.brand&&`· ${equip.brand}`} {equip.model&&`${equip.model}`}
            {equip.zone&&` · 📍 ${equip.zone}`}
            {equip.capacity&&` · ${equip.capacity} ${equip.unit}`}
          </p>
        </div>
        <StatusBadge v={equip.status}/>
        {evHook.getByStep(stepKey).length > 0 && (
          <span style={{ background:`${C.tealL}20`, color:C.tealL, borderRadius:4,
            padding:"1px 7px", fontSize:11, fontWeight:700 }}>
            📎 {evHook.getByStep(stepKey).length}
          </span>
        )}
        <button onClick={onToggle} style={{ background:"none",border:"none",color:C.t2,cursor:"pointer",fontSize:16 }}>
          {expanded?"▾":"▸"}
        </button>
        <button onClick={() => onDelete(equip.id)}
          style={{ background:`${C.redL}18`, border:`1px solid ${C.redL}44`, color:C.redL,
            borderRadius:6, padding:"3px 8px", fontSize:11, cursor:"pointer", fontWeight:700 }}>
          🗑
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.bd}`, padding:"14px 16px" }}>
          {/* ── Basic info ─────────────────────────────────────── */}
          <p style={{ color:C.t2, fontSize:11, fontWeight:700,
            textTransform:"uppercase", marginBottom:10 }}>📋 Thông tin thiết bị</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
            <div>
              <label style={lbl}>Tên thiết bị *</label>
              <input value={equip.name} onChange={e=>up("name",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Loại thiết bị</label>
              <select value={equip.type} onChange={e=>up("type",e.target.value)} style={sel}>
                {EQUIPMENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Khu vực / Phân xưởng</label>
              <select value={equip.zone} onChange={e=>up("zone",e.target.value)} style={sel}>
                <option value="">— Chọn khu vực —</option>
                {ZONE_TYPES.map(z=><option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Hãng sản xuất</label>
              <input value={equip.brand} onChange={e=>up("brand",e.target.value)} placeholder="ABB, Siemens…" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Model / Ký hiệu</label>
              <input value={equip.model} onChange={e=>up("model",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Năm lắp đặt / Sản xuất</label>
              <input type="number" value={equip.year} onChange={e=>up("year",e.target.value)} placeholder="2019" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Công suất / Lưu lượng</label>
              <input value={equip.capacity} onChange={e=>up("capacity",e.target.value)} placeholder="75" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Đơn vị</label>
              <input value={equip.unit} onChange={e=>up("unit",e.target.value)} placeholder="kW / kVA / kW…" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Số lượng</label>
              <input type="number" value={equip.count} onChange={e=>up("count",+e.target.value)} min={1} style={inp}/>
            </div>
          </div>

          {/* ── SEU + efficiency ─────────────────────────────────── */}
          <p style={{ color:C.t2, fontSize:11, fontWeight:700,
            textTransform:"uppercase", marginBottom:10 }}>⚡ Năng lượng & Hiệu suất</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, gridColumn:"1/-1" }}>
              <label style={{ cursor:"pointer", color:C.amberL, fontSize:13,
                display:"flex", alignItems:"center", gap:8,
                background:`${C.amberL}15`, border:`1px solid ${C.amberL}44`,
                borderRadius:8, padding:"6px 14px" }}>
                <input type="checkbox" checked={!!equip.isSEU}
                  onChange={e=>up("isSEU",e.target.checked)} style={{ width:16, height:16 }}/>
                ⚡ Đây là SEU (Đối tượng tiêu thụ NL trọng điểm)
              </label>
              {equip.isSEU && (
                <div style={{ flex:1 }}>
                  <label style={lbl}>% Tiêu thụ NL trong tổng</label>
                  <input value={equip.euPercent} onChange={e=>up("euPercent",e.target.value)}
                    placeholder="35 %" style={inp}/>
                </div>
              )}
            </div>
            <div>
              <label style={lbl}>Hiệu suất thiết kế</label>
              <input value={equip.ratedEfficiency} onChange={e=>up("ratedEfficiency",e.target.value)}
                placeholder="IE3 / 94.5% / COP 4.2" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Hiệu suất thực tế (đo)</label>
              <input value={equip.actualEfficiency} onChange={e=>up("actualEfficiency",e.target.value)}
                placeholder="Đo tại hiện trường" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Tiêu thụ NL/tháng</label>
              <input value={equip.monthlyConsumption} onChange={e=>up("monthlyConsumption",e.target.value)}
                placeholder="kWh / m³ / lít" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Giờ vận hành/tháng</label>
              <input value={equip.operatingHours} onChange={e=>up("operatingHours",e.target.value)}
                placeholder="h/tháng" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Bảo trì / Vệ sinh gần nhất</label>
              <input type="date" value={equip.lastMaintenanceDate}
                onChange={e=>up("lastMaintenanceDate",e.target.value)} style={inp}/>
            </div>
          </div>

          {/* ── Status ──────────────────────────────────────────── */}
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.t2, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:8 }}>🔧 Trạng thái hiệu suất:</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {EQUIPMENT_STATUS.map(s => (
                <button key={s.v} onClick={() => up("status",s.v)} style={{
                  padding:"5px 12px", borderRadius:6, fontSize:11.5, fontWeight:700,
                  border:`1px solid ${s.col}55`, cursor:"pointer",
                  background: equip.status===s.v ? s.col : `${s.col}15`,
                  color: equip.status===s.v ? "#fff" : s.col,
                }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Audit questions ─────────────────────────────────── */}
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.amberL, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:8 }}>🔍 Câu hỏi đánh giá thiết bị:</p>
            {EQUIPMENT_AUDIT_QUESTIONS.map((q, i) => (
              <div key={i} style={{ marginBottom:10 }}>
                <p style={{ color:C.t1, fontSize:12, marginBottom:4,
                  paddingLeft:12, borderLeft:`2px solid ${C.amberL}40` }}>
                  {i+1}. {q}
                </p>
                <input value={(equip.answers||{})[i]||""}
                  onChange={e => up("answers", { ...(equip.answers||{}), [i]:e.target.value })}
                  placeholder="Ghi nhận câu trả lời / thông số đo tại hiện trường…"
                  style={{ ...inp, marginLeft:12 }}/>
              </div>
            ))}
          </div>

          {/* ── Finding + Recommendation ─────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>📝 Phát hiện tại hiện trường</label>
              <textarea value={equip.finding||""} rows={3}
                onChange={e=>up("finding",e.target.value)}
                placeholder="Mô tả tình trạng, bất thường, điểm cần cải thiện…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={lbl}>💡 Khuyến nghị</label>
              <textarea value={equip.recommendation||""} rows={3}
                onChange={e=>up("recommendation",e.target.value)}
                placeholder="Đề xuất bảo trì, thay thế, vận hành tối ưu…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
          </div>

          {/* ── Evidence ─────────────────────────────────────────── */}
          <div style={{ background:C.bg3, borderRadius:8, padding:"10px 12px",
            border:`1px solid ${C.bd}` }}>
            <p style={{ color:C.t2, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:6 }}>
              📎 Bằng chứng — {equip.name || equip.id}
              {equip.isSEU && " ⚡ SEU"}
            </p>
            <EvidencePanel evHook={evHook} stepKey={stepKey}
              note={`Thiết bị: ${equip.name} (${equip.type})`} compact/>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = {
  display:"block", fontSize:11, color:C.t2, fontWeight:700,
  textTransform:"uppercase", letterSpacing:.3, marginBottom:4,
};

// ── Main ──────────────────────────────────────────────────────────
export default function StepEquipment_Onsite({ equipList, onEquipUpdate, onEquipAdd, onEquipDelete, evHook, onSave, saving }) {
  const [expanded, setExpanded] = useState({});
  const toggle = id => setExpanded(e => ({ ...e, [id]:!e[id] }));

  const addEquip = () => {
    const newItem = { ...EMPTY_EQUIP, id: genId() };
    onEquipAdd(newItem);
    setExpanded(e => ({ ...e, [newItem.id]:true }));
  };

  const handleUpdate = (id, field, val) => {
    onEquipUpdate(id, field, val);
  };

  const seus     = equipList.filter(e => e.isSEU);
  const critical = equipList.filter(e => e.status === "critical");
  const totalEv  = evHook.evidence.filter(ev => ev.stepKey?.startsWith("equip-")).length;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { l:"Tổng thiết bị", v:equipList.length, col:C.blueL  },
          { l:"SEU",            v:seus.length,       col:C.amberL },
          { l:"Cần cải thiện",  v:critical.length,   col:C.redL   },
          { l:"Bằng chứng",     v:totalEv,           col:C.tealL  },
        ].map(k => (
          <div key={k.l} style={{ background:`${k.col}14`, border:`1px solid ${k.col}30`,
            borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:100 }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.col }}>{k.v}</div>
            <div style={{ fontSize:10, color:C.t2, fontWeight:700, textTransform:"uppercase" }}>{k.l}</div>
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={addEquip}
            style={{ padding:"8px 18px", background:`${C.amberL}22`, border:`1px solid ${C.amberL}55`,
              color:C.amberL, borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            ➕ Thêm thiết bị
          </button>
          <button onClick={onSave} disabled={saving}
            style={{ padding:"8px 20px", background:saving?C.t3:C.tealL,
              color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            {saving ? "⏳ Đang lưu…" : "💾 Lưu thiết bị"}
          </button>
        </div>
      </div>

      {equipList.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px",
          background:C.bg2, borderRadius:12, border:`1px dashed ${C.bd}` }}>
          <p style={{ color:C.amberL, fontSize:32, marginBottom:8 }}>⚡</p>
          <p style={{ color:C.t0, fontWeight:700, fontSize:15, marginBottom:6 }}>
            Chưa có thiết bị nào
          </p>
          <p style={{ color:C.t2, fontSize:13, marginBottom:16 }}>
            Thêm thiết bị tiêu thụ năng lượng để đánh giá: motor, lò hơi, máy nén khí, hệ thống lạnh…
          </p>
          <button onClick={addEquip}
            style={{ padding:"10px 24px", background:C.amberL, color:"#000",
              border:"none", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer" }}>
            ➕ Thêm thiết bị đầu tiên
          </button>
        </div>
      )}

      {equipList.map((eq, idx) => (
        <EquipCard key={eq.id} equip={eq} idx={idx}
          onUpdate={handleUpdate}
          onDelete={onEquipDelete}
          evHook={evHook}
          expanded={!!expanded[eq.id]}
          onToggle={() => toggle(eq.id)}/>
      ))}
    </div>
  );
}
