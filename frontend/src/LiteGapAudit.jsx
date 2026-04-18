/**
 * LiteGapAudit.jsx — Modal Lite GAP Audit (đánh giá nhanh hiện trường)
 *
 * Dùng khi Auditor cần input dữ liệu nhanh tại hiện trường:
 * 1. Thông tin Khách hàng + Đoàn đánh giá (tóm tắt, lấy từ phiên full)
 * 2. Bảng check đánh giá hồ sơ tài liệu theo ISO 50001:2018 §4–§10
 * 3. Bảng đánh giá khu vực hiện trường + upload ảnh
 * 4. Xuất báo cáo Lite (DOCX + HTML)
 */
import { useState, useMemo, useRef } from "react";
import { C, FONT, GAP_CHECKLIST as DEFAULT_CHECKLIST, SCORE_CFG } from "./gap.ui.constants.js";
import { Btn, Tag, Field, Input, TA, Sel, Modal, Grid } from "./gap.atoms.jsx";

const TABS = [
  { id: "info", icon: "🏭", label: "Thông tin chung" },
  { id: "check", icon: "📋", label: "Đánh giá GAP" },
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "site", icon: "🏗️", label: "Hiện trường" },
  { id: "export", icon: "📄", label: "Xuất báo cáo" },
];

const LITE_SCORES = [
  [0, "— Chưa đánh giá"],
  [1, "1 — Không đáp ứng"],
  [2, "2 — Đáp ứng một phần nhỏ"],
  [3, "3 — Đáp ứng một phần"],
  [4, "4 — Cơ bản đáp ứng"],
  [5, "5 — Đáp ứng đầy đủ"],
];

const AREA_TYPES = [
  "Khu vực sản xuất (Line/Xưởng)",
  "Khu vực năng lượng (Boiler/Chiller/Compressor)",
  "Kho nguyên vật liệu / Thành phẩm",
  "Văn phòng / Khu hành chính",
  "Hệ thống M&E / Phòng điện",
  "Khu vực ngoại vi / Sân bãi",
  "Khác",
];

const CLAUSE_KEYS = ["4", "5", "6", "7", "8", "9", "10"];
const CLAUSE_NAMES = {
  "4": "Bối cảnh tổ chức", "5": "Lãnh đạo", "6": "Hoạch định",
  "7": "Hỗ trợ", "8": "Vận hành", "9": "Đánh giá kết quả", "10": "Cải tiến"
};

/** Lấy điều khoản chính từ checklist */
function getClauseGroups(checklist) {
  const groups = {};
  checklist.forEach(item => {
    const clause = item.clause?.split(".")[0] || "?";
    if (!groups[clause]) groups[clause] = [];
    groups[clause].push(item);
  });
  return groups;
}

// ── Score colour helpers (mirrors backend) ──────────────────────
const SC_COL = ["#718096","#dc2626","#ea580c","#d97706","#059669","#0d9488"];
const SC_BG  = ["#F4F6F8","#FEE2E2","#FEF3C7","#FEF9E7","#D1FAE5","#CCFBF1"];
const SC_LBL = ["N/A","Chưa triển khai","Mới bắt đầu","Đang phát triển","Phần lớn đáp ứng","Hoàn toàn đáp ứng"];

