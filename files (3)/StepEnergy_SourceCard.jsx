/**
 * StepEnergy_Onsite — Tiếp cận theo Nguồn Năng lượng Sử dụng
 * File A: Components EnergySourceCard + MonthlyDataTable
 * (Import bởi StepEnergy_Onsite_Shell.jsx)
 */
import { useState } from "react";
import EvidencePanel from "./EvidencePanel";
import {
  ENERGY_TYPE_CATALOG, TREND_CFG, CONFORMANCE_CFG, PRIORITY_CFG,
  DATA_QUALITY_CFG, genMonthlyData, calcGJ, calcTOE,
  fmtNum, fmtCost, MONTHS_VI,
} from "./EnergySourceConstants";
import { C } from "./OnsiteAuditConstants";

const inp = {
  background:C.bg3, border:`1px solid ${C.bd}`, borderRadius:6,
  color:C.t0, fontSize:12, padding:"7px 10px", outline:"none",
  width:"100%", boxSizing:"border-box",
};
const lbl = {
  display:"block", fontSize:11, color:C.t2, fontWeight:700,
  textTransform:"uppercase", letterSpacing:.3, marginBottom:4,
};

// ── Monthly data table ────────────────────────────────────────────
export function MonthlyDataTable({ source, onMonthChange, year = new Date().getFullYear() }) {
  const monthData = source.monthlyData || genMonthlyData(year);
  const catalog   = ENERGY_TYPE_CATALOG.find(e => e.id === source._energyTypeId || e.label === source.energyType);

  const handleChange = (idx, field, rawVal) => {
    const val   = parseFloat(rawVal) || 0;
    const row   = { ...monthData[idx], [field]: val };
    // Auto-compute GJ and TOE when value changes
    if (field === "value" && catalog) {
      row.valueGJ  = +(val * (source.conversionToGJ  || catalog.convToGJ  || 0)).toFixed(4);
      row.valueTOE = +(val * (source.conversionToTOE || catalog.convToTOE || 0)).toFixed(4);
    }
    const updated = [...monthData];
    updated[idx] = row;
    onMonthChange(updated);
  };

  const totals = {
    value:    monthData.reduce((a,m)=>a+(m.value||0),0),
    valueGJ:  monthData.reduce((a,m)=>a+(m.valueGJ||0),0),
    valueTOE: monthData.reduce((a,m)=>a+(m.valueTOE||0),0),
    cost:     monthData.reduce((a,m)=>a+(m.cost||0),0),
  };

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ borderBottom:`2px solid ${C.bd}` }}>
            {["Tháng", `${source.primaryUnit||"Đv sơ cấp"}`, "GJ", "TOE", "Chi phí (đ)", "Đơn giá"]
              .map(h => (
              <th key={h} style={{ padding:"7px 10px", color:C.t2, fontWeight:700,
                textAlign:"center", whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthData.map((m, i) => (
            <tr key={i} style={{ borderBottom:`1px solid ${C.t3}18` }}>
              <td style={{ padding:"5px 10px", color:C.amberL, fontWeight:700,
                textAlign:"center", fontSize:12 }}>
                {MONTHS_VI[i]}
              </td>
              {[
                ["value",      i, "number"],
                ["valueGJ",    i, "number"],
                ["valueTOE",   i, "number"],
                ["cost",       i, "number"],
                ["unit_price", i, "number"],
              ].map(([field]) => (
                <td key={field} style={{ padding:"3px 6px" }}>
                  <input
                    type="number" min={0} step="any"
                    value={m[field] ?? 0}
                    onChange={e => handleChange(i, field, e.target.value)}
                    style={{ ...inp, textAlign:"right", padding:"5px 7px", fontSize:12 }}/>
                </td>
              ))}
            </tr>
          ))}
          {/* Totals row */}
          <tr style={{ borderTop:`2px solid ${C.amberL}40`, background:`${C.amberL}10` }}>
            <td style={{ padding:"7px 10px", color:C.amberL, fontWeight:800, textAlign:"center" }}>Tổng</td>
            <td style={{ padding:"7px 10px", color:C.t0, fontWeight:700, textAlign:"center" }}>
              {fmtNum(totals.value,2)}
            </td>
            <td style={{ padding:"7px 10px", color:C.tealL, fontWeight:700, textAlign:"center" }}>
              {fmtNum(totals.valueGJ,2)}
            </td>
            <td style={{ padding:"7px 10px", color:C.greenL, fontWeight:700, textAlign:"center" }}>
              {fmtNum(totals.valueTOE,3)}
            </td>
            <td style={{ padding:"7px 10px", color:C.amberL, fontWeight:700, textAlign:"center" }}>
              {fmtCost(totals.cost)}
            </td>
            <td/>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Secondary consumption section ──────────────────────────────────
function SecondaryOutputs({ source, onUpdate }) {
  const items = source.secondaryOutputs || [];

  const add = () => {
    onUpdate("secondaryOutputs", [
      ...items,
      { description:"", sourceType:"steam", primaryFuel:source.energyType, unit:"tấn/tháng",
        annualValue:0, convertedGJ:0, convertedTOE:0, users:[], is_seu:false, notes:"" }
    ]);
  };
  const rm = (i) => { const n=[...items]; n.splice(i,1); onUpdate("secondaryOutputs",n); };
  const upd = (i,k,v) => {
    const n = items.map((x,idx)=>idx===i?{...x,[k]:v}:x);
    onUpdate("secondaryOutputs",n);
  };

  return (
    <div style={{ background:C.bg3, borderRadius:8, padding:12, border:`1px solid ${C.bd}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <p style={{ color:C.skyL, fontSize:11, fontWeight:700, textTransform:"uppercase", margin:0 }}>
          ♻️ Tiêu thụ thứ cấp phát sinh từ nguồn này
        </p>
        <button onClick={add} style={{ padding:"4px 10px", background:`${C.skyL}22`,
          border:`1px solid ${C.skyL}44`, color:C.skyL, borderRadius:6, fontSize:11,
          fontWeight:700, cursor:"pointer" }}>+ Thêm</button>
      </div>
      {items.length === 0 && (
        <p style={{ color:C.t2, fontSize:12 }}>
          Chưa có tiêu thụ thứ cấp. Ví dụ: hơi nước nội bộ, không khí nén, nước lạnh…
        </p>
      )}
      {items.map((item, i) => (
        <div key={i} style={{ background:C.bg2, borderRadius:7, padding:12, marginBottom:8,
          border:`1px solid ${C.bd}` }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Mô tả tiêu thụ thứ cấp</label>
              <input value={item.description||""} onChange={e=>upd(i,"description",e.target.value)}
                placeholder="VD: Hơi nước 8bar từ lò hơi nội bộ cấp cho dây chuyền…" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Loại năng lượng thứ cấp</label>
              <select value={item.sourceType||"steam"} onChange={e=>upd(i,"sourceType",e.target.value)} style={inp}>
                {["steam","compressed_air","chilled_water","hot_water","cold_storage","other"].map(v=>(
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Đơn vị</label>
              <input value={item.unit||""} onChange={e=>upd(i,"unit",e.target.value)}
                placeholder="tấn/tháng, m³/h, kW" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Sản lượng hàng năm</label>
              <input type="number" value={item.annualValue||0} onChange={e=>upd(i,"annualValue",+e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Quy đổi GJ/năm</label>
              <input type="number" value={item.convertedGJ||0} onChange={e=>upd(i,"convertedGJ",+e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Quy đổi TOE/năm</label>
              <input type="number" value={item.convertedTOE||0} onChange={e=>upd(i,"convertedTOE",+e.target.value)} style={inp}/>
            </div>
            <div style={{ display:"flex", alignItems:"flex-end" }}>
              <label style={{ cursor:"pointer", color:C.amberL, fontSize:12,
                display:"flex", alignItems:"center", gap:6 }}>
                <input type="checkbox" checked={!!item.is_seu}
                  onChange={e=>upd(i,"is_seu",e.target.checked)} style={{ width:15, height:15 }}/>
                ⚡ Đây là SEU thứ cấp
              </label>
            </div>
            <div>
              <label style={lbl}>Khu vực sử dụng</label>
              <input value={(item.users||[]).join(", ")} style={inp}
                onChange={e=>upd(i,"users",e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}
                placeholder="Xưởng A, Lò hơi số 1…"/>
            </div>
          </div>
          <button onClick={()=>rm(i)} style={{ marginTop:6, background:"none", border:"none",
            color:C.redL, cursor:"pointer", fontSize:12 }}>🗑 Xóa</button>
        </div>
      ))}
    </div>
  );
}

// ── Energy Source Card (main) ──────────────────────────────────────
export function EnergySourceCard({ source, idx, onUpdate, onDelete, evHook, expanded, onToggle }) {
  const stepKey  = `energy-${source._id || source.sourceId}`;
  const catalog  = ENERGY_TYPE_CATALOG.find(e => e.label === source.energyType);
  const trendCfg = TREND_CFG[source.trend] || TREND_CFG.unknown;
  const priorCfg = PRIORITY_CFG[source.priority || ""];

  const up = (k, v) => onUpdate(source._id || source.sourceId, k, v);

  const handleMonthChange = (updatedMonths) => {
    up("monthlyData", updatedMonths);
    // Auto-fill annual totals
    const gj  = updatedMonths.reduce((a,m)=>a+(m.valueGJ||0),0);
    const toe  = updatedMonths.reduce((a,m)=>a+(m.valueTOE||0),0);
    const prim = updatedMonths.reduce((a,m)=>a+(m.value||0),0);
    const cost = updatedMonths.reduce((a,m)=>a+(m.cost||0),0);
    up("annual_GJ",      +gj.toFixed(3));
    up("annual_TOE",     +toe.toFixed(4));
    up("annual_primary", +prim.toFixed(2));
    up("annual_cost",    +cost.toFixed(0));
  };

  return (
    <div style={{
      background:C.bg2, borderRadius:10, marginBottom:10,
      border:`1px solid ${source.is_seu ? C.amberL+"66" : C.bd}`,
      borderLeft:`4px solid ${catalog?.color || C.blueL}`,
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px" }}>
        <span style={{ fontSize:22, flexShrink:0 }}>{catalog?.icon || "⚡"}</span>
        <div style={{ flex:1, cursor:"pointer" }} onClick={onToggle}>
          <p style={{ color:C.t0, fontWeight:700, fontSize:14, margin:0 }}>
            {source.sourceId} — {source.energyType || "[Chưa chọn loại NL]"}
            {source.is_seu && (
              <span style={{ marginLeft:8, background:`${C.amberL}22`, color:C.amberL,
                border:`1px solid ${C.amberL}44`, borderRadius:4,
                padding:"1px 7px", fontSize:11, fontWeight:700 }}>
                ⚡ SEU — {fmtNum(source.annual_TOE,1)} TOE/năm
              </span>
            )}
          </p>
          <p style={{ color:C.t2, fontSize:11, margin:0 }}>
            {source.supplier && `🏭 ${source.supplier} · `}
            {source.annual_primary ? `${fmtNum(source.annual_primary,0)} ${source.primaryUnit}` : "Chưa có dữ liệu"}
            {source.annual_GJ  ? ` · ${fmtNum(source.annual_GJ,1)} GJ` : ""}
            {source.annual_TOE ? ` · ${fmtNum(source.annual_TOE,2)} TOE` : ""}
            {source.percentOfTotal ? ` · ${source.percentOfTotal}% tổng NL` : ""}
          </p>
        </div>
        <span style={{ color:trendCfg.col, fontSize:16 }} title={trendCfg.label}>
          {trendCfg.icon}
        </span>
        {source.priority && (
          <span style={{ background:`${priorCfg.col}18`, color:priorCfg.col,
            border:`1px solid ${priorCfg.col}44`, borderRadius:6,
            padding:"2px 9px", fontSize:11, fontWeight:700, flexShrink:0 }}>
            {priorCfg.label}
          </span>
        )}
        {evHook.getByStep(stepKey).length > 0 && (
          <span style={{ background:`${C.tealL}20`, color:C.tealL, borderRadius:4,
            padding:"1px 7px", fontSize:11, fontWeight:700, flexShrink:0 }}>
            📎 {evHook.getByStep(stepKey).length}
          </span>
        )}
        <button onClick={onToggle} style={{ background:"none",border:"none",color:C.t2,cursor:"pointer",fontSize:16 }}>
          {expanded?"▾":"▸"}
        </button>
        <button onClick={() => onDelete(source._id || source.sourceId)}
          style={{ background:`${C.redL}18`, border:`1px solid ${C.redL}44`, color:C.redL,
            borderRadius:6, padding:"3px 8px", fontSize:11, cursor:"pointer", fontWeight:700 }}>
          🗑
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.bd}`, padding:"16px 16px" }}>

          {/* ── 1. Thông tin cơ bản ──────────────────────────── */}
          <SectionTitle>📋 Thông tin nguồn năng lượng</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
            <div>
              <label style={lbl}>Loại năng lượng *</label>
              <select value={source.energyType||""} onChange={e=>{
                const cat = ENERGY_TYPE_CATALOG.find(c=>c.label===e.target.value);
                up("energyType", e.target.value);
                up("_energyTypeId", cat?.id||"");
                if (cat) {
                  up("primaryUnit",    cat.unit);
                  up("conversionToGJ", cat.convToGJ);
                  up("conversionToTOE",cat.convToTOE);
                }
              }} style={inp}>
                <option value="">— Chọn loại NL —</option>
                {ENERGY_TYPE_CATALOG.map(t=>(
                  <option key={t.id} value={t.label}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Nhà cung cấp</label>
              <input value={source.supplier||""} onChange={e=>up("supplier",e.target.value)}
                placeholder="EVN, PetroVietnam Gas…" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Dạng năng lượng</label>
              <select value={source.category||"primary"} onChange={e=>up("category",e.target.value)} style={inp}>
                {[["primary","Sơ cấp"],["secondary","Thứ cấp"],["renewable","Tái sinh"],["waste_heat","Nhiệt thải"]].map(([v,l])=>(
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Đơn vị sơ cấp</label>
              <input value={source.primaryUnit||""} onChange={e=>up("primaryUnit",e.target.value)}
                placeholder="kWh, m³, lít, tấn…" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Đv chuyển đổi 1</label>
              <input value={source.secondaryUnit||"GJ"} onChange={e=>up("secondaryUnit",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Đv chuyển đổi 2</label>
              <input value={source.tertiaryUnit||"TOE"} onChange={e=>up("tertiaryUnit",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Hệ số quy đổi → GJ</label>
              <input type="number" step="any" value={source.conversionToGJ||catalog?.convToGJ||0}
                onChange={e=>up("conversionToGJ",+e.target.value)} style={inp}/>
              <p style={{ color:C.t2, fontSize:10, marginTop:3 }}>1 {source.primaryUnit||"Đv"} = x GJ</p>
            </div>
            <div>
              <label style={lbl}>Hệ số quy đổi → TOE</label>
              <input type="number" step="any" value={source.conversionToTOE||catalog?.convToTOE||0}
                onChange={e=>up("conversionToTOE",+e.target.value)} style={inp}/>
              <p style={{ color:C.t2, fontSize:10, marginTop:3 }}>1 {source.primaryUnit||"Đv"} = x TOE</p>
            </div>
            <div>
              <label style={lbl}>Số đồng hồ đo</label>
              <input type="number" value={source.meterCount||0} onChange={e=>up("meterCount",+e.target.value)} style={inp}/>
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:12 }}>
              <label style={{ cursor:"pointer", color:C.t1, fontSize:12,
                display:"flex", alignItems:"center", gap:6 }}>
                <input type="checkbox" checked={!!source.meterCalibrated}
                  onChange={e=>up("meterCalibrated",e.target.checked)} style={{ width:15,height:15 }}/>
                Đồng hồ đã hiệu chuẩn
              </label>
            </div>
            <div>
              <label style={lbl}>Ngày hiệu chuẩn gần nhất</label>
              <input type="date" value={source.meterCalibDate||""} onChange={e=>up("meterCalibDate",e.target.value)} style={inp}/>
            </div>
          </div>

          {/* ── 2. SEU Assessment ──────────────────────────────── */}
          <SectionTitle>⚡ Đánh giá Nguồn NL Trọng điểm (SEU)</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ cursor:"pointer", color:C.amberL, fontSize:13,
                display:"flex", alignItems:"center", gap:8,
                background:`${C.amberL}12`, border:`1px solid ${C.amberL}44`,
                borderRadius:8, padding:"8px 14px", width:"fit-content" }}>
                <input type="checkbox" checked={!!source.is_seu}
                  onChange={e=>up("is_seu",e.target.checked)} style={{ width:16, height:16 }}/>
                ⚡ Xác định là Nguồn NL Trọng điểm (SEU)
              </label>
            </div>
            {source.is_seu && <>
              <div style={{ gridColumn:"1 / span 2" }}>
                <label style={lbl}>Lý do xác định SEU</label>
                <input value={source.seu_reason||""} onChange={e=>up("seu_reason",e.target.value)}
                  placeholder="VD: Chiếm >50% tổng tiêu thụ điện; sản lượng ~2.5 triệu kWh/năm…" style={inp}/>
              </div>
              <div>
                <label style={lbl}>% Tiêu thụ trong tổng NL</label>
                <input type="number" value={source.percentOfTotal||0} step="0.1"
                  onChange={e=>up("percentOfTotal",+e.target.value)} style={inp}/>
              </div>
            </>}
            <div>
              <label style={lbl}>Xu hướng tiêu thụ</label>
              <select value={source.trend||"unknown"} onChange={e=>up("trend",e.target.value)} style={inp}>
                {Object.entries(TREND_CFG).map(([v,c])=>(
                  <option key={v} value={v}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── 3. EnPI / EnB ──────────────────────────────────── */}
          <SectionTitle>📊 Chỉ số EnPI & Đường cơ sở EnB</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
            <div>
              <label style={lbl}>Loại EnPI</label>
              <input value={source.enpi_type||""} onChange={e=>up("enpi_type",e.target.value)}
                placeholder="kWh/tấn SP, kWh/m², TOE/tỷ đ…" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Giá trị EnPI hiện tại</label>
              <input type="number" step="any" value={source.enpi_value||0} onChange={e=>up("enpi_value",+e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Đơn vị EnPI</label>
              <input value={source.enpi_unit||""} onChange={e=>up("enpi_unit",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>EnB (giá trị cơ sở)</label>
              <input type="number" step="any" value={source.enpi_baseline||0} onChange={e=>up("enpi_baseline",+e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Mục tiêu EnPI</label>
              <input type="number" step="any" value={source.enpi_target||0} onChange={e=>up("enpi_target",+e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Mức độ ưu tiên</label>
              <select value={source.priority||""} onChange={e=>up("priority",e.target.value)} style={inp}>
                {Object.entries(PRIORITY_CFG).map(([v,c])=>(
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── 4. Monthly data ────────────────────────────────── */}
          <SectionTitle>📅 Dữ liệu tiêu thụ theo tháng</SectionTitle>
          <div style={{ marginBottom:18 }}>
            <MonthlyDataTable source={source} onMonthChange={handleMonthChange}/>
          </div>

          {/* ── 5. Secondary outputs ────────────────────────────── */}
          <div style={{ marginBottom:18 }}>
            <SecondaryOutputs source={source} onUpdate={up}/>
          </div>

          {/* ── 6. Audit questions ──────────────────────────────── */}
          {catalog?.auditQuestions?.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <SectionTitle>🔍 Câu hỏi đánh giá</SectionTitle>
              {catalog.auditQuestions.map((q, qi) => {
                const finding = (source.auditFindings||[])[qi] || {};
                return (
                  <div key={qi} style={{ background:C.bg3, borderRadius:8, padding:12,
                    marginBottom:8, border:`1px solid ${C.bd}` }}>
                    <p style={{ color:C.t1, fontSize:12, marginBottom:6,
                      paddingLeft:12, borderLeft:`2px solid ${C.amberL}50` }}>
                      {qi+1}. {q}
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8 }}>
                      <input value={finding.answer||""} placeholder="Ghi nhận câu trả lời…"
                        onChange={e => {
                          const arr = [...(source.auditFindings||[])];
                          arr[qi] = { ...arr[qi], question:q, answer:e.target.value };
                          up("auditFindings", arr);
                        }} style={inp}/>
                      <select value={finding.conformance||""}
                        onChange={e => {
                          const arr = [...(source.auditFindings||[])];
                          arr[qi] = { ...arr[qi], question:q, conformance:e.target.value };
                          up("auditFindings", arr);
                        }} style={inp}>
                        <option value="">— Đánh giá —</option>
                        {CONFORMANCE_CFG.map(c=>(
                          <option key={c.v} value={c.v}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 7. Overall finding + recommendation ─────────────── */}
          <SectionTitle>📝 Phát hiện tổng thể & Khuyến nghị</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
            <div>
              <label style={lbl}>Phát hiện chính</label>
              <textarea value={source.overallFinding||""} rows={3}
                onChange={e=>up("overallFinding",e.target.value)}
                placeholder="Tóm tắt tình trạng quản lý nguồn NL này…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={lbl}>Khuyến nghị</label>
              <textarea value={source.recommendation||""} rows={3}
                onChange={e=>up("recommendation",e.target.value)}
                placeholder="Biện pháp cải thiện hiệu quả sử dụng NL đề xuất…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
          </div>

          {/* ── 8. Evidence ────────────────────────────────────── */}
          <div style={{ background:C.bg3, borderRadius:8, padding:"10px 12px",
            border:`1px solid ${C.bd}` }}>
            <p style={{ color:C.t2, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:6 }}>
              📎 Bằng chứng — {source.energyType || source.sourceId}
            </p>
            <EvidencePanel evHook={evHook} stepKey={stepKey}
              note={`Nguồn NL: ${source.energyType}`} compact/>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{ color:C.tealL, fontSize:11, fontWeight:700,
      textTransform:"uppercase", letterSpacing:.5,
      marginBottom:10, borderBottom:`1px solid ${C.tealL}30`, paddingBottom:5 }}>
      {children}
    </p>
  );
}
