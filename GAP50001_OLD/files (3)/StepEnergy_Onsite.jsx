/**
 * StepEnergy_Onsite — Tiếp cận theo Nguồn Năng lượng Sử dụng (Main Shell)
 * Tích hợp: Summary KPIs, Danh sách nguồn NL, CRUD, câu hỏi tổng quát, lưu API
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { EnergySourceCard } from "./StepEnergy_SourceCard";
import EvidencePanel        from "./EvidencePanel";
import {
  ENERGY_TYPE_CATALOG, GENERAL_ENERGY_QUESTIONS, DATA_QUALITY_CFG,
  VN_THRESHOLDS, fmtNum, fmtCost, MONTHS_VI, genMonthlyData,
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

let _srcCounter = 1;
function genSourceId() { return `ES-${String(_srcCounter++).padStart(3,"0")}`; }

function newSource(overrides = {}) {
  const yearNow = new Date().getFullYear();
  return {
    sourceId:        genSourceId(),
    energyType:      "",
    _energyTypeId:   "",
    category:        "primary",
    supplier:        "",
    primaryUnit:     "kWh",
    secondaryUnit:   "GJ",
    tertiaryUnit:    "TOE",
    conversionToGJ:  0,
    conversionToTOE: 0,
    meterCount:      0,
    meterCalibrated: false,
    meterCalibDate:  "",
    annual_primary:  0,
    annual_GJ:       0,
    annual_TOE:      0,
    annual_cost:     0,
    avg_unit_price:  0,
    monthlyData:     genMonthlyData(yearNow),
    percentOfTotal:  0,
    is_seu:          false,
    seu_reason:      "",
    trend:           "unknown",
    enpi_type:       "",
    enpi_value:      0,
    enpi_unit:       "",
    enpi_baseline:   0,
    enpi_target:     0,
    secondaryOutputs:[],
    auditFindings:   [],
    overallFinding:  "",
    recommendation:  "",
    priority:        "",
    regulatoryRef:   [],
    ...overrides,
  };
}

// ── Simple horizontal bar chart ────────────────────────────────────
function EnergyBarChart({ sources }) {
  const maxTOE = Math.max(...sources.map(s => s.annual_TOE || 0), 1);
  return (
    <div style={{ background:C.bg3, borderRadius:10, padding:14,
      border:`1px solid ${C.bd}`, marginBottom:18 }}>
      <p style={{ color:C.t1, fontWeight:700, fontSize:12,
        textTransform:"uppercase", marginBottom:12 }}>
        📊 Cơ cấu tiêu thụ theo nguồn NL (TOE/năm)
      </p>
      {sources.length === 0 && (
        <p style={{ color:C.t2, fontSize:12 }}>Chưa có dữ liệu.</p>
      )}
      {sources.map((s, i) => {
        const cat = ENERGY_TYPE_CATALOG.find(e => e.label === s.energyType);
        const pct = ((s.annual_TOE || 0) / maxTOE) * 100;
        const col = cat?.color || C.blueL;
        return (
          <div key={i} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:3 }}>
              <span style={{ fontSize:12, color:C.t0 }}>
                {cat?.icon||"⚡"} {s.energyType || s.sourceId}
                {s.is_seu && <span style={{ color:C.amberL, marginLeft:5, fontSize:10 }}>⚡SEU</span>}
              </span>
              <span style={{ fontSize:12, color:col, fontWeight:700 }}>
                {fmtNum(s.annual_TOE, 2)} TOE ({s.percentOfTotal||0}%)
              </span>
            </div>
            <div style={{ height:10, background:C.bg2, borderRadius:5, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(pct,100)}%`,
                background:col, borderRadius:5, transition:"width .4s" }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Large consumer alert ────────────────────────────────────────────
function LargeConsumerBadge({ totalTOE }) {
  const isLarge = totalTOE >= VN_THRESHOLDS.large_consumer_TOE;
  return (
    <div style={{
      background: isLarge ? `${C.redL}12` : `${C.greenL}12`,
      border: `1px solid ${isLarge ? C.redL : C.greenL}44`,
      borderRadius:10, padding:"12px 16px", marginBottom:16,
    }}>
      <p style={{ color: isLarge ? C.redL : C.greenL, fontWeight:700, fontSize:13, margin:0 }}>
        {isLarge ? "🔴 Cơ sở Sử dụng Năng lượng Trọng điểm" : "🟢 Chưa đến ngưỡng Trọng điểm"}
      </p>
      <p style={{ color:C.t2, fontSize:11, margin:"4px 0 0" }}>
        Tổng tiêu thụ ước tính: <strong style={{ color:isLarge?C.redL:C.greenL }}>
          {fmtNum(totalTOE,1)} TOE/năm
        </strong>
        {" "}(Ngưỡng trọng điểm: {VN_THRESHOLDS.large_consumer_TOE.toLocaleString()} TOE/năm — Luật 50/2010 §3)
      </p>
      {isLarge && (
        <p style={{ color:C.amberL, fontSize:11, margin:"4px 0 0" }}>
          ⚠️ Cơ sở có nghĩa vụ: đăng ký với BCT, nộp báo cáo NL (31/3 hàng năm),
          kiểm toán NL định kỳ 3 năm, bổ nhiệm EMR có chứng chỉ.
        </p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function StepEnergy_Onsite({ surveyId, apiUrl="", evHook, onSave, saving }) {
  const ab = (apiUrl||"").replace(/\/$/,"");

  const [profile,   setProfile  ] = useState(null);
  const [loading,   setLoading  ] = useState(false);
  const [expanded,  setExpanded ] = useState({});
  const [tab,       setTab      ] = useState("sources"); // sources|general|summary
  const [genAnswers,setGenAnswers] = useState({});
  const [profileMeta, setProfileMeta] = useState({
    baseline_year: String(new Date().getFullYear()-1),
    review_period: "",
    data_quality:  "unknown",
    overall_comment: "",
  });

  // ── Load profile ────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    try {
      const res = await fetch(`${ab}/api/energy-profiles/by-survey/${surveyId}`);
      if (res.status === 404) { setProfile({ sources:[], surveyId }); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setProfile(d);
      setProfileMeta({
        baseline_year:   d.baseline_year    || String(new Date().getFullYear()-1),
        review_period:   d.review_period    || "",
        data_quality:    d.data_quality     || "unknown",
        overall_comment: d.overall_comment  || "",
      });
      if (d.generalAnswers) setGenAnswers(d.generalAnswers);
      // reset counter
      if (d.sources?.length) {
        const nums = d.sources.map(s=>parseInt(s.sourceId?.replace("ES-",""))||0).filter(Boolean);
        if (nums.length) _srcCounter = Math.max(...nums) + 1;
      }
    } catch(_) { setProfile({ sources:[], surveyId }); }
    finally { setLoading(false); }
  }, [surveyId, ab]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Save profile ────────────────────────────────────────────────
  const saveProfile = useCallback(async (silent=false) => {
    if (!surveyId || !profile) return;
    try {
      const body = {
        ...profile, ...profileMeta,
        generalAnswers: genAnswers,
        surveyId,
      };
      const res = await fetch(`${ab}/api/energy-profiles/by-survey/${surveyId}`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();
      setProfile(saved);
      if (!silent) onSave?.("success","✓ Đã lưu hồ sơ nguồn NL.");
    } catch(e) { onSave?.("error","Lỗi lưu: "+e.message); }
  }, [surveyId, ab, profile, profileMeta, genAnswers, onSave]);

  // ── Source CRUD ─────────────────────────────────────────────────
  const addSource = () => {
    const src = newSource();
    setProfile(p => ({ ...p, sources:[...(p?.sources||[]), src] }));
    setExpanded(e=>({...e,[src.sourceId]:true}));
  };

  const updateSource = useCallback((idOrSid, field, val) => {
    setProfile(p => {
      const sources = (p?.sources||[]).map(s => {
        if (String(s._id||s.sourceId) === String(idOrSid) || s.sourceId === idOrSid) {
          return { ...s, [field]:val };
        }
        return s;
      });
      return { ...p, sources };
    });
  }, []);

  const deleteSource = (idOrSid) => {
    if (!confirm("Xóa nguồn NL này?")) return;
    setProfile(p => ({
      ...p,
      sources:(p?.sources||[]).filter(s => String(s._id||s.sourceId)!==String(idOrSid) && s.sourceId!==idOrSid),
    }));
  };

  // ── Computed totals ─────────────────────────────────────────────
  const totals = useMemo(() => {
    const sources = profile?.sources || [];
    const toe  = sources.reduce((a,s)=>a+(s.annual_TOE ||0),0);
    const gj   = sources.reduce((a,s)=>a+(s.annual_GJ  ||0),0);
    const cost = sources.reduce((a,s)=>a+(s.annual_cost||0),0);
    const seus = sources.filter(s=>s.is_seu).length;
    // recalc percent
    if (toe > 0) {
      sources.forEach(s => { s.percentOfTotal = +((s.annual_TOE||0)/toe*100).toFixed(2); });
    }
    return { toe, gj, cost, seus, count:sources.length };
  }, [profile?.sources]);

  if (loading) return <p style={{ color:C.t2, padding:20 }}>Đang tải hồ sơ năng lượng…</p>;

  const sources = profile?.sources || [];
  const stepKeyGeneral = "energy-general";

  return (
    <div>
      {/* ── Top KPIs ─────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        {[
          { l:"Tổng TOE/năm",  v:fmtNum(totals.toe,1),          col:C.amberL },
          { l:"Tổng GJ/năm",   v:fmtNum(totals.gj,0),           col:C.blueL  },
          { l:"Chi phí NL/năm",v:fmtCost(totals.cost),          col:C.greenL },
          { l:"Nguồn NL",      v:totals.count,                   col:C.tealL  },
          { l:"SEU",           v:totals.seus,                    col:C.orangeL||"#f97316" },
          { l:"Bằng chứng",    v:evHook.evidence.filter(e=>e.stepKey?.startsWith("energy-")).length, col:C.violet },
        ].map(k=>(
          <div key={k.l} style={{ background:`${k.col}14`, border:`1px solid ${k.col}30`,
            borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:100 }}>
            <div style={{ fontSize:18, fontWeight:800, color:k.col }}>{k.v}</div>
            <div style={{ fontSize:10, color:C.t2, fontWeight:700, textTransform:"uppercase" }}>{k.l}</div>
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={addSource}
            style={{ padding:"8px 18px", background:`${C.amberL}22`, border:`1px solid ${C.amberL}55`,
              color:C.amberL, borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            ➕ Thêm nguồn NL
          </button>
          <button onClick={()=>saveProfile(false)} disabled={saving}
            style={{ padding:"8px 18px", background:saving?C.t3:C.tealL,
              color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            {saving?"⏳ Đang lưu…":"💾 Lưu hồ sơ NL"}
          </button>
        </div>
      </div>

      {/* ── Large consumer badge ─────────────────────────────── */}
      <LargeConsumerBadge totalTOE={totals.toe}/>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:`1px solid ${C.bd}`, paddingBottom:8 }}>
        {[["sources","⚡ Nguồn NL"],["general","📋 Câu hỏi tổng quát"],["summary","📊 Tổng hợp"]].map(([id,lbl2])=>(
          <button key={id} onClick={()=>setTab(id)} style={{
            padding:"6px 16px", borderRadius:"8px 8px 0 0", fontWeight:700, fontSize:12,
            border:"none", cursor:"pointer",
            background:tab===id?C.blue:"transparent",
            color:tab===id?"#fff":C.blueL,
          }}>{lbl2}</button>
        ))}
      </div>

      {/* ── Tab: Sources ─────────────────────────────────────── */}
      {tab==="sources" && (
        <div>
          {/* Metadata row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
            <div>
              <label style={lbl}>Năm cơ sở (EnB)</label>
              <input value={profileMeta.baseline_year} onChange={e=>setProfileMeta(m=>({...m,baseline_year:e.target.value}))} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Kỳ rà soát</label>
              <input value={profileMeta.review_period} onChange={e=>setProfileMeta(m=>({...m,review_period:e.target.value}))}
                placeholder="2023-01 → 2023-12" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Chất lượng dữ liệu</label>
              <select value={profileMeta.data_quality} onChange={e=>setProfileMeta(m=>({...m,data_quality:e.target.value}))} style={inp}>
                {Object.entries(DATA_QUALITY_CFG).map(([v,c])=>(
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Nhận xét tổng quan</label>
              <input value={profileMeta.overall_comment} onChange={e=>setProfileMeta(m=>({...m,overall_comment:e.target.value}))}
                placeholder="Nhận xét chung về cơ cấu NL…" style={inp}/>
            </div>
          </div>

          {sources.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 20px",
              background:C.bg2, borderRadius:12, border:`1px dashed ${C.bd}` }}>
              <p style={{ color:C.amberL, fontSize:36, marginBottom:8 }}>⚡</p>
              <p style={{ color:C.t0, fontWeight:700, fontSize:15, marginBottom:6 }}>
                Chưa có nguồn năng lượng nào
              </p>
              <p style={{ color:C.t2, fontSize:13, marginBottom:18 }}>
                Thêm từng loại NL sử dụng tại cơ sở:<br/>
                Điện, Khí tự nhiên, Dầu FO/DO, Than, LPG, Hơi nước, Sinh khối…
              </p>
              <button onClick={addSource}
                style={{ padding:"10px 28px", background:C.amberL, color:"#000",
                  border:"none", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                ➕ Thêm nguồn NL đầu tiên
              </button>
            </div>
          )}

          {sources.map((src, idx) => (
            <EnergySourceCard key={src._id||src.sourceId} source={src} idx={idx}
              onUpdate={updateSource}
              onDelete={deleteSource}
              evHook={evHook}
              expanded={!!expanded[src._id||src.sourceId]}
              onToggle={() => {
                const k = src._id||src.sourceId;
                setExpanded(e=>({...e,[k]:!e[k]}));
              }}/>
          ))}
        </div>
      )}

      {/* ── Tab: General questions ────────────────────────────── */}
      {tab==="general" && (
        <div>
          <p style={{ color:C.t2, fontSize:13, marginBottom:16 }}>
            Câu hỏi đánh giá tổng quan về quản lý năng lượng (§6.3 Energy Review — ISO 50001:2018)
          </p>
          {GENERAL_ENERGY_QUESTIONS.map((item, i) => (
            <div key={item.id} style={{ background:C.bg2, borderRadius:8, padding:12,
              marginBottom:8, border:`1px solid ${C.bd}` }}>
              <p style={{ color:C.t1, fontSize:12, marginBottom:6,
                paddingLeft:12, borderLeft:`2px solid ${C.amberL}40` }}>
                {i+1}. {item.q}
              </p>
              <textarea value={genAnswers[item.id]||""} rows={2}
                onChange={e=>setGenAnswers(a=>({...a,[item.id]:e.target.value}))}
                placeholder="Ghi nhận câu trả lời tại hiện trường…"
                style={{ ...inp, resize:"vertical" }}/>
            </div>
          ))}
          {/* Evidence for general energy section */}
          <div style={{ background:C.bg3, borderRadius:8, padding:"10px 12px",
            border:`1px solid ${C.bd}`, marginTop:14 }}>
            <p style={{ color:C.t2, fontSize:11, fontWeight:700,
              textTransform:"uppercase", marginBottom:6 }}>
              📎 Bằng chứng — Rà soát năng lượng tổng thể
            </p>
            <EvidencePanel evHook={evHook} stepKey={stepKeyGeneral}
              note="Rà soát năng lượng ISO 50001 §6.3"/>
          </div>
        </div>
      )}

      {/* ── Tab: Summary ─────────────────────────────────────── */}
      {tab==="summary" && (
        <div>
          <EnergyBarChart sources={sources}/>
          {/* Summary table */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${C.bd}` }}>
                  {["Nguồn NL","Đơn vị SP","Lượng/năm","GJ/năm","TOE/năm","%Tổng","Chi phí","SEU","Xu hướng","Ưu tiên"]
                    .map(h=>(
                    <th key={h} style={{ padding:"8px 10px", color:C.t2, fontWeight:700,
                      textAlign:"center", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => {
                  const cat = ENERGY_TYPE_CATALOG.find(e=>e.label===s.energyType);
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.t3}22` }}>
                      <td style={{ padding:"8px 10px", color:C.t0, fontWeight:600 }}>
                        {cat?.icon||"⚡"} {s.energyType||s.sourceId}
                      </td>
                      <td style={{ padding:"8px 10px", color:C.t2, textAlign:"center" }}>{s.primaryUnit}</td>
                      <td style={{ padding:"8px 10px", color:C.t0, textAlign:"right" }}>{fmtNum(s.annual_primary,0)}</td>
                      <td style={{ padding:"8px 10px", color:C.tealL, textAlign:"right" }}>{fmtNum(s.annual_GJ,1)}</td>
                      <td style={{ padding:"8px 10px", color:C.greenL, textAlign:"right",fontWeight:700 }}>{fmtNum(s.annual_TOE,2)}</td>
                      <td style={{ padding:"8px 10px", color:C.amberL, textAlign:"center",fontWeight:700 }}>{s.percentOfTotal||0}%</td>
                      <td style={{ padding:"8px 10px", color:C.t1, textAlign:"right" }}>{fmtCost(s.annual_cost)}</td>
                      <td style={{ padding:"8px 10px", textAlign:"center" }}>{s.is_seu?"⚡ SEU":""}</td>
                      <td style={{ padding:"8px 10px", textAlign:"center" }}>
                        {({increasing:"📈",stable:"➡️",decreasing:"📉",unknown:"❓"})[s.trend]||"❓"}
                      </td>
                      <td style={{ padding:"8px 10px", textAlign:"center" }}>
                        <span style={{ background:`${{critical:"#ef444420",high:"#f9731620",medium:"#f59e0b20",low:"#22c55e20","":"transparent"}[s.priority||""]}`,
                          color:{critical:"#ef4444",high:"#f97316",medium:"#f59e0b",low:"#22c55e","":"#718096"}[s.priority||""],
                          borderRadius:4,padding:"1px 7px",fontSize:11,fontWeight:700 }}>
                          {{critical:"Khẩn",high:"Cao",medium:"TB",low:"Thấp","":"—"}[s.priority||""]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop:`2px solid ${C.amberL}50`,background:`${C.amberL}10`,fontWeight:800 }}>
                  <td colSpan={2} style={{ padding:"8px 10px",color:C.amberL }}>TỔNG CỘNG</td>
                  <td/>
                  <td style={{ padding:"8px 10px",color:C.tealL,textAlign:"right" }}>{fmtNum(totals.gj,1)}</td>
                  <td style={{ padding:"8px 10px",color:C.greenL,textAlign:"right" }}>{fmtNum(totals.toe,2)}</td>
                  <td style={{ padding:"8px 10px",color:C.amberL,textAlign:"center" }}>100%</td>
                  <td style={{ padding:"8px 10px",color:C.amberL,textAlign:"right" }}>{fmtCost(totals.cost)}</td>
                  <td colSpan={3}/>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