// ── DashboardPanel ────────────────────────────────────────────────
function DashboardPanel({ checklist, resp, clauseGroups }) {
  const allScored  = checklist.filter(i => (resp[i.id]?.score || 0) > 0);
  const totalScore = allScored.reduce((a, i) => a + (resp[i.id]?.score || 0), 0);
  const avgScore   = allScored.length ? (totalScore / allScored.length) : 0;
  const maxScore   = allScored.length ? Math.max(...allScored.map(i => resp[i.id]?.score || 0)) : 0;
  const minScore   = allScored.length ? Math.min(...allScored.map(i => resp[i.id]?.score || 0)) : 0;

  const clauseStats = CLAUSE_KEYS.map(clause => {
    const items = clauseGroups[clause] || [];
    const scored = items.filter(i => (resp[i.id]?.score || 0) > 0);
    const avg = scored.length ? scored.reduce((a, i) => a + (resp[i.id]?.score || 0), 0) / scored.length : 0;
    return { clause, name: CLAUSE_NAMES[clause] || clause, total: items.length, scored: scored.length, avg };
  }).filter(s => s.total > 0);

  const scoreDist = [1,2,3,4,5].map(s => ({
    score: s, count: checklist.filter(i => (resp[i.id]?.score || 0) === s).length,
    label: SC_LBL[s], col: SC_COL[s],
  }));
  const totalDistCount = scoreDist.reduce((a, d) => a + d.count, 0);

  const kpiCol = avgScore >= 4 ? "#0d9488" : avgScore >= 3 ? "#059669" : avgScore >= 2 ? "#d97706" : "#dc2626";

  // Bar chart
  const BAR_W = 480, BAR_H = 200, BAR_PAD = 40, BAR_GAP = 8;
  const barCount = clauseStats.length;
  const barW = barCount > 0 ? Math.floor((BAR_W - BAR_PAD * 2 - BAR_GAP * (barCount - 1)) / barCount) : 60;

  // Donut chart
  const DONUT_R = 70, DONUT_CX = 90, DONUT_CY = 90;
  let startAngle = -Math.PI / 2;
  const donutSegs = scoreDist.filter(d => d.count > 0).map(d => {
    const angle = totalDistCount > 0 ? (d.count / totalDistCount) * 2 * Math.PI : 0;
    const x1 = DONUT_CX + DONUT_R * Math.cos(startAngle);
    const y1 = DONUT_CY + DONUT_R * Math.sin(startAngle);
    startAngle += angle;
    const x2 = DONUT_CX + DONUT_R * Math.cos(startAngle);
    const y2 = DONUT_CY + DONUT_R * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { ...d, path: `M${DONUT_CX},${DONUT_CY} L${x1.toFixed(1)},${y1.toFixed(1)} A${DONUT_R},${DONUT_R} 0 ${largeArc} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z` };
  });

  // Radar chart
  const RAD = 90, CX = 110, CY = 110, N = clauseStats.length;
  const getRadarPt = (idx, val) => {
    const angle = (2 * Math.PI * idx / N) - Math.PI / 2;
    return { x: CX + RAD * val * Math.cos(angle), y: CY + RAD * val * Math.sin(angle) };
  };
  const radarPts = clauseStats.map(s => s.avg / 5);
  const radarPoints = radarPts.map((v, i) => getRadarPt(i, v));
  const radarPath = radarPoints.length >= 3
    ? radarPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z"
    : "";
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const labelPts = clauseStats.map((s, i) => { const p = getRadarPt(i, 1.22); return { ...p, label: `§${s.clause}` }; });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: 12 }}>
        {[
          { icon: "📋", label: "Tổng điều khoản",  val: checklist.length, col: "#60a5fa" },
          { icon: "✅", label: "Đã đánh giá",       val: allScored.length, col: "#2dd4bf" },
          { icon: "⏳", label: "Chưa đánh giá",     val: checklist.length - allScored.length, col: "#d97706" },
          { icon: "⭐", label: "Điểm TB",            val: avgScore > 0 ? avgScore.toFixed(2)+"/5" : "—", col: kpiCol },
          { icon: "🔝", label: "Điểm cao nhất",      val: maxScore > 0 ? maxScore+"/5" : "—", col: "#059669" },
          { icon: "🔻", label: "Điểm thấp nhất",     val: minScore > 0 ? minScore+"/5" : "—", col: "#dc2626" },
          { icon: "📈", label: "Tỷ lệ đánh giá",    val: checklist.length > 0 ? Math.round(allScored.length/checklist.length*100)+"%" : "0%", col: "#7c3aed" },
        ].map(k => (
          <div key={k.label} style={{ background:`${k.col}12`, border:`1px solid ${k.col}30`, borderRadius:12, padding:"14px 12px", textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{k.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.col, fontFamily:"'Rajdhani',sans-serif", lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:11, color:"#7dd3fc", marginTop:4, textTransform:"uppercase", letterSpacing:"0.04em" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Bar + Donut */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Bar Chart */}
        <div style={{ background:"#0c2840", borderRadius:14, border:"1px solid rgba(56,189,248,.2)", padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#60a5fa", marginBottom:14 }}>📊 Điểm trung bình theo điều khoản</div>
          {clauseStats.length === 0
            ? <div style={{ color:"#7dd3fc", textAlign:"center", padding:30 }}>Chưa có dữ liệu.</div>
            : <svg width="100%" viewBox={`0 0 ${BAR_W} ${BAR_H+40}`} style={{ overflow:"visible" }}>
                {[1,2,3,4,5].map(v => {
                  const y = (BAR_H - BAR_PAD) - (v/5)*(BAR_H - BAR_PAD*2) + BAR_PAD;
                  return (<g key={v}>
                    <line x1={BAR_PAD} y1={y} x2={BAR_W-BAR_PAD} y2={y} stroke="rgba(56,189,248,0.12)" strokeWidth={1} strokeDasharray="4 4"/>
                    <text x={BAR_PAD-6} y={y+4} textAnchor="end" fontSize={9} fill="#7dd3fc">{v}</text>
                  </g>);
                })}
                {clauseStats.map((s, i) => {
                  const bh = s.avg > 0 ? ((s.avg/5)*(BAR_H-BAR_PAD*2)) : 2;
                  const bx = BAR_PAD + i*(barW+BAR_GAP);
                  const by = BAR_H - BAR_PAD - bh;
                  const col = SC_COL[Math.round(s.avg)] || "#60a5fa";
                  return (<g key={s.clause}>
                    <rect x={bx} y={by} width={barW} height={bh} fill={col} rx={4} opacity={0.85}/>
                    <text x={bx+barW/2} y={by-4} textAnchor="middle" fontSize={10} fill={col} fontWeight="700">{s.avg>0?s.avg.toFixed(1):"—"}</text>
                    <text x={bx+barW/2} y={BAR_H-BAR_PAD+14} textAnchor="middle" fontSize={11} fill="#c5e8fd" fontWeight="700">§{s.clause}</text>
                    <text x={bx+barW/2} y={BAR_H-BAR_PAD+26} textAnchor="middle" fontSize={9} fill="#7dd3fc">{s.scored}/{s.total}</text>
                  </g>);
                })}
                <line x1={BAR_PAD} y1={BAR_H-BAR_PAD} x2={BAR_W-BAR_PAD} y2={BAR_H-BAR_PAD} stroke="rgba(56,189,248,0.3)" strokeWidth={1}/>
              </svg>
          }
        </div>

        {/* Donut Chart */}
        <div style={{ background:"#0c2840", borderRadius:14, border:"1px solid rgba(56,189,248,.2)", padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#60a5fa", marginBottom:14 }}>🍩 Phân bố Điểm đánh giá</div>
          {totalDistCount === 0
            ? <div style={{ color:"#7dd3fc", textAlign:"center", padding:30 }}>Chưa có dữ liệu.</div>
            : <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                <svg width={180} height={180} viewBox="0 0 180 180">
                  {donutSegs.map((seg, i) => <path key={i} d={seg.path} fill={seg.col} opacity={0.85}/>)}
                  <circle cx={DONUT_CX} cy={DONUT_CY} r={36} fill="#0c2840"/>
                  <text x={DONUT_CX} y={DONUT_CY-4} textAnchor="middle" fontSize={18} fill="#f8fcff" fontWeight="800" fontFamily="Rajdhani,sans-serif">{avgScore>0?avgScore.toFixed(1):"—"}</text>
                  <text x={DONUT_CX} y={DONUT_CY+12} textAnchor="middle" fontSize={9} fill="#7dd3fc">Điểm TB</text>
                </svg>
                <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1, minWidth:100 }}>
                  {scoreDist.filter(d=>d.count>0).map(d=>(
                    <div key={d.score} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:d.col, flexShrink:0 }}/>
                      <div style={{ fontSize:11, color:"#c5e8fd", flex:1 }}>{d.score} — {d.label}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:d.col }}>{d.count}</div>
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>
      </div>

      {/* Radar + Summary Table */}
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16 }}>
        {/* Radar */}
        <div style={{ background:"#0c2840", borderRadius:14, border:"1px solid rgba(56,189,248,.2)", padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#60a5fa", marginBottom:10 }}>🕸️ Biểu đồ mạng nhện</div>
          {radarPoints.length < 3
            ? <div style={{ color:"#7dd3fc", fontSize:12, textAlign:"center", padding:20 }}>Cần ≥ 3 điều khoản.</div>
            : <svg width="100%" viewBox={`0 0 ${CX*2} ${CY*2}`} style={{ overflow:"visible" }}>
                {gridLevels.map(lv => (
                  <polygon key={lv} fill="none" stroke="rgba(56,189,248,0.15)" strokeWidth={1}
                    points={clauseStats.map((_,i)=>{ const p=getRadarPt(i,lv); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ")}/>
                ))}
                {clauseStats.map((_,i)=>{ const p=getRadarPt(i,1); return <line key={i} x1={CX} y1={CY} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="rgba(56,189,248,.2)" strokeWidth={1}/>; })}
                {radarPath && <polygon points={radarPoints.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} fill="#60a5fa22" stroke="#60a5fa" strokeWidth={2}/>}
                {radarPoints.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={4} fill={SC_COL[Math.round(clauseStats[i]?.avg||0)]||"#60a5fa"}/>)}
                {labelPts.map((p,i)=><text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" fontSize={11} fill="#c5e8fd" fontWeight="700">{p.label}</text>)}
                {gridLevels.map(lv=>{ const p=getRadarPt(0,lv); return <text key={lv} x={p.x+4} y={p.y} fontSize={8} fill="#7dd3fc">{(lv*5).toFixed(0)}</text>; })}
              </svg>
          }
        </div>

        {/* Summary Table */}
        <div style={{ background:"#0c2840", borderRadius:14, border:"1px solid rgba(56,189,248,.2)", padding:16, overflowX:"auto" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#60a5fa", marginBottom:12 }}>📋 Tổng hợp điểm theo điều khoản ISO 50001:2018</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:"#163d62" }}>
                {["Điều khoản","Tên nhóm","Số tiêu chí","Đã đánh giá","Điểm TB","Xếp loại","Thanh điểm"].map(h=>(
                  <th key={h} style={{ padding:"8px 10px", textAlign:"left", color:"#c5e8fd", fontWeight:700, fontSize:11, whiteSpace:"nowrap", borderBottom:"1px solid rgba(56,189,248,.2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clauseStats.map((s,i)=>{
                const col = SC_COL[Math.round(s.avg)]||"#718096";
                const pct = (s.avg/5)*100;
                return (
                  <tr key={s.clause} style={{ background:i%2?"rgba(22,61,98,.3)":"transparent", borderBottom:"1px solid rgba(56,189,248,.08)" }}>
                    <td style={{ padding:"8px 10px", fontFamily:"'Fira Code',monospace", color:"#60a5fa", fontWeight:700 }}>§{s.clause}</td>
                    <td style={{ padding:"8px 10px", color:"#f8fcff" }}>{s.name}</td>
                    <td style={{ padding:"8px 10px", color:"#c5e8fd", textAlign:"center" }}>{s.total}</td>
                    <td style={{ padding:"8px 10px", textAlign:"center" }}>
                      <span style={{ color:s.scored===s.total?"#2dd4bf":"#d97706", fontWeight:700 }}>{s.scored}</span>
                      <span style={{ color:"#7dd3fc" }}>/{s.total}</span>
                    </td>
                    <td style={{ padding:"8px 10px", textAlign:"center" }}>
                      <span style={{ color:col, fontWeight:800, fontSize:14, fontFamily:"'Rajdhani',sans-serif" }}>{s.avg>0?s.avg.toFixed(2):"—"}</span>
                      <span style={{ color:"#7dd3fc", fontSize:10 }}>/5</span>
                    </td>
                    <td style={{ padding:"8px 10px" }}>
                      <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:5, background:`${col}20`, color:col, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                        {s.avg===0?"Chưa đánh giá":SC_LBL[Math.round(s.avg)]}
                      </span>
                    </td>
                    <td style={{ padding:"8px 10px", minWidth:100 }}>
                      <div style={{ height:8, borderRadius:4, background:"rgba(56,189,248,.12)", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${col},${col}aa)`, borderRadius:4, transition:"width .4s" }}/>
                      </div>
                      <div style={{ fontSize:9, color:"#7dd3fc", marginTop:2, textAlign:"right" }}>{pct.toFixed(0)}%</div>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background:"#113352", borderTop:"2px solid rgba(56,189,248,.3)", fontWeight:700 }}>
                <td colSpan={3} style={{ padding:"10px", color:"#c5e8fd", textAlign:"right" }}>📊 Tổng cộng / Trung bình</td>
                <td style={{ padding:"10px", textAlign:"center" }}>
                  <span style={{ color:"#2dd4bf", fontWeight:800 }}>{allScored.length}</span>
                  <span style={{ color:"#7dd3fc" }}>/{checklist.length}</span>
                </td>
                <td style={{ padding:"10px", textAlign:"center" }}>
                  <span style={{ fontSize:16, fontWeight:800, color:kpiCol, fontFamily:"'Rajdhani',sans-serif" }}>{avgScore>0?avgScore.toFixed(2):"—"}</span>
                  <span style={{ color:"#7dd3fc", fontSize:10 }}>/5</span>
                </td>
                <td style={{ padding:"10px" }}>
                  <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:5, background:`${kpiCol}25`, color:kpiCol, fontSize:11, fontWeight:700 }}>
                    {avgScore>=4.5?"Xuất sắc":avgScore>=3.5?"Tốt":avgScore>=2.5?"Trung bình":avgScore>0?"Yếu":"Chưa đánh giá"}
                  </span>
                </td>
                <td style={{ padding:"10px", minWidth:100 }}>
                  <div style={{ height:10, borderRadius:5, background:"rgba(56,189,248,.12)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(avgScore/5)*100}%`, background:`linear-gradient(90deg,${kpiCol},#2dd4bf)`, borderRadius:5 }}/>
                  </div>
                  <div style={{ fontSize:9, color:"#7dd3fc", marginTop:2, textAlign:"right" }}>{((avgScore/5)*100).toFixed(0)}%</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function LiteGapAudit({ open, onClose, survey, setSurvey, apiUrl, onSave, setToast }) {
  const [tab, setTab] = useState("info");
  const [expandedClauses, setExpandedClauses] = useState({});

  // CRUD for contacts
  const [contactModal, setContactModal] = useState({ open: false, index: null });
  const [contactForm, setContactForm] = useState({ full_name: "", position: "", phone: "", email: "" });

  // CRUD for Custom Gap
  const [gapModal, setGapModal] = useState({ open: false, index: null });
  const [gapForm, setGapForm] = useState({ id: "", clause: "4", title: "", score: 0, note: "" });

  const [siteModal, setSiteModal] = useState({ open: false, index: null });
  const [siteForm, setSiteForm] = useState({ area: "", area_type: "", status: "", risk: "", opportunity: "", images: [] });
  const fileInputRef = useRef(null);

  const client = survey.client || {};
  const setClient = (k, v) => setSurvey(p => ({ ...p, client: { ...p.client, [k]: v } }));
  
  const verifier = survey.verifier || {};
  const setVerifier = (k, v) => setSurvey(p => ({ ...p, verifier: { ...p.verifier, [k]: v } }));
  
  const meta = survey.meta || {};
  const setMeta = (k, v) => setSurvey(p => ({ ...p, meta: { ...p.meta, [k]: v } }));

  const contacts = Array.isArray(client.contact_persons) ? client.contact_persons : [];
  const setContacts = arr => setClient("contact_persons", arr);

  const customGaps = Array.isArray(survey.lite_custom_gaps) ? survey.lite_custom_gaps : [];
  const setCustomGaps = arr => setSurvey(p => ({ ...p, lite_custom_gaps: arr }));

  const liteOverrides = survey.lite_overrides || {};
  const setLiteOverrides = map => setSurvey(p => ({ ...p, lite_overrides: map }));

  // Checklist merged with custom gaps and overriding logic
  const checklist = useMemo(() => {
    const customItems = customGaps.map(c => ({
      id: c.id, clause: c.clause, title: c.title, isCustom: true
    }));
    const standardItems = DEFAULT_CHECKLIST.filter(c => !liteOverrides[c.id]?.deleted).map(c => {
      if (liteOverrides[c.id]?.title) {
        return { ...c, title: liteOverrides[c.id].title, isEdited: true };
      }
      return c;
    });
    return [...standardItems, ...customItems];
  }, [customGaps, liteOverrides]);

  const resp = survey.responses || {};
  // For custom gaps, their score and note can also reside in responses matching their id
  const setResp = (id, key, val) => {
    setSurvey(p => ({
      ...p,
      responses: { ...p.responses, [id]: { ...p.responses?.[id], [key]: val } },
    }));
  };

  const clauseGroups = useMemo(() => getClauseGroups(checklist), [checklist]);
  const siteItems = Array.isArray(survey.lite_site_assessments) ? survey.lite_site_assessments : [];
  const setSiteItems = arr => setSurvey(p => ({ ...p, lite_site_assessments: arr }));

  // Contact CRUD logic
  const openContactAdd = () => {
    setContactForm({ full_name: "", position: "", phone: "", email: "" });
    setContactModal({ open: true, index: null });
  };
  const openContactEdit = (i) => {
    const c = contacts[i] || {};
    setContactForm({ full_name: c.full_name || "", position: c.position || "", phone: c.phone || "", email: c.email || "" });
    setContactModal({ open: true, index: i });
  };
  const saveContact = () => {
    if (!contactForm.full_name?.trim()) return;
    const next = [...contacts];
    if (contactModal.index === null) next.push({ ...contactForm });
    else next[contactModal.index] = { ...contactForm };
    setContacts(next);
    setContactModal({ open: false, index: null });
  };
  const removeContact = (i) => {
    if (confirm("Xóa người liên hệ này?")) setContacts(contacts.filter((_, idx) => idx !== i));
  };

  // Custom GAP CRUD logic
  const openGapAdd = () => {
    setGapForm({ id: "CUS-" + Date.now().toString().slice(-6), clause: "4", title: "", score: 0, note: "" });
    setGapModal({ open: true, index: null });
  };
  const openGapEdit = (id) => {
    const isCustom = id.startsWith("CUS-");
    let r;
    if (isCustom) {
      r = customGaps.find(g => g.id === id);
    } else {
      const orig = DEFAULT_CHECKLIST.find(c => c.id === id);
      r = { clause: orig?.clause?.split('.')[0] || "4", title: liteOverrides[id]?.title || orig?.title || "" };
    }
    if (!r) return;
    const s = resp[id]?.score || 0;
    const n = resp[id]?.note || "";
    setGapForm({ id, clause: r.clause, title: r.title, score: s, note: n });
    setGapModal({ open: true, index: id });
  };
  const saveGap = () => {
    if (!gapForm.title?.trim()) return;
    const isCustom = gapForm.id.startsWith("CUS-");
    if (isCustom) {
      const next = [...customGaps];
      const idx = next.findIndex(g => g.id === gapForm.id);
      if (idx === -1) {
        next.push({ id: gapForm.id, clause: gapForm.clause, title: gapForm.title });
      } else {
        next[idx] = { id: gapForm.id, clause: gapForm.clause, title: gapForm.title };
      }
      setCustomGaps(next);
    } else {
      setLiteOverrides({ ...liteOverrides, [gapForm.id]: { ...liteOverrides[gapForm.id], title: gapForm.title } });
    }
    setResp(gapForm.id, "score", gapForm.score);
    setResp(gapForm.id, "note", gapForm.note);
    setGapModal({ open: false, index: null });
  };
  const removeGap = (id) => {
    if (confirm("Xóa phát hiện GAP này?")) {
      if (id.startsWith("CUS-")) {
        setCustomGaps(customGaps.filter(g => g.id !== id));
      } else {
        setLiteOverrides({ ...liteOverrides, [id]: { ...liteOverrides[id], deleted: true } });
      }
    }
  };

  // Site CRUD logic
  const openSiteAdd = () => {
    setSiteForm({ area: "", area_type: AREA_TYPES[0], status: "", risk: "", opportunity: "", images: [] });
    setSiteModal({ open: true, index: null });
  };
  const openSiteEdit = (i) => {
    const r = siteItems[i] || {};
    setSiteForm({
      area: r.area || "", area_type: r.area_type || AREA_TYPES[0],
      status: r.status || "", risk: r.risk || "", opportunity: r.opportunity || "",
      images: Array.isArray(r.images) ? r.images : [],
    });
    setSiteModal({ open: true, index: i });
  };
  const saveSite = () => {
    if (!siteForm.area?.trim()) return;
    const next = [...siteItems];
    const row = { ...siteForm, area: siteForm.area.trim() };
    if (siteModal.index === null) next.push(row);
    else next[siteModal.index] = row;
    setSiteItems(next);
    setSiteModal({ open: false, index: null });
  };
  const removeSite = (i) => {
    if (confirm("Xóa khu vực này?")) setSiteItems(siteItems.filter((_, idx) => idx !== i));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const max = 800;
          let w = img.width, h = img.height;
          if (w > max || h > max) {
            if (w > h) { h = Math.round(h * max / w); w = max; }
            else { w = Math.round(w * max / h); h = max; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          setSiteForm(f => ({ ...f, images: [...f.images, dataUrl] }));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const removeImage = (idx) => setSiteForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  // Export handlers
  const [exporting, setExporting] = useState(false);
  const handleExportLite = async (type) => {
    // Validate basic requirements first
    if (!survey.meta?.ref_no || !survey.client?.name) {
      setToast?.({ type: "error", msg: "⚠️ Cần nhập Mã khảo sát và Tên tổ chức trước khi xuất báo cáo." });
      return;
    }
    // Always auto-save first to ensure latest Lite data is in DB
    let activeId = survey._id;
    if (onSave) {
      setExporting(true);
      try {
        const savedId = await onSave();
        if (savedId) activeId = savedId;
      } catch(e) {
        // Save failed, but continue if we have existing _id
      } finally {
        setExporting(false);
      }
    }
    if (!activeId) {
      setToast?.({ type: "error", msg: "⚠️ Cần lưu phiên trước khi xuất. (Kiểm tra Mã khảo sát và Tên tổ chức)" });
      return;
    }
    setExporting(true);
    try {
      // Resolve base URL — same logic as StepExport
      const b = apiUrl
        ? apiUrl.replace(/\/$/, "")
        : (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : "");
      // JWT token is injected by global main.jsx fetch interceptor automatically
      // But we add it explicitly here as a safety fallback
      const token = localStorage.getItem("gap_token") || "";
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`${b}/api/surveys/${activeId}/export-lite-${type}`, { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errCode = errData.code || "";
        // Handle auth errors specifically
        if (res.status === 401) {
          if (errCode === "TOKEN_EXPIRED") {
            setToast?.({ type: "error", msg: "⏰ Phiên đăng nhập hết hạn. Vui lòng tải lại trang và đăng nhập lại." });
          } else {
            setToast?.({ type: "error", msg: "🔒 Lỗi xác thực. Vui lòng đăng xuất và đăng nhập lại." });
          }
          return;
        }
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lite_GAP_${survey.meta?.ref_no || "Report"}.${type}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setToast?.({ type: "success", msg: `✅ Đã xuất Lite Report (${type.toUpperCase()}) thành công!` });
    } catch (err) {
      setToast?.({ type: "error", msg: "Lỗi xuất Lite: " + err.message });
    } finally { setExporting(false); }
  };

  if (!open) return null;

  const scored = checklist.filter(i => (resp[i.id]?.score || 0) > 0);
  const avgScore = scored.length > 0
    ? (scored.reduce((a, i) => a + ((resp[i.id].score || 0) * (i.weight || 1)), 0)
      / scored.reduce((a, i) => a + (i.weight || 1), 0)).toFixed(1)
    : "—";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        minHeight: 56, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, flexWrap: "wrap", gap: 12,
        background: `linear-gradient(135deg, ${C.bg1}, ${C.bg2})`, borderBottom: `1px solid ${C.bd0}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <span style={{
            fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700,
            background: `linear-gradient(135deg,${C.orange},${C.amber})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Lite GAP Audit</span>
          <Tag c={C.blue}>{meta.ref_no || "—"}</Tag>
          <Tag c={C.teal}>{scored.length}/{checklist.length} đã đánh giá</Tag>
          <Tag c={parseFloat(avgScore) >= 4 ? C.teal : parseFloat(avgScore) >= 3 ? C.green : C.orange}>TB: {avgScore}/5</Tag>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="blue" sz="sm" onClick={onSave}>💾 Lưu</Btn>
          <Btn v="ghost" sz="sm" onClick={onClose}>✕ Đóng</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, background: C.bg2, borderBottom: `1px solid ${C.bd0}`, overflowX: "auto", whiteSpace: "nowrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: "1 0 auto", padding: "12px 16px", background: tab === t.id ? `${C.blue}15` : "transparent",
            borderBottom: tab === t.id ? `3px solid ${C.blue}` : "3px solid transparent",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            color: tab === t.id ? C.blueL : C.t2, fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            transition: "all .2s",
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20, background: C.bg0 }}>

        {/* Tab: Thông tin */}
        {tab === "info" && (
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: C.bg2, borderRadius: 12, padding: 20, border: `1px solid ${C.bd0}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.blueL, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🏭</span> Thông tin Khách hàng
              </div>
              <Grid cols={2} gap={12}>
                <Field label="Tên tổ chức"><Input value={client.name || ""} onChange={v => setClient("name", v)} placeholder="Ví dụ: Công ty TNHH XYZ" /></Field>
                <Field label="Cơ sở / Nhà máy"><Input value={client.site || ""} onChange={v => setClient("site", v)} placeholder="Nhà máy Bắc Ninh" /></Field>
                <Field label="Địa chỉ" sx={{ gridColumn: "1/-1" }}><Input value={client.address || ""} onChange={v => setClient("address", v)} placeholder="Địa chỉ chi tiết..." /></Field>
                <Field label="Ngành nghề"><Input value={client.industry || ""} onChange={v => setClient("industry", v)} placeholder="Sản xuất..." /></Field>
                <Field label="Năng lượng tiêu thụ (TOE/năm)"><Input value={client.annual_energy || ""} onChange={v => setClient("annual_energy", v)} placeholder="Ví dụ: 1500" /></Field>
                <Field label="Người đại diện"><Input value={client.representative_name || ""} onChange={v => setClient("representative_name", v)} placeholder="Nguyễn Văn A" /></Field>
                <Field label="Chức vụ"><Input value={client.representative_position || ""} onChange={v => setClient("representative_position", v)} placeholder="Giám đốc" /></Field>
              </Grid>

              {/* CRUD Người liên hệ */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, textTransform: "uppercase" }}>Danh sách người liên hệ</div>
                  <Btn v="outline" sz="sm" onClick={openContactAdd}>＋ Thêm Liên hệ</Btn>
                </div>
                {contacts.length === 0 ? (
                  <div style={{ padding: 12, color: C.t3, background: C.bg3, borderRadius: 6, fontSize: 13 }}>Chưa có người liên hệ.</div>
                ) : (
                  <div style={{ border: `1px solid ${C.bd0}`, borderRadius: 8, overflowX: "auto" }}>
                    <table style={{ minWidth: 600, width: "100%", borderCollapse: "collapse", fontSize: 13, background: C.bg3 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.bd0}` }}>
                          <th style={{ padding: "8px 10px", textAlign: "left" }}>Họ Tên</th>
                          <th style={{ padding: "8px 10px", textAlign: "left" }}>Chức vụ</th>
                          <th style={{ padding: "8px 10px", textAlign: "left" }}>SĐT</th>
                          <th style={{ padding: "8px 10px", textAlign: "left" }}>Email</th>
                          <th style={{ padding: "8px 10px", width: 100 }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((c, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${C.bd2}`, background: i % 2 ? C.bg2 : "transparent" }}>
                            <td style={{ padding: "6px 10px", color: C.t0 }}>{c.full_name}</td>
                            <td style={{ padding: "6px 10px", color: C.t1 }}>{c.position}</td>
                            <td style={{ padding: "6px 10px", color: C.t1 }}>{c.phone}</td>
                            <td style={{ padding: "6px 10px", color: C.t1 }}>{c.email}</td>
                            <td style={{ padding: "6px 10px" }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <Btn v="ghost" sz="sm" onClick={() => openContactEdit(i)}>Sửa</Btn>
                                <Btn v="ghost" sz="sm" onClick={() => removeContact(i)} sx={{ color: C.red }}>Xóa</Btn>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: C.bg2, borderRadius: 12, padding: 20, border: `1px solid ${C.bd0}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.violet, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🔬</span> Đơn vị thực hiện
              </div>
              <Grid cols={2} gap={12}>
                <Field label="Tổ chức tư vấn"><Input value={verifier.org || ""} onChange={v => setVerifier("org", v)} placeholder="Tên đơn vị đánh giá" /></Field>
                <Field label="Số chứng chỉ"><Input value={verifier.cert_no || ""} onChange={v => setVerifier("cert_no", v)} placeholder="VD: ISO/IEC 17021" /></Field>
                <Field label="Trưởng đoàn đánh giá"><Input value={verifier.lead || ""} onChange={v => setVerifier("lead", v)} placeholder="Trưởng đoàn..." /></Field>
                <Field label="Thành viên / Chuyên gia"><Input value={verifier.team || ""} onChange={v => setVerifier("team", v)} placeholder="Chuyên gia..." /></Field>
                <Field label="Tiêu chuẩn áp dụng" sx={{ gridColumn: "1/-1" }}><Input value={verifier.std_applied || "ISO 50001:2018"} onChange={v => setVerifier("std_applied", v)} placeholder="ISO 50001:2018" /></Field>
              </Grid>
            </div>

            <div style={{ background: C.bg2, borderRadius: 12, padding: 20, border: `1px solid ${C.bd0}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.tealL, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>📅</span> Thời gian đánh giá
              </div>
              <Grid cols={3} gap={12}>
                <Field label="Mã khảo sát"><Input value={meta.ref_no || ""} onChange={v => setMeta("ref_no", v)} placeholder="VD: GAP-2026-001" /></Field>
                <Field label="Ngày khảo sát"><Input type="date" value={meta.survey_date || ""} onChange={v => setMeta("survey_date", v)} /></Field>
                <Field label="Phiên bản"><Input value={meta.version || "v1.0"} onChange={v => setMeta("version", v)} placeholder="v1.0" /></Field>
              </Grid>
            </div>
          </div>
        )}

        {/* Tab: Đánh giá GAP nhanh */}
        {tab === "check" && (
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.t0 }}>
                📋 Đánh giá hồ sơ tài liệu — ISO 50001:2018
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn v="outline" sz="sm" onClick={openGapAdd}>＋ Thêm phát hiện GAP</Btn>
                <Tag c={C.teal}>{scored.length} đã đánh giá</Tag>
                <Tag c={C.amber}>{checklist.length - scored.length} chưa</Tag>
              </div>
            </div>

            {CLAUSE_KEYS.map(clause => {
              const items = clauseGroups[clause] || [];
              if (items.length === 0) return null;
              
              const expanded = expandedClauses[clause] !== false; // default expanded
              const clauseScored = items.filter(i => (resp[i.id]?.score || 0) > 0);
              const clauseAvg = clauseScored.length > 0
                ? (clauseScored.reduce((a, i) => a + (resp[i.id].score || 0), 0) / clauseScored.length).toFixed(1) : "—";

              return (
                <div key={clause} style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.bd0}` }}>
                  <button onClick={() => setExpandedClauses(p => ({ ...p, [clause]: !expanded }))} style={{
                    width: "100%", padding: "12px 16px", background: C.bg3, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", flexWrap: "wrap", flexWrap: "wrap",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18, color: C.blueL, fontWeight: 700, fontFamily: "'Fira Code',monospace" }}>§{clause}</span>
                      <span style={{ fontSize: 14, color: C.t0, fontWeight: 600 }}>{CLAUSE_NAMES[clause] || ""}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Tag c={parseFloat(clauseAvg) >= 4 ? C.teal : parseFloat(clauseAvg) >= 3 ? C.green : parseFloat(clauseAvg) >= 1 ? C.orange : C.grey2}>
                        {clauseAvg}/5
                      </Tag>
                      <span style={{ fontSize: 12, color: C.t2 }}>{clauseScored.length}/{items.length}</span>
                      <span style={{ color: C.t2, fontSize: 14 }}>{expanded ? "▼" : "▶"}</span>
                    </div>
                  </button>

                  {expanded && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ minWidth: 600, width: "100%", borderCollapse: "collapse", fontSize: 13, background: C.bg2 }}>
                      <thead>
                        <tr style={{ background: C.bg3 }}>
                          <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, width: 80 }}>ID</th>
                          <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Yêu cầu / Phát hiện</th>
                          <th style={{ padding: "6px 10px", textAlign: "center", borderBottom: `1px solid ${C.bd0}`, width: 180 }}>Điểm</th>
                          <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, width: 280 }}>Nhận xét</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const sc = resp[item.id]?.score || 0;
                          const cfg = SCORE_CFG[sc] || SCORE_CFG[0];
                          return (
                            <tr key={item.id} style={{ background: idx % 2 ? C.bg2 : "transparent" }}>
                              <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace" }}>
                                <div style={{ color: item.isCustom ? C.violet : C.blueL, fontSize: 12, fontWeight: item.isCustom ? 700 : 400 }}>{item.isCustom ? "CUSTOM" : item.id}</div>
                                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                  <button onClick={() => openGapEdit(item.id)} style={{ border: "none", background: "none", color: C.t1, cursor: "pointer", fontSize: 11, padding: 0 }}>Sửa</button>
                                  <button onClick={() => removeGap(item.id)} style={{ border: "none", background: "none", color: C.red, cursor: "pointer", fontSize: 11, padding: 0 }}>Xóa</button>
                                </div>
                              </td>
                              <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0, lineHeight: 1.4 }}>
                                <div style={{ fontWeight: item.isCustom ? 600 : 400, color: item.isCustom ? C.violetL : C.t0 }}>{item.title}</div>
                                {item.legal && <div style={{ fontSize: 11, color: C.amber, marginTop: 2 }}>⚖️ {item.legal}</div>}
                              </td>
                              <td style={{ padding: "4px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                                <select value={sc} onChange={e => setResp(item.id, "score", parseInt(e.target.value))}
                                  style={{
                                    width: "100%", padding: "4px 6px", borderRadius: 6,
                                    background: `${cfg.col}15`, border: `1px solid ${cfg.col}40`,
                                    color: cfg.col, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                  }}>
                                  {LITE_SCORES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                              </td>
                              <td style={{ padding: "4px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                                <textarea value={resp[item.id]?.note || ""} onChange={e => setResp(item.id, "note", e.target.value)}
                                  placeholder="Nhận xét..."
                                  rows={1}
                                  style={{
                                    width: "100%", padding: "4px 8px", borderRadius: 6,
                                    background: C.bg3, border: `1px solid ${C.bd0}`, color: C.t0,
                                    fontSize: 12, resize: "vertical", minHeight: 28,
                                  }} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Dashboard */}
        {tab === "dashboard" && (
          <DashboardPanel checklist={checklist} resp={resp} clauseGroups={clauseGroups} />
        )}

        {/* Tab: Hiện trường */}
        {tab === "site" && (
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.t0 }}>
                🏗️ Đánh giá Khu vực / Nhà máy / Thiết bị
              </div>
              <Btn v="outline" sz="sm" onClick={openSiteAdd}>＋ Thêm khu vực</Btn>
            </div>

            {siteItems.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.t3, background: C.bg2, borderRadius: 12, border: `1px dashed ${C.bd0}` }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏭</div>
                <div style={{ fontSize: 15 }}>Chưa có khu vực nào. Nhấn "＋ Thêm khu vực" để bắt đầu đánh giá hiện trường.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                {siteItems.map((item, i) => (
                  <div key={i} style={{
                    background: C.bg2, borderRadius: 12, border: `1px solid ${C.bd0}`, overflow: "hidden",
                    transition: "transform .2s, box-shadow .2s",
                  }}>
                    <div style={{ padding: "12px 16px", background: C.bg3, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>{item.area}</div>
                        <Tag c={C.blue}>{item.area_type}</Tag>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Btn v="ghost" sz="sm" onClick={() => openSiteEdit(i)}>Sửa</Btn>
                        <Btn v="ghost" sz="sm" onClick={() => removeSite(i)} sx={{ color: C.red }}>Xóa</Btn>
                      </div>
                    </div>
                    <div style={{ padding: "12px 16px", fontSize: 13 }}>
                      {item.status && <div style={{ marginBottom: 6 }}><b style={{ color: C.tealL }}>Hiện trạng:</b> <span style={{ color: C.t0 }}>{item.status}</span></div>}
                      {item.risk && <div style={{ marginBottom: 6 }}><b style={{ color: C.red }}>Rủi ro:</b> <span style={{ color: C.t1 }}>{item.risk}</span></div>}
                      {item.opportunity && <div style={{ marginBottom: 6 }}><b style={{ color: C.green }}>Cơ hội cải tiến:</b> <span style={{ color: C.t1 }}>{item.opportunity}</span></div>}
                    </div>
                    {item.images?.length > 0 && (
                      <div style={{ padding: "0 16px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {item.images.map((img, j) => (
                          <img key={j} src={img} alt={`area-${i}-img-${j}`}
                            style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.bd0}` }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Xuất báo cáo */}
        {tab === "export" && (
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{
              background: `linear-gradient(135deg, ${C.bg2}, ${C.bg3})`,
              borderRadius: 16, padding: 32, textAlign: "center",
              border: `1px solid ${C.orange}30`,
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, color: C.orangeL, marginBottom: 8 }}>
                Xuất Báo cáo Lite GAP
              </div>
              <div style={{ fontSize: 14, color: C.t1, lineHeight: 1.7, marginBottom: 24 }}>
                Bao gồm: Thông tin DN & Đoàn đánh giá · Kết quả GAP §4–§10 · Đánh giá hiện trường kèm hình ảnh
              </div>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                <Btn v="orange" sz="lg" onClick={() => handleExportLite("docx")} loading={exporting} disabled={exporting}>
                  📄 Tải báo cáo DOCX
                </Btn>
                <Btn v="amber" sz="lg" onClick={() => handleExportLite("html")} loading={exporting} disabled={exporting}>
                  🌐 Tải báo cáo HTML
                </Btn>
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: C.t2 }}>
                {survey._id
                  ? `✅ Phiên đã lưu (ID: ${String(survey._id).slice(-8)}...) — sẵn sàng xuất`
                  : `💾 Nhấn xuất sẽ tự động lưu phiên trước (cần Mã khảo sát và Tên tổ chức)`
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={contactModal.open} onClose={() => setContactModal({ open: false, index: null })} title={contactModal.index === null ? "Thêm người liên hệ" : "Sửa người liên hệ"}>
        <Grid cols={1} gap={12}>
          <Field label="Họ và tên *"><Input value={contactForm.full_name} onChange={v => setContactForm(f => ({ ...f, full_name: v }))} /></Field>
          <Field label="Chức vụ"><Input value={contactForm.position} onChange={v => setContactForm(f => ({ ...f, position: v }))} /></Field>
          <Field label="Điện thoại"><Input value={contactForm.phone} onChange={v => setContactForm(f => ({ ...f, phone: v }))} /></Field>
          <Field label="Email"><Input value={contactForm.email} onChange={v => setContactForm(f => ({ ...f, email: v }))} /></Field>
        </Grid>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn v="ghost" sz="md" onClick={() => setContactModal({ open: false, index: null })}>Hủy</Btn>
          <Btn v="blue" sz="md" onClick={saveContact}>Lưu</Btn>
        </div>
      </Modal>

      <Modal open={gapModal.open} onClose={() => setGapModal({ open: false, index: null })} title={gapModal.index === null ? "Thêm phát hiện GAP" : "Sửa phát hiện GAP"}>
        <Grid cols={1} gap={12}>
          <Field label="Điều khoản ISO (4-10) (Chỉ sửa được khi Thêm mới)">
            <Sel value={gapForm.clause} onChange={v => setGapForm(f => ({...f, clause: v}))} options={CLAUSE_KEYS.map(k => [k, "Điều khoản " + k + " - " + CLAUSE_NAMES[k]])} disabled={gapForm.id && !gapForm.id.startsWith("CUS-")} />
          </Field>
          <Field label="Nội dung phát hiện *">
            <TA value={gapForm.title} onChange={v => setGapForm(f => ({ ...f, title: v }))} rows={3} />
          </Field>
          <Field label="Điểm đánh giá">
            <Sel value={gapForm.score} onChange={v => setGapForm(f => ({ ...f, score: parseInt(v) }))} options={LITE_SCORES.map(([v,l]) => [v, l])} />
          </Field>
          <Field label="Nhận xét">
            <TA value={gapForm.note} onChange={v => setGapForm(f => ({ ...f, note: v }))} rows={2} />
          </Field>
        </Grid>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn v="ghost" sz="md" onClick={() => setGapModal({ open: false, index: null })}>Hủy</Btn>
          <Btn v="blue" sz="md" onClick={saveGap}>Lưu</Btn>
        </div>
      </Modal>

      <Modal open={siteModal.open} onClose={() => setSiteModal({ open: false, index: null })}
        title={siteModal.index === null ? "Thêm khu vực đánh giá" : "Sửa khu vực đánh giá"} width={600}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Tên khu vực / Máy / Line *" required>
            <Input value={siteForm.area} onChange={v => setSiteForm(f => ({ ...f, area: v }))} placeholder="VD: Xưởng Ép Nhựa A3, Line CNC-02" />
          </Field>
          <Field label="Loại khu vực">
            <Sel value={siteForm.area_type} onChange={v => setSiteForm(f => ({ ...f, area_type: v }))} options={AREA_TYPES.map(t => [t, t])} />
          </Field>
          <Field label="Hiện trạng vận hành">
            <TA value={siteForm.status} onChange={v => setSiteForm(f => ({ ...f, status: v }))} rows={2} placeholder="Mô tả hiện trạng máy móc, thiết bị..." />
          </Field>
          <Field label="Rủi ro phát hiện">
            <TA value={siteForm.risk} onChange={v => setSiteForm(f => ({ ...f, risk: v }))} rows={2} placeholder="Rò rỉ hơi, dung môi..." />
          </Field>
          <Field label="Cơ hội cải tiến năng lượng">
            <TA value={siteForm.opportunity} onChange={v => setSiteForm(f => ({ ...f, opportunity: v }))} rows={2} placeholder="Lắp biến tần, thay đèn..." />
          </Field>
          <Field label="Hình ảnh hiện trường">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {siteForm.images.map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={img} alt="" style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.bd0}` }} />
                  <button onClick={() => removeImage(i)} style={{
                    position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                    background: C.red, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1,
                  }}>×</button>
                </div>
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
            <Btn v="outline" sz="sm" onClick={() => fileInputRef.current?.click()}>📷 Chụp / Tải ảnh</Btn>
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Btn v="ghost" sz="md" onClick={() => setSiteModal({ open: false, index: null })}>Hủy</Btn>
            <Btn v="blue" sz="md" onClick={saveSite}>Lưu</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
